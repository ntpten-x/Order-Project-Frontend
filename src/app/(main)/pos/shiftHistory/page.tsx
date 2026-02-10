'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Typography,
    Button,
    Input,
    Space,
    Segmented,
    Tag,
    DatePicker,
    Modal,
    Spin,
    Pagination,
    Card
} from 'antd';
import {
    HistoryOutlined,
    ReloadOutlined,
    SearchOutlined,
    ClockCircleOutlined,
    RiseOutlined,
    SafetyCertificateOutlined,
    CalendarOutlined,
    DownOutlined,
    CheckCircleOutlined
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import duration from 'dayjs/plugin/duration';
import 'dayjs/locale/th';
import { useRouter } from 'next/navigation';
import { useSocket } from '../../../../hooks/useSocket';
import { useRoleGuard } from '../../../../utils/pos/accessControl';
import { shiftsService } from '../../../../services/pos/shifts.service';
import {
    ShiftHistoryItem,
    ShiftHistoryResponse,
    ShiftStatus,
    ShiftSummary,
} from '../../../../types/api/pos/shifts';
import { RealtimeEvents } from '../../../../utils/realtimeEvents';
import { AccessGuardFallback } from '../../../../components/pos/AccessGuard';
import PageContainer from '../../../../components/ui/page/PageContainer';
import PageSection from '../../../../components/ui/page/PageSection';
import PageStack from '../../../../components/ui/page/PageStack';
import UIPageHeader from '../../../../components/ui/page/PageHeader';
import UIEmptyState from '../../../../components/ui/states/EmptyState';
import { pageStyles, globalStyles } from '../../../../theme/pos/shiftHistory/style';

dayjs.extend(duration);
dayjs.locale('th');

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

type StatusFilter = 'all' | ShiftStatus;

function toNumber(value: number | string | null | undefined) {
    return Number(value || 0);
}

function formatMoney(value: number | string | null | undefined) {
    return `฿${toNumber(value).toLocaleString('th-TH')}`;
}

function formatDateTime(value?: string | null) {
    if (!value) return '-';
    const date = dayjs(value);
    if (!date.isValid()) return '-';
    return date.format('DD/MM/YYYY HH:mm');
}

function getDurationLabel(openTime: string, closeTime?: string | null) {
    const start = dayjs(openTime);
    const end = closeTime ? dayjs(closeTime) : dayjs();
    if (!start.isValid() || !end.isValid()) return '-';

    const diff = dayjs.duration(end.diff(start));
    const hours = Math.floor(diff.asHours());
    const minutes = diff.minutes();
    return `${hours} ชม. ${minutes} นาที`;
}

function ShiftHistoryCard({
    shift,
    onViewSummary
}: {
    shift: ShiftHistoryItem;
    onViewSummary: (id: string) => void;
}) {
    const isClosed = shift.status === ShiftStatus.CLOSED;

    return (
        <div
            className="shift-history-card"
            style={{
                ...pageStyles.shiftCard(true),
                borderRadius: 16,
                marginBottom: 12
            }}
        >
            <div style={{ ...pageStyles.shiftCardInner, alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                        <Text strong style={{ fontSize: 15, color: '#0f172a' }}>
                            Shift #{shift.id.slice(0, 8)}
                        </Text>
                        <Tag color={isClosed ? 'default' : 'green'}>
                            {isClosed ? 'ปิดกะแล้ว' : 'กำลังเปิดกะ'}
                        </Tag>
                    </div>

                    <Text type="secondary" style={{ display: 'block', fontSize: 13 }}>
                        ผู้เปิดกะ: {shift.user?.name || shift.user?.username || '-'}
                    </Text>
                    <Text type="secondary" style={{ display: 'block', fontSize: 13 }}>
                        เปิดกะ: {formatDateTime(shift.open_time)} | ปิดกะ: {formatDateTime(shift.close_time)}
                    </Text>
                    <Text type="secondary" style={{ display: 'block', fontSize: 12, marginTop: 2 }}>
                        ระยะเวลากะ: {getDurationLabel(shift.open_time, shift.close_time)}
                    </Text>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginTop: 10 }}>
                        <MiniMetric label="เงินเริ่มต้น" value={formatMoney(shift.start_amount)} color="#334155" />
                        <MiniMetric label="ยอดคาดหวัง" value={formatMoney(shift.expected_amount)} color="#0369a1" />
                        <MiniMetric label="ยอดนับจริง" value={formatMoney(shift.end_amount)} color="#0f766e" />
                        <MiniMetric
                            label="ผลต่าง"
                            value={formatMoney(shift.diff_amount)}
                            color={toNumber(shift.diff_amount) >= 0 ? '#059669' : '#dc2626'}
                        />
                    </div>
                </div>

                <Button onClick={() => onViewSummary(shift.id)}>
                    ดูสรุปกะ
                </Button>
            </div>
        </div>
    );
}

function MiniMetric({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 10px' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>{label}</Text>
            <div style={{ fontWeight: 700, color, marginTop: 2 }}>{value}</div>
        </div>
    );
}

export default function ShiftHistoryPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { socket } = useSocket();
    const { isAuthorized, isChecking } = useRoleGuard({ allowedRoles: ['Admin', 'Manager', 'Employee'] });

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
    const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
    const [isDateModalVisible, setIsDateModalVisible] = useState(false);
    const [isCustomDate, setIsCustomDate] = useState(false);

    const dateFrom = useMemo(
        () => (dateRange?.[0] ? dateRange[0].startOf('day').toISOString() : undefined),
        [dateRange]
    );
    const dateTo = useMemo(
        () => (dateRange?.[1] ? dateRange[1].endOf('day').toISOString() : undefined),
        [dateRange]
    );

    const dateLabel = useMemo(() => {
        if (!dateRange || (!dateRange[0] && !dateRange[1])) return 'ทั้งหมด';
        if (dateRange[0] && dateRange[1] && dateRange[0].isSame(dateRange[1], 'day')) {
            return dateRange[0].format('DD/MM/YYYY');
        }
        return `${dateRange[0]?.format('DD/MM/YYYY') ?? ''} - ${dateRange[1]?.format('DD/MM/YYYY') ?? ''}`;
    }, [dateRange]);

    const datePresets = [
        { label: 'ทั้งหมด', value: null },
        { label: 'วันนี้', value: [dayjs().startOf('day'), dayjs().endOf('day')] as [Dayjs, Dayjs] },
        { label: 'เมื่อวาน', value: [dayjs().subtract(1, 'day').startOf('day'), dayjs().subtract(1, 'day').endOf('day')] as [Dayjs, Dayjs] },
        { label: '7 วันล่าสุด', value: [dayjs().subtract(6, 'days').startOf('day'), dayjs().endOf('day')] as [Dayjs, Dayjs] },
        { label: 'เดือนนี้', value: [dayjs().startOf('month'), dayjs().endOf('month')] as [Dayjs, Dayjs] },
    ];

    const historyQuery = useQuery<ShiftHistoryResponse>({
        queryKey: ['shiftHistory', page, pageSize, searchText, statusFilter, dateFrom, dateTo],
        queryFn: async () => {
            return shiftsService.getHistory({
                page,
                limit: pageSize,
                q: searchText.trim() || undefined,
                status: statusFilter === 'all' ? undefined : statusFilter,
                date_from: dateFrom,
                date_to: dateTo
            });
        },
        placeholderData: (prev) => prev,
        enabled: isAuthorized,
        staleTime: 15_000,
    });

    const summaryQuery = useQuery<ShiftSummary | null>({
        queryKey: ['shiftSummaryById', selectedShiftId],
        queryFn: async () => {
            if (!selectedShiftId) return null;
            return (await shiftsService.getSummary(selectedShiftId)) as ShiftSummary;
        },
        enabled: Boolean(selectedShiftId),
        staleTime: 10_000,
    });

    useEffect(() => {
        if (!socket) return;
        const refresh = () => {
            queryClient.invalidateQueries({ queryKey: ['shiftHistory'] });
        };
        socket.on(RealtimeEvents.shifts.update, refresh);
        return () => {
            socket.off(RealtimeEvents.shifts.update, refresh);
        };
    }, [socket, queryClient]);

    const historyData = historyQuery.data;
    const rows = historyData?.data || [];
    const pagination = historyData?.pagination;
    const stats = historyData?.stats;

    const openCount = stats?.open || 0;
    const closedCount = stats?.closed || 0;
    const totalCount = stats?.total || 0;

    if (isChecking) {
        return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์การใช้งาน..." />;
    }

    if (!isAuthorized) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้" tone="danger" />;
    }

    return (
        <div className="shift-history-page" style={pageStyles.container}>
            <style>{globalStyles}</style>

            <UIPageHeader
                title="ประวัติกะการทำงาน"
                subtitle={`ทั้งหมด ${totalCount} กะ`}
                icon={<HistoryOutlined />}
                onBack={() => router.back()}
                actions={
                    <Space size={8}>
                        <Button icon={<ReloadOutlined />} onClick={() => historyQuery.refetch()} loading={historyQuery.isFetching} />
                        <Button icon={<ClockCircleOutlined />} onClick={() => router.push('/pos/shift')}>
                            ไปหน้ากะปัจจุบัน
                        </Button>
                    </Space>
                }
            />

            <PageContainer>
                <PageStack>
                    <PageSection title="ภาพรวม">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                            <MetricCard label="จำนวนกะทั้งหมด" value={String(totalCount)} color="#0f172a" icon={<ClockCircleOutlined />} />
                            <MetricCard label="กะที่เปิดอยู่" value={String(openCount)} color="#059669" icon={<Tag color="green">OPEN</Tag>} />
                            <MetricCard label="กะที่ปิดแล้ว" value={String(closedCount)} color="#64748b" icon={<Tag>CLOSED</Tag>} />
                            <MetricCard label="รวมเงินเริ่มต้น" value={formatMoney(stats?.total_start_amount)} color="#0369a1" icon={<SafetyCertificateOutlined />} />
                            <MetricCard label="รวมยอดนับจริง" value={formatMoney(stats?.total_end_amount)} color="#0f766e" icon={<WalletIcon />} />
                            <MetricCard label="รวมผลต่าง" value={formatMoney(stats?.total_diff_amount)} color={toNumber(stats?.total_diff_amount) >= 0 ? '#059669' : '#dc2626'} icon={<RiseOutlined />} />
                        </div>
                    </PageSection>

                    <PageSection title="ค้นหาและตัวกรอง">
                        <div style={{ display: 'grid', gap: 10 }}>
                            <Input
                                allowClear
                                prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
                                placeholder="ค้นหาจาก Shift ID, username หรือชื่อผู้เปิดกะ"
                                value={searchText}
                                onChange={(e) => {
                                    setPage(1);
                                    setSearchText(e.target.value);
                                }}
                            />

                            <Segmented<StatusFilter>
                                value={statusFilter}
                                onChange={(value) => {
                                    setPage(1);
                                    setStatusFilter(value);
                                }}
                                options={[
                                    { label: `ทั้งหมด (${totalCount})`, value: 'all' },
                                    { label: `OPEN (${openCount})`, value: ShiftStatus.OPEN },
                                    { label: `CLOSED (${closedCount})`, value: ShiftStatus.CLOSED },
                                ]}
                            />

                            <div 
                                onClick={() => setIsDateModalVisible(true)}
                                style={{
                                    padding: '10px 14px',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: 12,
                                    background: '#fff',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    cursor: 'pointer'
                                }}
                            >
                                <Space>
                                    <CalendarOutlined style={{ color: '#64748b' }} />
                                    <Text>{dateLabel}</Text>
                                </Space>
                                <DownOutlined style={{ fontSize: 12, color: '#94a3b8' }} />
                            </div>
                        </div>
                    </PageSection>

                    <PageSection title="รายการประวัติกะ" extra={<span style={{ fontWeight: 600 }}>{rows.length}</span>}>
                        {historyQuery.isLoading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
                                <Spin size="large" />
                            </div>
                        ) : rows.length > 0 ? (
                            <>
                                {rows.map((shift) => (
                                    <ShiftHistoryCard
                                        key={shift.id}
                                        shift={shift}
                                        onViewSummary={setSelectedShiftId}
                                    />
                                ))}

                                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
                                    <Pagination
                                        current={pagination?.page || page}
                                        pageSize={pagination?.limit || pageSize}
                                        total={pagination?.total || 0}
                                        showSizeChanger
                                        onChange={(nextPage, nextPageSize) => {
                                            setPage(nextPage);
                                            setPageSize(nextPageSize);
                                        }}
                                    />
                                </div>
                            </>
                        ) : (
                            <UIEmptyState
                                title="ไม่พบข้อมูลประวัติกะ"
                                description="ลองปรับคำค้นหา หรือตัวกรองช่วงวันที่"
                            />
                        )}
                    </PageSection>
                </PageStack>
            </PageContainer>

            <Modal
                open={Boolean(selectedShiftId)}
                title="สรุปข้อมูลกะ"
                onCancel={() => setSelectedShiftId(null)}
                footer={null}
                width={760}
            >
                {summaryQuery.isLoading ? (
                    <div style={{ padding: '40px 0', textAlign: 'center' }}>
                        <Spin />
                    </div>
                ) : summaryQuery.data ? (
                    <div style={{ display: 'grid', gap: 12 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                            <ModalMetric label="ยอดขายรวม" value={formatMoney(summaryQuery.data.summary.total_sales)} color="#10b981" />
                            <ModalMetric label="กำไรสุทธิ" value={formatMoney(summaryQuery.data.summary.net_profit)} color="#0369a1" />
                            <ModalMetric label="เงินเริ่มต้น" value={formatMoney(summaryQuery.data.shift_info.start_amount)} color="#334155" />
                            <ModalMetric label="ผลต่าง" value={formatMoney(summaryQuery.data.shift_info.diff_amount)} color={toNumber(summaryQuery.data.shift_info.diff_amount) >= 0 ? '#059669' : '#dc2626'} />
                        </div>

                        <Card size="small" title="วิธีชำระเงิน">
                            <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
                                {Object.entries(summaryQuery.data.summary.payment_methods || {}).map(([method, amount]) => (
                                    <div key={method} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 10px' }}>
                                        <Text type="secondary">{method}</Text>
                                        <div style={{ fontWeight: 700 }}>{formatMoney(amount)}</div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        <Card size="small" title="สินค้าขายดี">
                            {summaryQuery.data.top_products.length > 0 ? (
                                <div style={{ display: 'grid', gap: 8 }}>
                                    {summaryQuery.data.top_products.map((item, idx) => (
                                        <div
                                            key={`${item.id}-${idx}`}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: 10,
                                                padding: '8px 10px'
                                            }}
                                        >
                                            <Text strong>{idx + 1}. {item.name}</Text>
                                            <Text>{item.quantity} {item.unit || 'หน่วย'} | {formatMoney(item.revenue)}</Text>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <Text type="secondary">ไม่พบข้อมูลสินค้าขายดี</Text>
                            )}
                        </Card>
                    </div>
                ) : (
                    <Text type="secondary">ไม่พบข้อมูลสรุปกะ</Text>
                )}
            </Modal>

            {/* Date Selection Modal */}
            <Modal
                title="เลือกช่วงเวลา"
                open={isDateModalVisible}
                onCancel={() => {
                    setIsDateModalVisible(false);
                    setIsCustomDate(false);
                }}
                footer={null}
                centered
                width={400}
            >
                <div id="date-selection-container" style={{ display: 'flex', flexDirection: 'column', gap: 10, position: 'relative' }}>
                    {!isCustomDate ? (
                        <>
                            {datePresets.map((preset) => {
                                const isPresetActive = Boolean(
                                    (!dateRange && !preset.value) || 
                                    (dateRange && preset.value && 
                                     dateRange[0]?.isSame(preset.value[0], 'day') && 
                                     dateRange[1]?.isSame(preset.value[1], 'day'))
                                );

                                return (
                                    <div
                                        key={preset.label}
                                        onClick={() => {
                                            setPage(1);
                                            setDateRange(preset.value);
                                            setIsDateModalVisible(false);
                                        }}
                                        style={{
                                            padding: '14px 18px',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: 12,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            background: isPresetActive ? '#f0f9ff' : '#fff',
                                            borderColor: isPresetActive ? '#0ea5e9' : '#e5e7eb'
                                        }}
                                    >
                                        <Text strong={isPresetActive}>
                                            {preset.label}
                                        </Text>
                                        {isPresetActive && (
                                            <CheckCircleOutlined style={{ color: '#0ea5e9' }} />
                                        )}
                                    </div>
                                );
                            })}
                            <Button 
                                type="dashed" 
                                style={{ height: 48, borderRadius: 12 }} 
                                onClick={() => setIsCustomDate(true)}
                            >
                                เลือกช่วงวันที่เอง...
                            </Button>
                        </>
                    ) : (
                        <div style={{ padding: '8px 0' }}>
                            <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>เลือกช่วงวันที่ของคุณ</Text>
                            <RangePicker
                                value={dateRange}
                                onChange={(values) => {
                                    setPage(1);
                                    setDateRange(values);
                                    if (values && values[0] && values[1]) {
                                        setIsDateModalVisible(false);
                                        setIsCustomDate(false);
                                    }
                                }}
                                format="DD/MM/YYYY"
                                allowClear
                                style={{ width: '100%' }}
                                getPopupContainer={(trigger) => trigger.parentElement || document.body}
                                defaultOpen
                                placeholder={['วันที่เริ่มต้น', 'วันที่สิ้นสุด']}
                            />
                            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
                                <Button onClick={() => setIsCustomDate(false)}>ย้อนกลับ</Button>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
}

function MetricCard({ label, value, color, icon }: { label: string; value: string; color: string; icon: React.ReactNode }) {
    return (
        <Card size="small" style={{ borderRadius: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color }}>{icon}</span>
                <Text type="secondary">{label}</Text>
            </div>
            <Title level={4} style={{ margin: '8px 0 0', color }}>{value}</Title>
        </Card>
    );
}

function ModalMetric({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 12px' }}>
            <Text type="secondary">{label}</Text>
            <div style={{ fontSize: 20, fontWeight: 700, color }}>{value}</div>
        </div>
    );
}

function WalletIcon() {
    return <SafetyCertificateOutlined />;
}
