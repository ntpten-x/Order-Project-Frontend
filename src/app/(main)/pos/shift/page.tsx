'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Card, Col, Grid, Row, Space, Spin, Typography } from 'antd';
import { ClockCircleOutlined, HistoryOutlined, PlayCircleOutlined, ReloadOutlined, RiseOutlined, SafetyCertificateOutlined, ShoppingOutlined, StopOutlined, WalletOutlined } from '@ant-design/icons';
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
import { SupportedRoleName } from '../../../../lib/rbac/shift-capabilities';
import { pageStyles, globalStyles } from '../../../../theme/pos/shift/style';

const { Text, Title } = Typography;
dayjs.extend(duration);
dayjs.locale('th');

const toNumber = (value: number | string | undefined | null) => Number(value || 0);
const formatMoney = (value: number | string | undefined | null) => `฿${toNumber(value).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const normalizeRoleName = (roleName?: string | null): SupportedRoleName | null => {
    const normalized = String(roleName ?? '').trim().toLowerCase();
    if (normalized === 'admin') return 'Admin';
    if (normalized === 'manager') return 'Manager';
    if (normalized === 'employee') return 'Employee';
    return null;
};

const metricCardStyle = {
    borderRadius: 20,
    height: '100%',
    border: '1px solid #e2e8f0',
    background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
};

export default function ShiftPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const { socket, isConnected } = useSocket();
    const { isAuthorized, isChecking } = useRoleGuard();
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });
    const { currentShift, loading: shiftLoading, refreshShift } = useShift();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;
    const roleName = normalizeRoleName(user?.role);

    const canOpenShift = can('shifts.open.feature', 'create');
    const canPreviewCloseShift = can('shifts.close_preview.feature', 'access');
    const canCloseShiftFeature = can('shifts.close.feature', 'update');
    const canViewShiftSummary = can('shifts.summary.feature', 'view');
    const canViewShiftFinancials = can('shifts.financials.feature', 'view');
    const canViewShiftChannels = can('shifts.channels.feature', 'view');
    const canViewShiftTopProducts = can('shifts.top_products.feature', 'view');
    const canViewShiftHistory = can('shifts.history_nav.feature', 'view');

    const [openShiftVisible, setOpenShiftVisible] = useState(false);
    const [closeShiftVisible, setCloseShiftVisible] = useState(false);
    const redirectAfterOpen = searchParams.get('redirect') || '';
    const openShiftRequested = searchParams.get('openShift') === '1';



    const summaryQuery = useQuery<ShiftSummary | null>({
        queryKey: ['shiftSummary', currentShift?.id || 'none'],
        queryFn: async () => (await shiftsService.getCurrentSummary()) as ShiftSummary,
        enabled: Boolean(currentShift) && isAuthorized && canViewShiftSummary,
        staleTime: 5_000,
        refetchOnWindowFocus: false,
    });

    const isPrivilegedCloser = roleName === 'Admin' || roleName === 'Manager';
    const isShiftOwner = Boolean(currentShift && user && (currentShift.opened_by_user_id === user.id || (!currentShift.opened_by_user_id && currentShift.user_id === user.id)));
    const canUseCloseFlow = Boolean(currentShift && canPreviewCloseShift && canCloseShiftFeature && (isPrivilegedCloser || isShiftOwner));
    const canViewFinancialsOnThisShift = Boolean(canViewShiftFinancials && (!currentShift || isPrivilegedCloser || isShiftOwner));

    useEffect(() => {
        if (!canOpenShift && openShiftVisible) setOpenShiftVisible(false);
    }, [canOpenShift, openShiftVisible]);

    useEffect(() => {
        if (!isAuthorized || !openShiftRequested || shiftLoading || currentShift || !canOpenShift) return;
        setOpenShiftVisible(true);
    }, [canOpenShift, currentShift, isAuthorized, openShiftRequested, shiftLoading]);

    useEffect(() => {
        if (currentShift && redirectAfterOpen.startsWith('/')) router.replace(redirectAfterOpen);
    }, [currentShift, redirectAfterOpen, router]);

    useRealtimeRefresh({
        socket,
        enabled: isAuthorized && Boolean(currentShift),
        events: [RealtimeEvents.shifts.update, RealtimeEvents.orders.create, RealtimeEvents.orders.update, RealtimeEvents.payments.create, RealtimeEvents.payments.update, RealtimeEvents.payments.delete],
        debounceMs: 700,
        intervalMs: isConnected ? undefined : 20_000,
        onRefresh: () => {
            void refreshShift({ silent: true });
            if (canViewShiftSummary) void summaryQuery.refetch();
        },
    });

    const handleRefresh = async () => {
        await refreshShift();
        if (currentShift && canViewShiftSummary) await summaryQuery.refetch();
    };

    const shiftDuration = useMemo(() => {
        if (!currentShift) return '-';
        const diff = dayjs.duration(dayjs().diff(dayjs(currentShift.open_time)));
        return `${Math.floor(diff.asHours())} ชม. ${diff.minutes()} นาที`;
    }, [currentShift]);

    const summary = currentShift && canViewShiftSummary ? summaryQuery.data : null;
    const paymentMethods = summary?.summary?.payment_methods || {};
    const orderTypes = summary?.summary?.order_types || {};
    const topProducts = summary?.top_products || [];
    const startAmount = toNumber(summary?.shift_info?.start_amount ?? currentShift?.start_amount);
    const expectedAmount = summary?.shift_info?.expected_amount ?? currentShift?.expected_amount;
    const endAmount = summary?.shift_info?.end_amount ?? currentShift?.end_amount;
    const diffAmount = summary?.shift_info?.diff_amount ?? currentShift?.diff_amount;
    const cashSales = Object.entries(paymentMethods).reduce((total, [key, value]) => (key.toLowerCase().includes('cash') || key.includes('เงินสด') ? total + toNumber(value) : total), 0);
    const drawerCash = toNumber(summary?.shift_info?.expected_amount ?? startAmount + cashSales);
    const hasRestrictedSections = Boolean(currentShift && (!canViewFinancialsOnThisShift || !canViewShiftChannels || !canViewShiftTopProducts || !canUseCloseFlow || !canViewShiftHistory));

    if (isChecking || permissionLoading) return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์การใช้งาน..." />;
    if (!isAuthorized) return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้" tone="danger" />;

    if (shiftLoading && !currentShift) {
        return <div style={pageStyles.container}><style>{globalStyles}</style><UIPageHeader title="กะการทำงาน" subtitle="กำลังโหลดข้อมูล..." icon={<ClockCircleOutlined />} onBack={() => router.back()} /><PageContainer><PageSection><div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}><Spin size="large" /></div></PageSection></PageContainer></div>;
    }

    const metricCards = [
        { key: 'sales', label: 'ยอดขายทั้งหมด', value: formatMoney(summary?.summary?.total_sales), hint: `${Object.keys(paymentMethods).length || 0} ช่องทางการชำระเงิน`, color: '#0f766e', bg: '#ecfdf5', icon: <RiseOutlined /> },
        { key: 'cost', label: 'ต้นทุนทั้งหมด', value: formatMoney(summary?.summary?.total_cost), hint: `กำไรขั้นต้น ${toNumber(summary?.summary?.gross_profit_margin).toLocaleString('th-TH')}%`, color: '#0369a1', bg: '#eff6ff', icon: <ShoppingOutlined /> },
        { key: 'profit', label: 'กำไรสุทธิ', value: formatMoney(summary?.summary?.net_profit), hint: topProducts[0] ? `สินค้าขายดี: ${topProducts[0].name}` : 'ยังไม่มีข้อมูลสินค้าขายดี', color: '#7c3aed', bg: '#f5f3ff', icon: <ShoppingOutlined /> },
    ];

    const financialCards = [
        { key: 'start', label: 'เงินเริ่มต้น', value: formatMoney(startAmount), hint: 'เงินทอนเริ่มต้นสำหรับกะนี้', color: '#b45309', bg: '#fffbeb', icon: <WalletOutlined /> },
        { key: 'drawer', label: 'ยอดเงินสดคาดหวัง', value: formatMoney(drawerCash), hint: 'เงินเริ่มต้นบวกยอดชำระด้วยเงินสด', color: '#1d4ed8', bg: '#eff6ff', icon: <SafetyCertificateOutlined /> },
        { key: 'diff', label: 'ผลต่างล่าสุด', value: endAmount !== null && endAmount !== undefined ? formatMoney(diffAmount) : '-', hint: endAmount !== null && endAmount !== undefined ? `ยอดนับจริง ${formatMoney(endAmount)}` : 'จะแสดงหลังจากการตรวจยอดปิดกะ', color: toNumber(diffAmount) >= 0 ? '#059669' : '#dc2626', bg: toNumber(diffAmount) >= 0 ? '#ecfdf5' : '#fef2f2', icon: <SafetyCertificateOutlined /> },
    ];

    return (
        <div style={pageStyles.container}>
            <style>{globalStyles}</style>
            <UIPageHeader title="กะการทำงาน" subtitle="การจัดการและตรวจสอบกะปัจจุบัน" icon={<ClockCircleOutlined />} onBack={() => router.back()} actions={<Space size={10} wrap><Button icon={<ReloadOutlined />} onClick={() => void handleRefresh()} loading={shiftLoading || summaryQuery.isFetching} /><Button icon={<HistoryOutlined />} disabled={!canViewShiftHistory} onClick={() => canViewShiftHistory && router.push('/pos/shiftHistory')}>{!isMobile ? 'ประวัติกะ' : ''}</Button>{!currentShift ? <Button type="primary" icon={<PlayCircleOutlined />} disabled={!canOpenShift} onClick={() => canOpenShift && setOpenShiftVisible(true)}>{!isMobile ? 'เปิดกะ' : ''}</Button> : <Button danger icon={<StopOutlined />} disabled={!canUseCloseFlow} onClick={() => canUseCloseFlow && setCloseShiftVisible(true)}>{!isMobile ? 'ปิดกะ' : ''}</Button>}</Space>} />
            <PageContainer maxWidth={1280}>
                <PageStack gap={14}>


                    {hasRestrictedSections && <Alert type="warning" showIcon message="ฟังก์ชันบางส่วนถูกจำกัดตามสิทธิ์" description="บทบาทนี้สามารถทำงานกับกะได้ปกติ แต่ฟังก์ชันละเอียดอ่อนบางส่วนจะถูกจำกัด" />}
                    {!currentShift ? <PageSection><div className="shift-empty-box"><div className="shift-empty-icon"><ClockCircleOutlined /></div><div className="shift-empty-title">ยังไม่มีกะที่เปิดใช้งาน</div><div className="shift-empty-desc">เปิดกะก่อนเริ่มขายเพื่อให้ระบบติดตามยอดขาย เงินสด และผลการปฏิบัติงานของรอบนี้ได้ครบถ้วน</div>{!canOpenShift ? <Alert type="warning" showIcon message="บัญชีนี้ไม่มีสิทธิ์เปิดกะ" description="ให้ผู้จัดการหรือผู้มีสิทธิ์ current shift governance เป็นผู้เปิดกะให้ก่อนเริ่มงาน" style={{ marginTop: 20, textAlign: 'left' }} /> : <Button type="primary" icon={<PlayCircleOutlined />} size="large" style={{ marginTop: 20, borderRadius: 14 }} onClick={() => setOpenShiftVisible(true)}>เปิดกะตอนนี้</Button>}</div></PageSection> : <>
                        <PageSection title="การควบคุมกะทำงาน">
                            <Space direction="vertical" size={12} style={{ width: '100%' }}>
                                <div className="shift-info-grid" style={{ marginTop: 4 }}>
                                    <div className="shift-info-item"><div className="info-label">ผู้รับผิดชอบกะ</div><div className="info-value">{currentShift.user?.display_name || currentShift.user?.username || '-'}</div></div>
                                    <div className="shift-info-item"><div className="info-label">ระยะเวลากะ</div><div className="info-value">{shiftDuration}</div></div>
                                    <div className="shift-info-item"><div className="info-label">เวลาเปิดกะ</div><div className="info-value">{dayjs(currentShift.open_time).format('DD/MM/YYYY HH:mm')} น.</div></div>
                                </div>
                                {!canUseCloseFlow && <Alert type="warning" showIcon message="ฟังก์ชันการปิดกะถูกจำกัด" description="เฉพาะผู้ใช้ที่มีสิทธิ์ตรวจยอดและปิดกะเท่านั้นที่สามารถปิดกะนี้ได้" />}
                                {!canViewFinancialsOnThisShift && <Alert type="info" showIcon message="การตรวจยอดเงินถูกจำกัด" description="ยอดเงินสดและผลต่างจะถูกซ่อนหากอยู่นอกขอบเขตสิทธิ์การเงินของคุณ" />}
                            </Space>
                        </PageSection>
                        <PageSection title="ภาพรวมกะปัจจุบัน">
                            {!canViewShiftSummary ? <Alert type="warning" showIcon message="สรุปยอดกะถูกจำกัด" description="บทบาทนี้สามารถเข้าถึงพื้นที่ทำงานได้ แต่การ์ดสรุป KPI จะถูกซ่อนตามสิทธิ์" /> : summaryQuery.isLoading ? <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}><Spin /></div> : summaryQuery.isError ? <PageState status="error" title="ไม่สามารถโหลดสรุปกะได้" error={summaryQuery.error} onRetry={() => summaryQuery.refetch()} /> : <Space direction="vertical" size={14} style={{ width: '100%' }}><Row gutter={[12, 12]}>{metricCards.map((card) => <Col xs={24} sm={12} xl={8} key={card.key}><Card style={metricCardStyle} bodyStyle={{ padding: 18 }}><div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}><div style={{ width: 42, height: 42, display: 'grid', placeItems: 'center', borderRadius: 14, background: card.bg, color: card.color, fontSize: 18 }}>{card.icon}</div><Text type="secondary">{card.label}</Text></div><Title level={4} style={{ margin: 0, color: card.color }}>{card.value}</Title><Text type="secondary" style={{ fontSize: 12 }}>{card.hint}</Text></Card></Col>)}{canViewFinancialsOnThisShift && financialCards.map((card) => <Col xs={24} sm={12} xl={8} key={card.key}><Card style={metricCardStyle} bodyStyle={{ padding: 18 }}><div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}><div style={{ width: 42, height: 42, display: 'grid', placeItems: 'center', borderRadius: 14, background: card.bg, color: card.color, fontSize: 18 }}>{card.icon}</div><Text type="secondary">{card.label}</Text></div><Title level={4} style={{ margin: 0, color: card.color }}>{card.value}</Title><Text type="secondary" style={{ fontSize: 12 }}>{card.hint}</Text></Card></Col>)}</Row>{!canViewFinancialsOnThisShift && <Alert type="info" showIcon message="ข้อมูลการเงินถูกซ่อน" description="เงินเริ่มต้น ยอดคาดหวัง และผลต่าง จะแสดงเฉพาะผู้มีสิทธิ์ในกะนี้เท่านั้น" />}</Space>}
                        </PageSection>
                        <Row gutter={[14, 14]}>
                            <Col xs={24} lg={12}><PageSection title="ยอดแยกตามช่องทางการชำระ">{!canViewShiftSummary ? <Text type="secondary">จำเป็นต้องมีสิทธิ์สรุปยอดเพื่อดูข้อมูลนี้</Text> : !canViewFinancialsOnThisShift ? <Alert type="warning" showIcon message="สิทธิ์การเข้าถึงยอดถูกจำกัด" description="เฉพาะผู้มีสิทธิ์การเงินเท่านั้นที่สามารถตรวจสอบยอดได้" /> : Object.keys(paymentMethods).length > 0 ? <div className="shift-payment-grid">{Object.entries(paymentMethods).map(([method, amount]) => <div key={method} className="shift-payment-card"><div className="payment-method">{method}</div><div className="payment-value">{formatMoney(amount)}</div></div>)}</div> : <Text type="secondary">ยังไม่มีข้อมูลช่องทางการชำระสำหรับกะนี้</Text>}</PageSection></Col>
                            <Col xs={24} lg={12}><PageSection title="สัดส่วนเพื่อสรุปยอดขายแยกตามช่องทาง">{!canViewShiftSummary ? <Text type="secondary">จำเป็นต้องมีสิทธิ์สรุปยอดเพื่อดูข้อมูลนี้</Text> : !canViewShiftChannels ? <Alert type="warning" showIcon message="ข้อมูลสัดส่วนช่องทางถูกจำกัด" description="บทบาทนี้ไม่สามารถดูสัดส่วนการขายแยกตามช่องทางได้" /> : <div style={{ display: 'grid', gap: 10 }}><SimpleRow label="ทานที่ร้าน" value={orderTypes.DineIn} color="#2563eb" /><SimpleRow label="สั่งกลับบ้าน" value={orderTypes.TakeAway} color="#059669" /><SimpleRow label="เดลิเวอรี่" value={orderTypes.Delivery} color="#db2777" /><SimpleRow label="ยอดเงินสดคาดหวัง" value={expectedAmount} color="#334155" /></div>}</PageSection></Col>
                        </Row>
                        <PageSection title="สินค้าขายยอดนิยมในกะนี้">{!canViewShiftSummary ? <Text type="secondary">จำเป็นต้องมีสิทธิ์สรุปยอดเพื่อดูข้อมูลนี้</Text> : !canViewShiftTopProducts ? <Alert type="warning" showIcon message="อันดับสินค้าถูกจำกัด" description="บทบาทนี้ไม่สามารถดูผลประกอบการระดับสินค้าได้" /> : topProducts.length > 0 ? <div className="shift-top-products">{topProducts.slice(0, 5).map((item, index) => <div key={`${item.id}-${index}`} className="shift-product-row"><div className="shift-product-left"><div className={`shift-product-rank ${index < 3 ? `rank-${index + 1}` : 'rank-other'}`}>{index + 1}</div><div className="shift-product-info"><div className="shift-product-name">{item.name}</div><div className="shift-product-qty">จำนวน {item.quantity} {item.unit || 'หน่วย'}</div></div></div><div className="shift-product-revenue">{formatMoney(item.revenue)}</div></div>)}</div> : <Text type="secondary">ยังไม่มีข้อมูลรายการสินค้าขายได้ในกะนี้</Text>}</PageSection>
                    </>}
                </PageStack>
            </PageContainer>
            <OpenShiftModal open={openShiftVisible && canOpenShift} onCancel={() => setOpenShiftVisible(false)} onSuccess={() => setOpenShiftVisible(false)} />
            <CloseShiftModal open={closeShiftVisible && canUseCloseFlow} onCancel={() => setCloseShiftVisible(false)} onSuccess={() => setCloseShiftVisible(false)} />
        </div>
    );
}

function SimpleRow({ label, value, color }: { label: string; value?: number | string; color: string }) {
    return <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, border: '1px solid #e2e8f0', background: '#fff' }}><Text>{label}</Text><Text strong style={{ color }}>{formatMoney(value)}</Text></div>;
}
