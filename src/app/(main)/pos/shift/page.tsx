'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Typography, Card, Button, Tag, Spin, Space } from 'antd';
import {
    ClockCircleOutlined,
    PlayCircleOutlined,
    StopOutlined,
    RiseOutlined,
    SafetyCertificateOutlined,
    HistoryOutlined,
    ReloadOutlined,
    WalletOutlined,
    ShoppingOutlined
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
import UIEmptyState from '../../../../components/ui/states/EmptyState';
import PageState from '../../../../components/ui/states/PageState';
import { pageStyles, globalStyles } from '../../../../theme/pos/shift/style';

dayjs.extend(duration);
dayjs.locale('th');

const { Title, Text } = Typography;

const toNumber = (value: number | string | undefined | null) => Number(value || 0);

export default function ShiftPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const { socket } = useSocket();
    const { isAuthorized, isChecking } = useRoleGuard();
    const { can } = useEffectivePermissions({ enabled: Boolean(user?.id) });
    const canCreateShifts = can('shifts.page', 'create');
    const canUpdateShifts = can('shifts.page', 'update');

    const [openShiftVisible, setOpenShiftVisible] = useState(false);
    const [closeShiftVisible, setCloseShiftVisible] = useState(false);

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

    return (
        <div style={pageStyles.container}>
            <style>{globalStyles}</style>

            <UIPageHeader
                title="กะการทำงาน"
                subtitle={
                    currentShift
                        ? `เปิดกะเมื่อ ${dayjs(currentShift.open_time).format('DD/MM/YYYY HH:mm')} น.`
                        : 'ยังไม่เปิดกะ'
                }
                icon={<ClockCircleOutlined />}
                onBack={() => router.back()}
                actions={
                    <Space size={8}>
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
                                ปิดกะ
                            </Button>
                        ) : null}
                    </Space>
                }
            />

            <PageContainer>
                <PageStack>
                    {!currentShift ? (
                        <PageSection>
                            <UIEmptyState
                                title="ยังไม่มีกะที่เปิดใช้งาน"
                                description="กรุณาเปิดกะเพื่อเริ่มต้นการขายและบันทึกสรุปรายวัน"
                                action={canCreateShifts ? (
                                    <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => setOpenShiftVisible(true)}>
                                        เปิดกะการทำงาน
                                    </Button>
                                ) : null}
                            />
                            {!canCreateShifts ? (
                                <AlertBox text="คุณไม่มีสิทธิ์เปิดกะ (ต้องมีสิทธิ์ shifts.page:create)" />
                            ) : null}
                        </PageSection>
                    ) : (
                        <>
                            <PageSection title="สถานะกะปัจจุบัน">
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                    gap: 12
                                }}>
                                    <Card size="small" style={{ borderRadius: 14 }}>
                                        <Text type="secondary">สถานะ</Text>
                                        <div style={{ marginTop: 6 }}>
                                            <Tag color="success" style={{ borderRadius: 6 }}>เปิดกะอยู่</Tag>
                                        </div>
                                    </Card>

                                    <Card size="small" style={{ borderRadius: 14 }}>
                                        <Text type="secondary">ระยะเวลากะ</Text>
                                        <Title level={5} style={{ margin: '6px 0 0' }}>{shiftDuration}</Title>
                                    </Card>

                                    <Card size="small" style={{ borderRadius: 14 }}>
                                        <Text type="secondary">ผู้เปิดกะ</Text>
                                        <Title level={5} style={{ margin: '6px 0 0' }}>
                                            {currentShift.user?.display_name || currentShift.user?.username || '-'}
                                        </Title>
                                    </Card>

                                    <Card size="small" style={{ borderRadius: 14 }}>
                                        <Text type="secondary">เวลาเปิดกะ</Text>
                                        <Title level={5} style={{ margin: '6px 0 0' }}>
                                            {dayjs(currentShift.open_time).format('DD/MM/YYYY HH:mm')} น.
                                        </Title>
                                    </Card>
                                </div>

                                {!canCloseShift ? (
                                    <AlertBox text="คุณไม่มีสิทธิ์ปิดกะนี้ (เฉพาะ Admin/Manager หรือผู้เปิดกะ)" />
                                ) : null}
                            </PageSection>

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
                                    <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                                        <MetricCard icon={<RiseOutlined />} label="ยอดขายรวม" value={`฿${totalSales.toLocaleString()}`} color="#10b981" />
                                        <MetricCard icon={<ShoppingOutlined />} label="กำไรสุทธิ" value={`฿${netProfit.toLocaleString()}`} color="#0ea5e9" />
                                        <MetricCard icon={<WalletOutlined />} label="เงินทอนเริ่มต้น" value={`฿${startAmount.toLocaleString()}`} color="#f59e0b" />
                                        <MetricCard icon={<SafetyCertificateOutlined />} label="เงินสดในลิ้นชัก" value={`฿${cashInDrawer.toLocaleString()}`} color="#7c3aed" />
                                        <MetricCard icon={<SafetyCertificateOutlined />} label="ยอดคาดหวังปิดกะ" value={`฿${expectedAmount.toLocaleString()}`} color="#334155" />
                                        <MetricCard icon={<SafetyCertificateOutlined />} label="ผลต่างปิดกะ" value={`฿${diffAmount.toLocaleString()}`} color={diffAmount >= 0 ? '#059669' : '#dc2626'} />
                                        <MetricCard icon={<WalletOutlined />} label="ยอดนับจริงล่าสุด" value={endAmount > 0 ? `฿${endAmount.toLocaleString()}` : '-'} color="#64748b" />
                                    </div>
                                ) : (
                                    <Text type="secondary">ยังไม่มีข้อมูลสรุปยอดกะ</Text>
                                )}
                            </PageSection>

                            <PageSection title="รายละเอียดวิธีชำระเงิน">
                                {Object.keys(paymentMethods).length > 0 ? (
                                    <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                                        {Object.entries(paymentMethods).map(([method, amount]) => (
                                            <Card key={method} size="small" style={{ borderRadius: 12 }}>
                                                <Text type="secondary">{method}</Text>
                                                <Title level={5} style={{ margin: '6px 0 0' }}>
                                                    ฿{toNumber(amount).toLocaleString()}
                                                </Title>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <Text type="secondary">ยังไม่มีข้อมูลวิธีชำระเงินในกะนี้</Text>
                                )}
                            </PageSection>

                            <PageSection title="สินค้าขายดี">
                                {summary?.top_products?.length ? (
                                    <div style={{ display: 'grid', gap: 10 }}>
                                        {summary.top_products.slice(0, 5).map((item, index) => (
                                            <div
                                                key={`${item.id}-${index}`}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: 12,
                                                    padding: '10px 12px'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <div style={{
                                                        width: 26,
                                                        height: 26,
                                                        borderRadius: '50%',
                                                        background: '#f1f5f9',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: 12,
                                                        fontWeight: 700,
                                                        color: '#475569'
                                                    }}>
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <Text strong>{item.name}</Text>
                                                        <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                                                            จำนวน {item.quantity} {item.unit || 'หน่วย'}
                                                        </Text>
                                                    </div>
                                                </div>
                                                <Text strong>฿{toNumber(item.revenue).toLocaleString()}</Text>
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
            />

            <CloseShiftModal
                open={closeShiftVisible}
                onCancel={() => setCloseShiftVisible(false)}
                onSuccess={() => setCloseShiftVisible(false)}
            />
        </div>
    );
}

function MetricCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
    return (
        <Card size="small" style={{ borderRadius: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, color }}>
                {icon}
                <Text type="secondary">{label}</Text>
            </div>
            <Title level={4} style={{ margin: 0, color }}>{value}</Title>
        </Card>
    );
}

function AlertBox({ text }: { text: string }) {
    return (
        <div style={{
            marginTop: 12,
            borderRadius: 10,
            border: '1px solid #fecaca',
            background: '#fef2f2',
            padding: '10px 12px'
        }}>
            <Text style={{ color: '#b91c1c' }}>{text}</Text>
        </div>
    );
}
