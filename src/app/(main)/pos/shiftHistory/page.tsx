'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Button,
    Space,
    Tag,
    DatePicker,
    Modal,
    Spin,
    Grid,
} from 'antd';
import {
    UserOutlined,
    ClockCircleOutlined as ClockIcon,
    FieldTimeOutlined,
    HistoryOutlined,
    ReloadOutlined,
    ClockCircleOutlined,
    CalendarOutlined,
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
import ShiftSummaryModal from '../../../../components/pos/shifts/ShiftSummaryModal';
import PageContainer from '../../../../components/ui/page/PageContainer';
import PageSection from '../../../../components/ui/page/PageSection';
import PageStack from '../../../../components/ui/page/PageStack';
import UIPageHeader from '../../../../components/ui/page/PageHeader';
import UIEmptyState from '../../../../components/ui/states/EmptyState';
import PageState from '../../../../components/ui/states/PageState';
import { pageStyles, globalStyles } from '../../../../theme/pos/shiftHistory/style';
import ListPagination, { type CreatedSort } from '../../../../components/ui/pagination/ListPagination';
import { ModalSelector } from "../../../../components/ui/select/ModalSelector";
import { StatsGroup } from "../../../../components/ui/card/StatsGroup";
import { SearchInput } from "../../../../components/ui/input/SearchInput";
import { SearchBar } from "../../../../components/ui/page/SearchBar";
import { useListState } from '../../../../hooks/pos/useListState';

dayjs.extend(duration);
dayjs.locale('th');



type StatusFilter = 'all' | ShiftStatus;

function toNumber(value: number | string | null | undefined) {
    return Number(value || 0);
}

function formatMoney(
    value: number | string | null | undefined,
    options?: { dashWhenNull?: boolean }
) {
    if (options?.dashWhenNull && (value === null || value === undefined || value === "")) {
        return "-";
    }
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

const ShiftHistoryCard = React.memo(({
    shift,
    onViewSummary
}: {
    shift: ShiftHistoryItem;
    onViewSummary: (id: string) => void;
}) => {
    const isClosed = shift.status === ShiftStatus.CLOSED;
    const diffNumber = shift.diff_amount === null || shift.diff_amount === undefined ? null : toNumber(shift.diff_amount);

    return (
        <div className="shift-history-card" style={{ ...pageStyles.shiftCard(), marginBottom: 12 }}>
            <div style={{ ...pageStyles.shiftCardInner, alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="shift-card-header">
                        <span className="shift-card-id">Shift #{shift.id.slice(0, 8)}</span>
                        <Tag color={isClosed ? 'default' : 'green'} style={{ margin: 0, borderRadius: 6 }}>
                            {isClosed ? 'ปิดกะแล้ว' : 'กำลังเปิดกะ'}
                        </Tag>
                    </div>

                    <div className="shift-card-meta">
                        <div className="shift-card-meta-row">
                            <UserOutlined className="meta-icon" />
                            <span>{shift.user?.name || shift.user?.username || '-'}</span>
                        </div>
                        <div className="shift-card-meta-row">
                            <ClockIcon className="meta-icon" />
                            <span>เปิดกะ: {formatDateTime(shift.open_time)} | ปิดกะ: {formatDateTime(shift.close_time)}</span>
                        </div>
                        <div className="shift-card-meta-row">
                            <FieldTimeOutlined className="meta-icon" />
                            <span>ระยะเวลา: {getDurationLabel(shift.open_time, shift.close_time)}</span>
                        </div>
                    </div>

                    <div className="shift-mini-metrics">
                        <MiniMetric label="เงินเริ่มต้น" value={formatMoney(shift.start_amount)} color="#334155" />
                        <MiniMetric label="ยอดคาดหวัง" value={formatMoney(shift.expected_amount, { dashWhenNull: true })} color="#0369a1" />
                        <MiniMetric label="ยอดนับจริง" value={formatMoney(shift.end_amount, { dashWhenNull: true })} color="#0f766e" />
                        <MiniMetric
                            label="ผลต่าง"
                            value={formatMoney(shift.diff_amount, { dashWhenNull: true })}
                            color={diffNumber === null ? '#64748b' : diffNumber >= 0 ? '#059669' : '#dc2626'}
                        />
                    </div>
                </div>

                <Button className="shift-view-btn" onClick={() => onViewSummary(shift.id)}>
                    ดูสรุป
                </Button>
            </div>
        </div>
    );
});
ShiftHistoryCard.displayName = 'ShiftHistoryCard';

const MiniMetric = React.memo(({ label, value, color }: { label: string; value: string; color: string }) => {
    return (
        <div className="mini-metric">
            <div className="mini-label">{label}</div>
            <div className="mini-value" style={{ color }}>{value}</div>
        </div>
    );
});
MiniMetric.displayName = 'MiniMetric';

export default function ShiftHistoryPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { socket } = useSocket();
    const { isAuthorized, isChecking } = useRoleGuard();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;

    const {
        page, setPage,
        pageSize, setPageSize,
        total, setTotal,
        searchText, setSearchText,
        debouncedSearch,
        createdSort, setCreatedSort,
        filters, setFilters, updateFilter,
        isUrlReady
    } = useListState({
        defaultPageSize: 10,
        defaultSort: 'new',
        defaultFilters: {
            status: 'all' as StatusFilter,
            date_from: '' as string,
            date_to: '' as string
        }
    });

    const statusFilter = filters.status;
    const dateFrom = filters.date_from || undefined;
    const dateTo = filters.date_to || undefined;

    const dateRange = useMemo<[Dayjs | null, Dayjs | null] | null>(() => {
        const from = dateFrom ? dayjs(dateFrom) : null;
        const to = dateTo ? dayjs(dateTo) : null;
        if (from?.isValid() || to?.isValid()) {
            return [from?.isValid() ? from : null, to?.isValid() ? to : null];
        }
        return null;
    }, [dateFrom, dateTo]);

    const setDateRange = (range: [Dayjs | null, Dayjs | null] | null) => {
        setFilters(prev => ({
            ...prev,
            date_from: range?.[0] ? range[0].toISOString() : '',
            date_to: range?.[1] ? range[1].toISOString() : ''
        }));
    };

    const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
    const [isDateModalVisible, setIsDateModalVisible] = useState(false);
    const [isCustomDate, setIsCustomDate] = useState(false);
    const [tempDateRange, setTempDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(dateRange);

    useEffect(() => {
        setTempDateRange(dateRange);
    }, [dateRange]);

    const handleViewSummary = React.useCallback((id: string) => {
        setSelectedShiftId(id);
    }, []);

    const dateLabel = useMemo(() => {
        if (!dateRange || (!dateRange[0] && !dateRange[1])) return 'ทั้งหมด';
        const [start, end] = dateRange;
        if (start && end && start.isSame(end, 'second')) {
            return start.format('DD/MM/YYYY HH:mm');
        }
        const format = 'DD/MM/YYYY HH:mm';
        return `${start?.format(format) ?? ''}${start && end ? ' - ' : ''}${end?.format(format) ?? ''}`;
    }, [dateRange]);

    const datePresets = [
        { label: 'ทั้งหมด', value: null },
        { label: 'วันนี้', value: [dayjs().startOf('day'), dayjs().endOf('day')] as [Dayjs, Dayjs] },
        { label: 'เมื่อวาน', value: [dayjs().subtract(1, 'day').startOf('day'), dayjs().subtract(1, 'day').endOf('day')] as [Dayjs, Dayjs] },
        { label: '7 วันล่าสุด', value: [dayjs().subtract(6, 'days').startOf('day'), dayjs().endOf('day')] as [Dayjs, Dayjs] },
        { label: 'เดือนนี้', value: [dayjs().startOf('month'), dayjs().endOf('month')] as [Dayjs, Dayjs] },
    ];

    const historyQuery = useQuery<ShiftHistoryResponse>({
        queryKey: ['shiftHistory', page, pageSize, debouncedSearch, statusFilter, createdSort, dateFrom, dateTo],
        queryFn: async () => {
            return shiftsService.getHistory({
                page,
                limit: pageSize,
                q: debouncedSearch.trim() || undefined,
                status: statusFilter === 'all' ? undefined : statusFilter,
                sort_created: createdSort,
                date_from: dateFrom,
                date_to: dateTo
            });
        },
        placeholderData: (prev) => prev,
        enabled: isAuthorized && isUrlReady,
        staleTime: 15_000,
        refetchOnWindowFocus: false,
    });

    const summaryQuery = useQuery<ShiftSummary | null>({
        queryKey: ['shiftSummaryById', selectedShiftId],
        queryFn: async () => {
            if (!selectedShiftId) return null;
            return (await shiftsService.getSummary(selectedShiftId)) as ShiftSummary;
        },
        enabled: Boolean(selectedShiftId),
        staleTime: 10_000,
        refetchOnWindowFocus: false,
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
    const stats = historyData?.stats;

    useEffect(() => {
        if (historyData?.pagination?.total !== undefined) {
            setTotal(historyData.pagination.total);
        }
    }, [historyData, setTotal]);

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
                icon={<HistoryOutlined />}
                onBack={() => router.back()}
                actions={
                    <Space size={10}>
                        <Button icon={<ReloadOutlined />} onClick={() => historyQuery.refetch()} loading={historyQuery.isFetching} />
                        <Button icon={<ClockCircleOutlined />} onClick={() => router.push('/pos/shift')}>
                            ไปหน้ากะปัจจุบัน
                        </Button>
                    </Space>
                }
            />

            <PageContainer>
                <PageStack>
                    <StatsGroup
                        columns={isMobile ? 2 : 3}
                        stats={[
                            { label: 'จำนวนกะทั้งหมด', value: totalCount, color: '#0f172a' },
                            { label: 'กะที่เปิดอยู่', value: openCount, color: '#059669' },
                            { label: 'กะที่ปิดแล้ว', value: closedCount, color: '#64748b' },
                            { label: 'รวมเงินเริ่มต้น', value: formatMoney(stats?.total_start_amount), color: '#0369a1' },
                            { label: 'รวมยอดนับจริง', value: formatMoney(stats?.total_end_amount), color: '#0f766e' },
                            { label: 'รวมผลต่าง', value: formatMoney(stats?.total_diff_amount), color: toNumber(stats?.total_diff_amount) >= 0 ? '#059669' : '#dc2626' },
                        ]}
                    />

                    <SearchBar>
                        <SearchInput
                            placeholder="ค้นหา"
                            value={searchText}
                            onChange={(val) => {
                                setSearchText(val);
                            }}
                        />
                        <Space wrap size={10}>
                            <ModalSelector<StatusFilter>
                                title="เลือกสถานะ"
                                options={[
                                    { label: `ทั้งหมด (${totalCount})`, value: 'all' },
                                    { label: `OPEN (${openCount})`, value: ShiftStatus.OPEN },
                                    { label: `CLOSED (${closedCount})`, value: ShiftStatus.CLOSED },
                                ]}
                                value={statusFilter}
                                onChange={(value) => {
                                    updateFilter('status', value);
                                }}
                                style={{ minWidth: 150 }}
                            />
                            <ModalSelector<CreatedSort>
                                title="เรียงลำดับ"
                                options={[
                                    { label: 'เรียงจากเก่าก่อน', value: 'old' },
                                    { label: 'เรียงจากใหม่ก่อน', value: 'new' },
                                ]}
                                value={createdSort}
                                onChange={(value) => setCreatedSort(value)}
                                style={{ minWidth: 120 }}
                            />
                            <div style={{ flex: 1, minWidth: 200 }}>
                                <Button
                                    icon={<CalendarOutlined />}
                                    onClick={() => {
                                        setTempDateRange(dateRange);
                                        setIsDateModalVisible(true);
                                    }}
                                    className="date-picker-button"
                                    style={{
                                        padding: '12px 16px',
                                        border: '2px solid #e2e8f0',
                                        borderRadius: 14,
                                        background: (dateRange && (dateRange[0] || dateRange[1])) ? 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)' : '#fff',
                                        borderColor: (dateRange && (dateRange[0] || dateRange[1])) ? '#4F46E5' : '#e2e8f0',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        minHeight: 48,
                                        transition: 'all 0.2s ease',
                                        width: '100%',
                                        height: 'auto'
                                    }}
                                >
                                    <Space>
                                        <CalendarOutlined style={{ color: (dateRange && (dateRange[0] || dateRange[1])) ? '#4F46E5' : '#94a3b8' }} />
                                        <span style={{ 
                                            color: (dateRange && (dateRange[0] || dateRange[1])) ? '#1e293b' : '#94a3b8',
                                            fontWeight: (dateRange && (dateRange[0] || dateRange[1])) ? 600 : 400
                                        }}>
                                            {dateLabel}
                                        </span>
                                    </Space>
                                    <CheckCircleOutlined style={{ fontSize: 12, color: (dateRange && (dateRange[0] || dateRange[1])) ? '#4F46E5' : '#94a3b8' }} />
                                </Button>
                            </div>
                        </Space>
                    </SearchBar>

                    <PageSection title="รายการประวัติกะ" extra={<span style={{ fontWeight: 600 }}>{total} รายการ</span>}>
                        {historyQuery.isLoading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
                                <Spin size="large" />
                            </div>
                        ) : historyQuery.isError ? (
                            <PageState
                                status="error"
                                title="โหลดประวัติกะไม่สำเร็จ"
                                error={historyQuery.error}
                                onRetry={() => historyQuery.refetch()}
                            />
                        ) : rows.length > 0 ? (
                            <>
                                {rows.map((shift) => (
                                    <ShiftHistoryCard
                                        key={shift.id}
                                        shift={shift}
                                        onViewSummary={handleViewSummary}
                                    />
                                ))}

                                <div style={{ marginTop: 12 }}>
                                    <ListPagination
                                        page={page}
                                        total={total}
                                        pageSize={pageSize}
                                        onPageChange={setPage}
                                        onPageSizeChange={setPageSize}
                                        activeColor="#7C3AED"
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

            <ShiftSummaryModal
                open={Boolean(selectedShiftId)}
                onClose={() => setSelectedShiftId(null)}
                summary={summaryQuery.data ?? null}
                loading={summaryQuery.isLoading}
                error={summaryQuery.isError ? summaryQuery.error : null}
                onRetry={() => summaryQuery.refetch()}
            />

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
                width={isMobile ? '100%' : 480}
                style={{ maxWidth: '95vw', margin: '10px auto' }}
                bodyStyle={{ padding: isMobile ? '16px 12px' : 24 }}
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
                                            const val = preset.value;
                                            setDateRange(val);
                                            setTempDateRange(val);
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
                                            background: isPresetActive ? '#f8fafc' : '#fff',
                                            borderColor: isPresetActive ? '#4f46e5' : '#e5e7eb'
                                        }}
                                    >
                                        <span style={{ fontWeight: isPresetActive ? 600 : 400, color: isPresetActive ? '#4f46e5' : '#1e293b' }}>
                                            {preset.label}
                                        </span>
                                        {isPresetActive && (
                                            <CheckCircleOutlined style={{ color: '#4f46e5' }} />
                                        )}
                                    </div>
                                );
                            })}
                            <Button 
                                type="dashed" 
                                style={{ height: 48, borderRadius: 12, borderStyle: 'dashed', borderWidth: 2 }} 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setTempDateRange(dateRange);
                                    setIsCustomDate(true);
                                }}
                            >
                                เลือกช่วงวันที่เอง...
                            </Button>
                        </>
                    ) : (
                        <div className="custom-date-section">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                                <span style={{ fontWeight: 600, fontSize: 16, color: '#1e293b' }}>ระบุเวลาเอง</span>
                                <Button type="text" size="small" onClick={() => setIsCustomDate(false)}>ย้อนกลับ</Button>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#64748b' }}>ตั้งแต่วันที่/เวลา</span>
                                    <DatePicker
                                        size="large"
                                        value={tempDateRange?.[0]}
                                        onChange={(val) => {
                                            setTempDateRange([val, tempDateRange?.[1] || null]);
                                        }}
                                        format="DD/MM/YYYY HH:mm"
                                        showTime={{ format: 'HH:mm' }}
                                        allowClear
                                        style={{ width: '100%', borderRadius: 10 }}
                                        placeholder="เลือกเวลาเริ่มต้น"
                                        getPopupContainer={(trigger) => trigger.parentElement!}
                                        dropdownClassName="mobile-datepicker-dropdown"
                                        inputReadOnly={isMobile}
                                    />
                                </div>

                                <div style={{ position: 'relative' }}>
                                    <span style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#64748b' }}>ถึงวันที่/เวลา</span>
                                    <DatePicker
                                        size="large"
                                        value={tempDateRange?.[1]}
                                        onChange={(val) => {
                                            setTempDateRange([tempDateRange?.[0] || null, val]);
                                        }}
                                        format="DD/MM/YYYY HH:mm"
                                        showTime={{ format: 'HH:mm' }}
                                        allowClear
                                        style={{ width: '100%', borderRadius: 10 }}
                                        placeholder="เลือกเวลาสิ้นสุด"
                                        getPopupContainer={(trigger) => trigger.parentElement!}
                                        dropdownClassName="mobile-datepicker-dropdown"
                                        inputReadOnly={isMobile}
                                        disabledDate={(current) => {
                                            if (!tempDateRange?.[0]) return false;
                                            return current && current < tempDateRange[0].startOf('day');
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginTop: 24 }}>
                                <Button 
                                    type="primary" 
                                    block 
                                    size="large"
                                    style={{ borderRadius: 10, background: '#4F46E5', height: 48, fontWeight: 600 }}
                                    disabled={!tempDateRange?.[0] || !tempDateRange?.[1]}
                                    onClick={() => {
                                        if (tempDateRange && tempDateRange[0] && tempDateRange[1]) {
                                            setDateRange(tempDateRange);
                                            setIsDateModalVisible(false);
                                            setIsCustomDate(false);
                                        }
                                    }}
                                >
                                    ยืนยันช่วงเวลา
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
}
