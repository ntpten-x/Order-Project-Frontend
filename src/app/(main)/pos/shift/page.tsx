'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Tag, Spin, Space } from 'antd';
import {
    ClockCircleOutlined,
    PlayCircleOutlined,
    StopOutlined,
    RiseOutlined,
    SafetyCertificateOutlined,
    HistoryOutlined,
    ReloadOutlined,
    WalletOutlined,
    ShoppingOutlined,
    ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import 'dayjs/locale/th';
import { useSocket } from '../../../../hooks/useSocket';
import { useAuth } from '../../../../contexts/AuthContext';
import { useRoleGuard } from '../../../../utils/pos/accessControl';
import { useEffectivePermissions } from '../../../../hooks/useEffectivePermissions';
import { shiftsService } from '../../../../services/pos/shifts.service';
import { Shift, ShiftSummary } from '../../../../types/api/pos/shifts';
import { RealtimeEvents } from '../../../../utils/realtimeEvents';
import { AccessGuardFallback } from '../../../../components/pos/AccessGuard';
import OpenShiftModal from '../../../../components/pos/shifts/OpenShiftModal';
import CloseShiftModal from '../../../../components/pos/shifts/CloseShiftModal';
import PageContainer from '../../../../components/ui/page/PageContainer';
import PageSection from '../../../../components/ui/page/PageSection';
import PageStack from '../../../../components/ui/page/PageStack';
import UIPageHeader from '../../../../components/ui/page/PageHeader';
import PageState from '../../../../components/ui/states/PageState';
import { pageStyles, globalStyles } from '../../../../theme/pos/shift/style';
import { useSearchParams } from 'next/navigation';

dayjs.extend(duration);
dayjs.locale('th');



const toNumber = (value: number | string | undefined | null) => Number(value || 0);

export default function ShiftPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const { socket } = useSocket();
    const { isAuthorized, isChecking } = useRoleGuard();
    const { can } = useEffectivePermissions({ enabled: Boolean(user?.id) });
    const canCreateShifts = can('shifts.page', 'create');
    const canUpdateShifts = can('shifts.page', 'update');

    const [openShiftVisible, setOpenShiftVisible] = useState(false);
    const [closeShiftVisible, setCloseShiftVisible] = useState(false);
    const redirectAfterOpen = searchParams.get("redirect") || "";
    const openShiftRequested = searchParams.get("openShift") === "1";

    const {
        data: currentShift = null,
        isLoading: isShiftLoading,
        isError: isShiftError,
        error: shiftError,
        refetch: refetchCurrentShift,
    } = useQuery<Shift | null>({
        queryKey: ['shiftCurrent'],
        queryFn: async () => shiftsService.getCurrentShift(),
        staleTime: 2000,
    });

    const {
        data: currentSummary,
        isLoading: isSummaryLoading,
        isError: isSummaryError,
        error: summaryError,
        refetch: refetchCurrentSummary,
    } = useQuery<ShiftSummary | null>({
        queryKey: ['shiftSummary', currentShift?.id || 'none'],
        queryFn: async () => {
            const result = await shiftsService.getCurrentSummary();
            return result as ShiftSummary;
        },
        enabled: Boolean(currentShift),
        staleTime: 2000,
    });

    const isLoading = isShiftLoading || (Boolean(currentShift) && isSummaryLoading);

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
        if (!openShiftRequested) return;
        if (isShiftLoading) return;
        if (currentShift) return;
        if (!canCreateShifts) return;
        setOpenShiftVisible(true);
    }, [openShiftRequested, isShiftLoading, currentShift, canCreateShifts]);

    useEffect(() => {
        if (!redirectAfterOpen) return;
        if (!currentShift) return;
        if (!redirectAfterOpen.startsWith("/")) return;
        router.replace(redirectAfterOpen);
    }, [redirectAfterOpen, currentShift, router]);

    useEffect(() => {
        if (!socket) return;
        const handleShiftUpdate = () => {
            queryClient.invalidateQueries({ queryKey: ['shiftCurrent'] });
            queryClient.invalidateQueries({ queryKey: ['shiftSummary'] });
        };

        socket.on(RealtimeEvents.shifts.update, handleShiftUpdate);
        return () => {
            socket.off(RealtimeEvents.shifts.update, handleShiftUpdate);
        };
    }, [socket, queryClient]);

    const handleRefresh = async () => {
        await refetchCurrentShift();
        if (currentShift) {
            await refetchCurrentSummary();
        }
    };

    const shiftDuration = useMemo(() => {
        if (!currentShift) return '-';
        const diff = dayjs.duration(dayjs().diff(dayjs(currentShift.open_time)));
        const hours = Math.floor(diff.asHours());
        const minutes = diff.minutes();
        return `${hours} ชม. ${minutes} นาที`;
    }, [currentShift]);

    const summary = currentShift ? currentSummary : null;
    const totalSales = toNumber(summary?.summary?.total_sales);
    const netProfit = toNumber(summary?.summary?.net_profit);
    const startAmount = toNumber(summary?.shift_info?.start_amount ?? currentShift?.start_amount);
    const endAmount = toNumber(summary?.shift_info?.end_amount ?? currentShift?.end_amount);
    const expectedAmount = toNumber(summary?.shift_info?.expected_amount ?? currentShift?.expected_amount);
    const diffAmount = toNumber(summary?.shift_info?.diff_amount ?? currentShift?.diff_amount);

    const paymentMethods = summary?.summary?.payment_methods || {};
    const cashSales = Object.entries(paymentMethods).reduce((total, [key, value]) => {
        const normalized = key.toLowerCase();
        if (normalized.includes('cash') || key.includes('เงินสด')) {
            return total + toNumber(value);
        }
        return total;
    }, 0);

    const cashInDrawer = toNumber(summary?.shift_info?.expected_amount ?? (startAmount + cashSales));

    if (isChecking) {
        return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์การใช้งาน..." />;
    }

    if (!isAuthorized) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้" tone="danger" />;
    }

    if (isShiftError) {
        return (
            <div style={pageStyles.container}>
                <style>{globalStyles}</style>
                <UIPageHeader
                    title="กะการทำงาน"
                    subtitle="โหลดข้อมูลกะไม่สำเร็จ"
                    icon={<ClockCircleOutlined />}
                    onBack={() => router.back()}
                />
                <PageContainer>
                    <PageSection>
                        <PageState
                            status="error"
                            title="โหลดข้อมูลกะไม่สำเร็จ"
                            error={shiftError}
                            onRetry={handleRefresh}
                        />
                    </PageSection>
                </PageContainer>
            </div>
        );
    }

    if (isLoading) {
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

    const metricCards = [
        { icon: <RiseOutlined />, label: 'ยอดขายรวม', value: `฿${totalSales.toLocaleString()}`, color: '#10b981', bg: '#ecfdf5' },
        { icon: <ShoppingOutlined />, label: 'กำไรสุทธิ', value: `฿${netProfit.toLocaleString()}`, color: '#0ea5e9', bg: '#f0f9ff' },
        { icon: <WalletOutlined />, label: 'เงินทอนเริ่มต้น', value: `฿${startAmount.toLocaleString()}`, color: '#f59e0b', bg: '#fffbeb' },
        { icon: <SafetyCertificateOutlined />, label: 'เงินสดในลิ้นชัก', value: `฿${cashInDrawer.toLocaleString()}`, color: '#7c3aed', bg: '#f5f3ff' },
        { icon: <SafetyCertificateOutlined />, label: 'ยอดคาดหวัง', value: `฿${expectedAmount.toLocaleString()}`, color: '#334155', bg: '#f1f5f9' },
        { icon: <SafetyCertificateOutlined />, label: 'ผลต่าง', value: `฿${diffAmount.toLocaleString()}`, color: diffAmount >= 0 ? '#059669' : '#dc2626', bg: diffAmount >= 0 ? '#ecfdf5' : '#fef2f2' },
        { icon: <WalletOutlined />, label: 'ยอดนับจริงล่าสุด', value: endAmount > 0 ? `฿${endAmount.toLocaleString()}` : '-', color: '#64748b', bg: '#f8fafc' },
    ];

    return (
        <div style={pageStyles.container}>
            <style>{globalStyles}</style>

            <UIPageHeader
                title="กะการทำงาน"
                icon={<ClockCircleOutlined />}
                onBack={() => router.back()}
                actions={
                    <Space size={10}>
                        <Button icon={<ReloadOutlined />} onClick={handleRefresh} />
                        <Button icon={<HistoryOutlined />} onClick={() => router.push('/pos/shiftHistory')}>
                            ประวัติกะ
                        </Button>
                        {!currentShift && canCreateShifts ? (
                            <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => setOpenShiftVisible(true)}>
                                เปิดกะ
                            </Button>
                        ) : canCloseShift ? (
                            <Button danger icon={<StopOutlined />} onClick={() => setCloseShiftVisible(true)}>
                                ปิดการขาย
                            </Button>
                        ) : null}
                    </Space>
                }
            />

            <PageContainer>
                <PageStack>
                    {!currentShift ? (
                        <PageSection>
                            <div className="shift-empty-box">
                                <div className="shift-empty-icon">
                                    <ClockCircleOutlined />
                                </div>
                                <div className="shift-empty-title">ยังไม่มีกะที่เปิดใช้งาน</div>
                                <div className="shift-empty-desc">กรุณาเปิดกะเพื่อเริ่มต้นการขายและบันทึกสรุปรายวัน</div>
                            </div>
                            {!canCreateShifts ? <AlertBox text="คุณไม่มีสิทธิ์เปิดกะ" /> : null}
                        </PageSection>
                    ) : (
                        <>
                            {/* ── Status Banner ── */}
                            <PageSection>
                                <div className="shift-status-banner">
                                    <div className="shift-status-icon">
                                        <ClockCircleOutlined />
                                    </div>
                                    <div className="shift-status-text">
                                        <div className="status-label">
                                            <Tag color="success" style={{ borderRadius: 6, marginRight: 8 }}>เปิดกะอยู่</Tag>
                                            {shiftDuration}
                                        </div>
                                        <div className="status-sub">
                                            เปิดกะเมื่อ {dayjs(currentShift.open_time).format('DD/MM/YYYY HH:mm')} น.
                                        </div>
                                    </div>
                                </div>

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
                                    <AlertBox text="คุณไม่มีสิทธิ์ปิดกะนี้ (เฉพาะผู้จัดการหรือผู้เปิดกะ)" />
                                ) : null}
                            </PageSection>

                            {/* ── Summary Metrics ── */}
                            <PageSection title="สรุปยอดกะปัจจุบัน">
                                {isSummaryLoading ? (
                                    <div style={{ padding: '24px 0', textAlign: 'center' }}>
                                        <Spin />
                                    </div>
                                ) : isSummaryError ? (
                                    <PageState
                                        status="error"
                                        title="ไม่สามารถโหลดสรุปยอดกะได้"
                                        error={summaryError}
                                        onRetry={() => refetchCurrentSummary()}
                                    />
                                ) : summary ? (
                                    <div className="shift-metric-grid">
                                        {metricCards.map((card) => (
                                            <div key={card.label} className="shift-metric-card">
                                                <div className="metric-icon-row">
                                                    <div className="metric-icon-box" style={{ background: card.bg, color: card.color }}>
                                                        {card.icon}
                                                    </div>
                                                    <span className="metric-label">{card.label}</span>
                                                </div>
                                                <div className="metric-value" style={{ color: card.color }}>{card.value}</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <span style={{ color: '#94a3b8', fontSize: 14 }}>ยังไม่มีข้อมูลสรุปยอดกะ</span>
                                )}
                            </PageSection>

                            {/* ── Payment Methods ── */}
                            <PageSection title="รายละเอียดวิธีชำระเงิน">
                                {Object.keys(paymentMethods).length > 0 ? (
                                    <div className="shift-payment-grid">
                                        {Object.entries(paymentMethods).map(([method, amount]) => (
                                            <div key={method} className="shift-payment-card">
                                                <div className="payment-method">{method}</div>
                                                <div className="payment-value">฿{toNumber(amount).toLocaleString()}</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <span style={{ color: '#94a3b8', fontSize: 14 }}>ยังไม่มีข้อมูลวิธีชำระเงินในกะนี้</span>
                                )}
                            </PageSection>

                            {/* ── Top Products ── */}
                            <PageSection title="สินค้าขายดี">
                                {summary?.top_products?.length ? (
                                    <div className="shift-top-products">
                                        {summary.top_products.slice(0, 5).map((item, index) => {
                                            const rankClass = index < 3 ? `rank-${index + 1}` : 'rank-other';
                                            return (
                                                <div key={`${item.id}-${index}`} className="shift-product-row">
                                                    <div className="shift-product-left">
                                                        <div className={`shift-product-rank ${rankClass}`}>
                                                            {index + 1}
                                                        </div>
                                                        <div className="shift-product-info">
                                                            <div className="shift-product-name">{item.name}</div>
                                                            <div className="shift-product-qty">
                                                                จำนวน {item.quantity} {item.unit || 'หน่วย'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="shift-product-revenue">
                                                        ฿{toNumber(item.revenue).toLocaleString()}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <span style={{ color: '#94a3b8', fontSize: 14 }}>ยังไม่มีข้อมูลสินค้าขายดีในกะนี้</span>
                                )}
                            </PageSection>
                        </>
                    )}
                </PageStack>
            </PageContainer>

            <OpenShiftModal
                open={openShiftVisible && canCreateShifts}
                onCancel={() => setOpenShiftVisible(false)}
            />

            <CloseShiftModal
                open={closeShiftVisible}
                onCancel={() => setCloseShiftVisible(false)}
                onSuccess={() => setCloseShiftVisible(false)}
            />
        </div>
    );
}

function AlertBox({ text }: { text: string }) {
    return (
        <div className="shift-alert-box">
            <ExclamationCircleOutlined className="alert-icon" />
            <span className="alert-text">{text}</span>
        </div>
    );
}
