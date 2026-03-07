'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Card, Col, Grid, Row, Space, Spin, Tag, Typography } from 'antd';
import {
    ClockCircleOutlined,
    PlayCircleOutlined,
    StopOutlined,
    RiseOutlined,
    HistoryOutlined,
    ReloadOutlined,
    WalletOutlined,
    ShoppingOutlined,
    SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useRouter, useSearchParams } from 'next/navigation';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import 'dayjs/locale/th';

import { useSocket } from '../../../../hooks/useSocket';
import { useAuth } from '../../../../contexts/AuthContext';
import { useRoleGuard } from '../../../../utils/pos/accessControl';
import { useEffectivePermissions } from '../../../../hooks/useEffectivePermissions';
import { useShift } from '../../../../contexts/pos/ShiftContext';
import { shiftsService } from '../../../../services/pos/shifts.service';
import { ShiftSummary } from '../../../../types/api/pos/shifts';
import { RealtimeEvents } from '../../../../utils/realtimeEvents';
import { useRealtimeRefresh } from '../../../../utils/pos/realtime';
import { AccessGuardFallback } from '../../../../components/pos/AccessGuard';
import OpenShiftModal from '../../../../components/pos/shifts/OpenShiftModal';
import CloseShiftModal from '../../../../components/pos/shifts/CloseShiftModal';
import PageContainer from '../../../../components/ui/page/PageContainer';
import PageSection from '../../../../components/ui/page/PageSection';
import PageStack from '../../../../components/ui/page/PageStack';
import UIPageHeader from '../../../../components/ui/page/PageHeader';
import PageState from '../../../../components/ui/states/PageState';
import { pageStyles, globalStyles } from '../../../../theme/pos/shift/style';

const { Text, Title } = Typography;

dayjs.extend(duration);
dayjs.locale('th');

const toNumber = (value: number | string | undefined | null) => Number(value || 0);

const formatMoney = (value: number | string | undefined | null) =>
    `฿${toNumber(value).toLocaleString('th-TH')}`;

export default function ShiftPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const { socket, isConnected } = useSocket();
    const { isAuthorized, isChecking } = useRoleGuard();
    const { can, loading: permissionLoading } = useEffectivePermissions({
        enabled: Boolean(user?.id),
    });
    const { currentShift, loading: shiftLoading, refreshShift } = useShift();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;

    const canCreateShifts = can('shifts.page', 'create');
    const canUpdateShifts = can('shifts.page', 'update');
    const redirectAfterOpen = searchParams.get('redirect') || '';
    const openShiftRequested = searchParams.get('openShift') === '1';

    const [openShiftVisible, setOpenShiftVisible] = useState(false);
    const [closeShiftVisible, setCloseShiftVisible] = useState(false);

    const summaryQuery = useQuery<ShiftSummary | null>({
        queryKey: ['shiftSummary', currentShift?.id || 'none'],
        queryFn: async () => (await shiftsService.getCurrentSummary()) as ShiftSummary,
        enabled: Boolean(currentShift) && isAuthorized,
        staleTime: 5_000,
        refetchOnWindowFocus: false,
    });

    const canCloseShift = !!currentShift && !!user && (
        canUpdateShifts ||
        currentShift.opened_by_user_id === user.id ||
        (!currentShift.opened_by_user_id && currentShift.user_id === user.id)
    );

    useEffect(() => {
        if (!canCreateShifts && openShiftVisible) {
            setOpenShiftVisible(false);
        }
    }, [canCreateShifts, openShiftVisible]);

    useEffect(() => {
        if (!isAuthorized || !openShiftRequested || shiftLoading) return;
        if (currentShift || !canCreateShifts) return;
        setOpenShiftVisible(true);
    }, [canCreateShifts, currentShift, isAuthorized, openShiftRequested, shiftLoading]);

    useEffect(() => {
        if (!redirectAfterOpen || !currentShift) return;
        if (!redirectAfterOpen.startsWith('/')) return;
        router.replace(redirectAfterOpen);
    }, [currentShift, redirectAfterOpen, router]);

    useRealtimeRefresh({
        socket,
        enabled: isAuthorized && Boolean(currentShift),
        events: [
            RealtimeEvents.shifts.update,
            RealtimeEvents.orders.create,
            RealtimeEvents.orders.update,
            RealtimeEvents.payments.create,
            RealtimeEvents.payments.update,
            RealtimeEvents.payments.delete,
        ],
        debounceMs: 700,
        intervalMs: isConnected ? undefined : 20000,
        onRefresh: () => {
            void refreshShift({ silent: true });
            void summaryQuery.refetch();
        },
    });

    const handleRefresh = async () => {
        await refreshShift();
        if (currentShift) {
            await summaryQuery.refetch();
        }
    };

    const shiftDuration = useMemo(() => {
        if (!currentShift) return '-';
        const diff = dayjs.duration(dayjs().diff(dayjs(currentShift.open_time)));
        const hours = Math.floor(diff.asHours());
        const minutes = diff.minutes();
        return `${hours} ชม. ${minutes} นาที`;
    }, [currentShift]);

    const summary = currentShift ? summaryQuery.data : null;
    const totalSales = toNumber(summary?.summary?.total_sales);
    const totalCost = toNumber(summary?.summary?.total_cost);
    const netProfit = toNumber(summary?.summary?.net_profit);
    const startAmount = toNumber(summary?.shift_info?.start_amount ?? currentShift?.start_amount);
    const endAmount = summary?.shift_info?.end_amount ?? currentShift?.end_amount;
    const expectedAmount = summary?.shift_info?.expected_amount ?? currentShift?.expected_amount;
    const diffAmount = summary?.shift_info?.diff_amount ?? currentShift?.diff_amount;
    const grossProfitMargin = toNumber(summary?.summary?.gross_profit_margin);
    const paymentMethods = summary?.summary?.payment_methods || {};
    const topProducts = summary?.top_products || [];
    const orderTypes = summary?.summary?.order_types || {};

    const cashSales = Object.entries(paymentMethods).reduce((total, [key, value]) => {
        const normalized = key.toLowerCase();
        if (normalized.includes('cash') || key.includes('เงินสด')) {
            return total + toNumber(value);
        }
        return total;
    }, 0);

    const drawerCash = toNumber(summary?.shift_info?.expected_amount ?? startAmount + cashSales);

    const metricCards = [
        {
            key: 'sales',
            icon: <RiseOutlined />,
            label: 'ยอดขายรวม',
            value: formatMoney(totalSales),
            hint: `${Object.keys(paymentMethods).length || 0} วิธีชำระเงิน`,
            color: '#0f766e',
            bg: '#ecfdf5',
        },
        {
            key: 'cost',
            icon: <ShoppingOutlined />,
            label: 'ต้นทุนรวม',
            value: formatMoney(totalCost),
            hint: `กำไรขั้นต้น ${grossProfitMargin.toLocaleString('th-TH')}%`,
            color: '#0369a1',
            bg: '#eff6ff',
        },
        {
            key: 'profit',
            icon: <ShoppingOutlined />,
            label: 'กำไรสุทธิ',
            value: formatMoney(netProfit),
            hint: topProducts[0] ? `ขายดี: ${topProducts[0].name}` : 'ยังไม่มีข้อมูลสินค้าเด่น',
            color: '#7c3aed',
            bg: '#f5f3ff',
        },
        {
            key: 'start',
            icon: <WalletOutlined />,
            label: 'เงินสดตั้งต้น',
            value: formatMoney(startAmount),
            hint: 'เงินตั้งต้นของกะ',
            color: '#b45309',
            bg: '#fffbeb',
        },
        {
            key: 'drawer',
            icon: <SafetyCertificateOutlined />,
            label: 'เงินสดในลิ้นชัก',
            value: formatMoney(drawerCash),
            hint: 'คำนวณจากเงินสดตั้งต้น + เงินสดรับ',
            color: '#1d4ed8',
            bg: '#eff6ff',
        },
        {
            key: 'diff',
            icon: <SafetyCertificateOutlined />,
            label: 'ผลต่างล่าสุด',
            value: endAmount ? formatMoney(diffAmount) : '-',
            hint: endAmount ? `ยอดนับจริง ${formatMoney(endAmount)}` : 'ยังไม่ได้นับเงินจริง',
            color: toNumber(diffAmount) >= 0 ? '#059669' : '#dc2626',
            bg: toNumber(diffAmount) >= 0 ? '#ecfdf5' : '#fef2f2',
        },
    ];

    if (isChecking || permissionLoading) {
        return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์การใช้งาน..." />;
    }

    if (!isAuthorized) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้" tone="danger" />;
    }

    if (shiftLoading && !currentShift) {
        return (
            <div style={pageStyles.container}>
                <style>{globalStyles}</style>
                <UIPageHeader
                    title="กะการทำงาน"
                    subtitle="กำลังโหลดข้อมูล..."
                    icon={<ClockCircleOutlined />}
                    onBack={() => router.back()}
                />
                <PageContainer>
                    <PageSection>
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
                            <Spin size="large" />
                        </div>
                    </PageSection>
                </PageContainer>
            </div>
        );
    }

    return (
        <div style={pageStyles.container}>
            <style>{globalStyles}</style>

            <UIPageHeader
                title="กะการทำงาน"
                icon={<ClockCircleOutlined />}
                onBack={() => router.back()}
                actions={
                    <Space size={10} wrap>
                        <Button icon={<ReloadOutlined />} onClick={() => void handleRefresh()} loading={shiftLoading || summaryQuery.isFetching} />
                        <Button icon={<HistoryOutlined />} onClick={() => router.push('/pos/shiftHistory')}>
                            {!isMobile ? 'ประวัติกะ' : ''}
                        </Button>
                        {!currentShift && canCreateShifts ? (
                            <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => setOpenShiftVisible(true)}>
                                {!isMobile ? 'เปิดกะ' : ''}
                            </Button>
                        ) : canCloseShift ? (
                            <Button danger icon={<StopOutlined />} onClick={() => setCloseShiftVisible(true)}>
                                {!isMobile ? 'ปิดกะ' : ''}
                            </Button>
                        ) : null}
                    </Space>
                }
            />

            <PageContainer maxWidth={1280}>
                <PageStack gap={14}>
                    {!currentShift ? (
                        <PageSection>
                            <div className="shift-empty-box">
                                <div className="shift-empty-icon">
                                    <ClockCircleOutlined />
                                </div>
                                <div className="shift-empty-title">ยังไม่มีกะที่เปิดใช้งาน</div>
                                <div className="shift-empty-desc">
                                    เปิดกะก่อนเริ่มรับออเดอร์เพื่อให้ระบบคำนวณยอดขายและสรุปเงินสดได้ถูกต้อง
                                </div>
                                {!canCreateShifts ? (
                                    <Alert
                                        type="warning"
                                        showIcon
                                        message="คุณไม่มีสิทธิ์เปิดกะ"
                                        style={{ marginTop: 20, textAlign: 'left' }}
                                    />
                                ) : (
                                    <Button
                                        type="primary"
                                        icon={<PlayCircleOutlined />}
                                        size="large"
                                        style={{ marginTop: 20, borderRadius: 14 }}
                                        onClick={() => setOpenShiftVisible(true)}
                                    >
                                        เปิดกะตอนนี้
                                    </Button>
                                )}
                            </div>
                        </PageSection>
                    ) : (
                        <>
                            <PageSection>
                                <div className="shift-info-grid" style={{ marginTop: 12 }}>
                                    <div className="shift-info-item">
                                        <div className="info-label">ผู้เปิดกะ</div>
                                        <div className="info-value">
                                            {currentShift.user?.display_name || currentShift.user?.username || '-'}
                                        </div>
                                    </div>
                                    <div className="shift-info-item">
                                        <div className="info-label">ระยะเวลากะ</div>
                                        <div className="info-value">{shiftDuration}</div>
                                    </div>
                                    <div className="shift-info-item">
                                        <div className="info-label">เวลาเปิดกะ</div>
                                        <div className="info-value">
                                            {dayjs(currentShift.open_time).format('DD/MM/YYYY HH:mm')} น.
                                        </div>
                                    </div>
                                </div>

                                {!canCloseShift ? (
                                    <Alert
                                        type="warning"
                                        showIcon
                                        style={{ marginTop: 12 }}
                                        message="คุณไม่มีสิทธิ์ปิดกะนี้"
                                        description="เฉพาะผู้จัดการหรือผู้ที่เปิดกะนี้เท่านั้นที่สามารถปิดกะได้"
                                    />
                                ) : null}
                            </PageSection>

                            <PageSection title="ภาพรวมกะปัจจุบัน">
                                {summaryQuery.isLoading ? (
                                    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                                        <Spin />
                                    </div>
                                ) : summaryQuery.isError ? (
                                    <PageState
                                        status="error"
                                        title="ไม่สามารถโหลดสรุปยอดกะได้"
                                        error={summaryQuery.error}
                                        onRetry={() => summaryQuery.refetch()}
                                    />
                                ) : (
                                    <Row gutter={[12, 12]}>
                                        {metricCards.map((card) => (
                                            <Col xs={24} sm={12} xl={8} key={card.key}>
                                                <Card
                                                    style={{
                                                        borderRadius: 20,
                                                        height: '100%',
                                                        border: '1px solid #e2e8f0',
                                                        background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                                                    }}
                                                    bodyStyle={{ padding: 18 }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                                        <div
                                                            style={{
                                                                width: 42,
                                                                height: 42,
                                                                display: 'grid',
                                                                placeItems: 'center',
                                                                borderRadius: 14,
                                                                background: card.bg,
                                                                color: card.color,
                                                                fontSize: 18,
                                                            }}
                                                        >
                                                            {card.icon}
                                                        </div>
                                                        <Text type="secondary">{card.label}</Text>
                                                    </div>
                                                    <Title level={4} style={{ margin: 0, color: card.color }}>
                                                        {card.value}
                                                    </Title>
                                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                                        {card.hint}
                                                    </Text>
                                                </Card>
                                            </Col>
                                        ))}
                                    </Row>
                                )}
                            </PageSection>

                            <Row gutter={[14, 14]}>
                                <Col xs={24} lg={12}>
                                    <PageSection title="วิธีชำระเงิน">
                                        {Object.keys(paymentMethods).length > 0 ? (
                                            <div className="shift-payment-grid">
                                                {Object.entries(paymentMethods).map(([method, amount]) => (
                                                    <div key={method} className="shift-payment-card">
                                                        <div className="payment-method">{method}</div>
                                                        <div className="payment-value">{formatMoney(amount)}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <Text type="secondary">ยังไม่มีข้อมูลวิธีชำระเงินในกะนี้</Text>
                                        )}
                                    </PageSection>
                                </Col>

                                <Col xs={24} lg={12}>
                                    <PageSection title="ยอดขายตามช่องทาง">
                                        <div style={{ display: 'grid', gap: 10 }}>
                                            <ChannelCard label="ทานที่ร้าน" value={orderTypes.DineIn} color="#2563eb" />
                                            <ChannelCard label="สั่งกลับบ้าน" value={orderTypes.TakeAway} color="#059669" />
                                            <ChannelCard label="เดลิเวอรี่" value={orderTypes.Delivery} color="#db2777" />
                                            <ChannelCard label="ยอดคาดหวัง" value={expectedAmount} color="#334155" />
                                        </div>
                                    </PageSection>
                                </Col>
                            </Row>

                            <PageSection title="สินค้าขายดี">
                                {topProducts.length > 0 ? (
                                    <div className="shift-top-products">
                                        {topProducts.slice(0, 5).map((item, index) => (
                                            <div key={`${item.id}-${index}`} className="shift-product-row">
                                                <div className="shift-product-left">
                                                    <div className={`shift-product-rank ${index < 3 ? `rank-${index + 1}` : 'rank-other'}`}>
                                                        {index + 1}
                                                    </div>
                                                    <div className="shift-product-info">
                                                        <div className="shift-product-name">{item.name}</div>
                                                        <div className="shift-product-qty">
                                                            จำนวน {item.quantity} {item.unit || 'หน่วย'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="shift-product-revenue">{formatMoney(item.revenue)}</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <Text type="secondary">ยังไม่มีข้อมูลสินค้าขายดีในกะนี้</Text>
                                )}
                            </PageSection>
                        </>
                    )}
                </PageStack>
            </PageContainer>

            <OpenShiftModal
                open={openShiftVisible && canCreateShifts}
                onCancel={() => setOpenShiftVisible(false)}
                onSuccess={() => {
                    setOpenShiftVisible(false);
                }}
            />

            <CloseShiftModal
                open={closeShiftVisible}
                onCancel={() => setCloseShiftVisible(false)}
                onSuccess={() => setCloseShiftVisible(false)}
            />
        </div>
    );
}

function ChannelCard({
    label,
    value,
    color,
}: {
    label: string;
    value?: number | string;
    color: string;
}) {
    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 14,
                border: '1px solid #e2e8f0',
                background: '#fff',
            }}
        >
            <Text>{label}</Text>
            <Text strong style={{ color }}>
                {formatMoney(value)}
            </Text>
        </div>
    );
}
