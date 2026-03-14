'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Alert,
    Button,
    Grid,
    Modal,
    Space,
    Spin,
    Tag,
    Typography,
} from 'antd';
import {
    CalendarOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    ClockCircleOutlined as ClockIcon,
    FieldTimeOutlined,
    HistoryOutlined,
    LeftOutlined,
    ReloadOutlined,
    RightOutlined,
    UserOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import duration from 'dayjs/plugin/duration';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
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
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('th');

const { Text } = Typography;
const SHIFT_HISTORY_TIMEZONE = 'Asia/Bangkok';

type StatusFilter = 'all' | ShiftStatus;
type ShiftHistoryPresetKey = 'all' | 'today' | 'yesterday' | '7d' | 'month' | 'custom';
type ShiftHistoryDateRange = [Dayjs, Dayjs] | null;
type DraftDateRange = [Dayjs | null, Dayjs | null];
const CALENDAR_WEEKDAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

const SHIFT_HISTORY_PRESET_OPTIONS: Array<{ label: string; value: ShiftHistoryPresetKey }> = [
    { label: 'ทั้งหมด', value: 'all' },
    { label: 'วันนี้', value: 'today' },
    { label: 'เมื่อวาน', value: 'yesterday' },
    { label: '7 วันล่าสุด', value: '7d' },
    { label: 'เดือนนี้', value: 'month' },
    { label: 'กำหนดเอง', value: 'custom' },
];

function thaiNow(): Dayjs {
    return dayjs().tz(SHIFT_HISTORY_TIMEZONE);
}

function toThaiTime(value: string | Dayjs): Dayjs {
    return dayjs(value).tz(SHIFT_HISTORY_TIMEZONE);
}

function parseThaiDateInput(rawValue: string): Dayjs {
    return dayjs.tz(`${rawValue}T00:00:00`, SHIFT_HISTORY_TIMEZONE);
}

function buildMonthDays(month: Dayjs): Dayjs[] {
    const start = month.startOf('month').startOf('week');
    return Array.from({ length: 42 }, (_, index) => start.add(index, 'day'));
}

function resolveShiftHistoryPresetRange(preset: ShiftHistoryPresetKey): ShiftHistoryDateRange {
    const today = thaiNow();
    if (preset === 'all') return null;
    if (preset === 'today') return [today.startOf('day'), today.endOf('day')];
    if (preset === 'yesterday') {
        const yesterday = today.subtract(1, 'day');
        return [yesterday.startOf('day'), yesterday.endOf('day')];
    }
    if (preset === '7d') return [today.subtract(6, 'day').startOf('day'), today.endOf('day')];
    if (preset === 'month') return [today.startOf('month'), today.endOf('month')];
    return [today.startOf('day'), today.endOf('day')];
}

function isAllDayRange(range: [Dayjs, Dayjs]): boolean {
    return range[0].format('HH:mm') === '00:00' && range[1].format('HH:mm') === '23:59';
}

function formatDateRangeLabel(range: ShiftHistoryDateRange): string {
    if (!range) return 'ทั้งหมด';
    const showTime = !isAllDayRange(range);
    if (range[0].isSame(range[1], 'day')) {
        return showTime
            ? `${range[0].format('DD MMM YYYY HH:mm')} - ${range[1].format('HH:mm')}`
            : range[0].format('DD MMM YYYY');
    }
    return showTime
        ? `${range[0].format('DD MMM YYYY HH:mm')} - ${range[1].format('DD MMM YYYY HH:mm')}`
        : `${range[0].format('DD MMM YYYY')} - ${range[1].format('DD MMM YYYY')}`;
}

function countRangeDays(range: ShiftHistoryDateRange): number {
    if (!range) return 0;
    return range[1].startOf('day').diff(range[0].startOf('day'), 'day') + 1;
}

function formatRangeTimeLabel(range: ShiftHistoryDateRange): string {
    if (!range) return 'ทุกเวลา';
    if (isAllDayRange(range)) return 'ทั้งวัน';
    return `${range[0].format('HH:mm')} - ${range[1].format('HH:mm')}`;
}

function mergeDateAndTime(date: Dayjs, timeValue: string, field: 'start' | 'end'): Dayjs {
    const [hours, minutes] = timeValue.split(':').map((value) => Number(value));
    return date
        .hour(Number.isFinite(hours) ? hours : field === 'start' ? 0 : 23)
        .minute(Number.isFinite(minutes) ? minutes : field === 'start' ? 0 : 59)
        .second(field === 'start' ? 0 : 59)
        .millisecond(field === 'start' ? 0 : 999);
}

function isSameRange(a: ShiftHistoryDateRange, b: ShiftHistoryDateRange): boolean {
    if (!a && !b) return true;
    if (!a || !b) return false;
    return a[0].valueOf() === b[0].valueOf() && a[1].valueOf() === b[1].valueOf();
}

function getMatchingPreset(range: ShiftHistoryDateRange): ShiftHistoryPresetKey {
    for (const option of SHIFT_HISTORY_PRESET_OPTIONS) {
        if (option.value === 'custom') continue;
        if (isSameRange(range, resolveShiftHistoryPresetRange(option.value))) {
            return option.value;
        }
    }
    return range ? 'custom' : 'all';
}

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
    const date = toThaiTime(value);
    if (!date.isValid()) return '-';
    return date.format('DD/MM/YYYY HH:mm');
}

function getDurationLabel(openTime: string, closeTime?: string | null) {
    const start = toThaiTime(openTime);
    const end = closeTime ? toThaiTime(closeTime) : thaiNow();
    if (!start.isValid() || !end.isValid()) return '-';

    const diff = dayjs.duration(end.diff(start));
    const hours = Math.floor(diff.asHours());
    const minutes = diff.minutes();
    return `${hours} ชม. ${minutes} นาที`;
}

function ShiftHistoryCalendarMonth({
    month,
    draftRange,
    onSelect,
}: {
    month: Dayjs;
    draftRange: DraftDateRange;
    onSelect: (value: Dayjs) => void;
}) {
    const days = useMemo(() => buildMonthDays(month), [month]);
    const [start, end] = draftRange;

    return (
        <div
            style={{
                border: '1px solid #E2E8F0',
                borderRadius: 20,
                padding: 16,
                background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 12,
                }}
            >
                <Text strong style={{ fontSize: 15, color: '#0F172A' }}>
                    {month.format('MMMM YYYY')}
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                    แตะเพื่อเลือก
                </Text>
            </div>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                    gap: 6,
                }}
            >
                {CALENDAR_WEEKDAYS.map((weekday) => (
                    <div
                        key={`${month.format('YYYY-MM')}-${weekday}`}
                        style={{
                            textAlign: 'center',
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#64748B',
                            paddingBottom: 4,
                        }}
                    >
                        {weekday}
                    </div>
                ))}

                {days.map((day) => {
                    const sameMonth = day.month() === month.month();
                    const isToday = day.isSame(thaiNow(), 'day');
                    const isStart = start ? day.isSame(start, 'day') : false;
                    const isEnd = end ? day.isSame(end, 'day') : false;
                    const isBetween = start && end ? day.isAfter(start, 'day') && day.isBefore(end, 'day') : false;
                    const isSingleSelected = isStart && isEnd;

                    return (
                        <button
                            key={day.format('YYYY-MM-DD')}
                            type="button"
                            aria-label={day.format('YYYY-MM-DD')}
                            onClick={() => onSelect(day)}
                            style={{
                                height: 44,
                                borderRadius: isSingleSelected
                                    ? 14
                                    : isStart
                                        ? '14px 8px 8px 14px'
                                        : isEnd
                                            ? '8px 14px 14px 8px'
                                            : 12,
                                border: isStart || isEnd
                                    ? '1px solid transparent'
                                    : isToday
                                        ? '1px solid #BFDBFE'
                                        : '1px solid transparent',
                                background: isStart || isEnd
                                    ? 'linear-gradient(135deg, #0F766E 0%, #2563EB 100%)'
                                    : isBetween
                                        ? '#DBEAFE'
                                        : isToday
                                            ? '#EFF6FF'
                                            : 'transparent',
                                color: isStart || isEnd ? '#FFFFFF' : sameMonth ? '#0F172A' : '#94A3B8',
                                cursor: 'pointer',
                                fontSize: 14,
                                fontWeight: isStart || isEnd || isToday ? 700 : 500,
                                transition: 'all 0.18s ease',
                                boxShadow: isStart || isEnd ? '0 10px 20px rgba(37, 99, 235, 0.18)' : 'none',
                            }}
                        >
                            {day.date()}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function ShiftHistoryDateRangeDialog({
    open,
    initialRange,
    activePreset,
    isMobile,
    showDualMonth,
    onClose,
    onApply,
}: {
    open: boolean;
    initialRange: ShiftHistoryDateRange;
    activePreset: ShiftHistoryPresetKey;
    isMobile: boolean;
    showDualMonth: boolean;
    onClose: () => void;
    onApply: (range: ShiftHistoryDateRange, preset: ShiftHistoryPresetKey) => void;
}) {
    const quickPresets = useMemo(
        () => SHIFT_HISTORY_PRESET_OPTIONS.filter((option) => option.value !== 'custom'),
        [],
    );
    const [draftDates, setDraftDates] = useState<DraftDateRange>([
        initialRange?.[0]?.startOf('day') ?? null,
        initialRange?.[1]?.startOf('day') ?? null,
    ]);
    const [draftTimes, setDraftTimes] = useState({
        start: initialRange?.[0]?.format('HH:mm') ?? '00:00',
        end: initialRange?.[1]?.format('HH:mm') ?? '23:59',
    });
    const [visibleMonth, setVisibleMonth] = useState((initialRange?.[0] ?? thaiNow()).startOf('month'));

    useEffect(() => {
        if (!open) return;
        setDraftDates([initialRange?.[0]?.startOf('day') ?? null, initialRange?.[1]?.startOf('day') ?? null]);
        setDraftTimes({
            start: initialRange?.[0]?.format('HH:mm') ?? '00:00',
            end: initialRange?.[1]?.format('HH:mm') ?? '23:59',
        });
        setVisibleMonth((initialRange?.[0] ?? thaiNow()).startOf('month'));
    }, [initialRange, open]);

    const handleSelectDay = useCallback((value: Dayjs) => {
        const selectedDay = value.startOf('day');
        setDraftDates((current) => {
            const [start, end] = current;
            if (!start || end) return [selectedDay, null];
            if (selectedDay.isBefore(start, 'day')) return [selectedDay, start];
            return [start, selectedDay];
        });
    }, []);

    const handleManualDateInput = useCallback((field: 'start' | 'end', rawValue: string) => {
        if (!rawValue) return;
        const parsed = parseThaiDateInput(rawValue);
        if (!parsed.isValid()) return;

        if (field === 'start') {
            setVisibleMonth(parsed.startOf('month'));
            setDraftDates((current) => {
                const nextStart = parsed.startOf('day');
                const currentEnd = current[1];
                if (!currentEnd || nextStart.isAfter(currentEnd, 'day')) return [nextStart, nextStart];
                return [nextStart, currentEnd];
            });
            return;
        }

        setDraftDates((current) => {
            const nextEnd = parsed.startOf('day');
            const currentStart = current[0];
            if (!currentStart) {
                setVisibleMonth(parsed.startOf('month'));
                return [nextEnd, nextEnd];
            }
            if (nextEnd.isBefore(currentStart, 'day')) return [nextEnd, nextEnd];
            return [currentStart, nextEnd];
        });
    }, []);

    const handleTimeInput = useCallback((field: 'start' | 'end', value: string) => {
        setDraftTimes((current) => ({
            ...current,
            [field]: value || (field === 'start' ? '00:00' : '23:59'),
        }));
    }, []);

    const draftStart = draftDates[0] ? mergeDateAndTime(draftDates[0], draftTimes.start, 'start') : null;
    const draftEnd = draftDates[1] ? mergeDateAndTime(draftDates[1], draftTimes.end, 'end') : null;
    const draftRange = draftStart && draftEnd ? [draftStart, draftEnd] as [Dayjs, Dayjs] : null;
    const hasInvalidRange = Boolean(draftStart && draftEnd && draftStart.isAfter(draftEnd));
    const canApplyDraft = Boolean(draftRange && !hasInvalidRange);

    return (
        <Modal
            title="เลือกช่วงเวลา"
            open={open}
            onCancel={onClose}
            width={isMobile ? 'calc(100vw - 16px)' : showDualMonth ? 1040 : 760}
            style={{ top: isMobile ? 8 : 32 }}
            zIndex={1600}
            footer={[
                <Button key="cancel" onClick={onClose}>
                    ยกเลิก
                </Button>,
                <Button
                    key="apply"
                    type="primary"
                    disabled={!canApplyDraft}
                    onClick={() => {
                        if (!draftRange) return;
                        onApply(draftRange, 'custom');
                    }}
                >
                    ใช้ช่วงเวลานี้
                </Button>,
            ]}
            destroyOnClose
        >
            <div
                style={{
                    display: 'grid',
                    gap: 16,
                    maxHeight: isMobile ? 'calc(100vh - 176px)' : 'calc(100vh - 220px)',
                    overflowY: 'auto',
                    paddingRight: isMobile ? 0 : 4,
                }}
            >
                <div
                    style={{
                        display: 'grid',
                        gap: 6,
                        padding: 16,
                        borderRadius: 20,
                        background: 'linear-gradient(135deg, rgba(15,118,110,0.08) 0%, rgba(37,99,235,0.08) 100%)',
                        border: '1px solid rgba(148, 163, 184, 0.18)',
                    }}
                >
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        ช่วงเวลาที่เลือกตอนนี้
                    </Text>
                    <Text strong style={{ fontSize: isMobile ? 16 : 18, color: '#0F172A' }}>
                        {draftRange ? formatDateRangeLabel(draftRange) : 'ทั้งหมด'}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {!draftStart && !draftEnd
                            ? 'เลือกทั้งหมด หรือระบุวันและเวลาเอง'
                            : draftStart && !draftEnd
                                ? 'เลือกวันสิ้นสุดต่อเพื่อสร้างช่วงเวลา'
                                : draftRange && hasInvalidRange
                                    ? 'เวลาเริ่มต้นต้องไม่มากกว่าเวลาสิ้นสุด'
                                    : draftRange
                                        ? `${countRangeDays(draftRange)} วัน • ${formatRangeTimeLabel(draftRange)}`
                                        : 'แตะวันเริ่มต้น แล้วแตะวันสิ้นสุด'}
                    </Text>
                </div>

                {hasInvalidRange ? (
                    <Alert
                        type="warning"
                        showIcon
                        message="ช่วงเวลาไม่ถูกต้อง"
                        description="กรุณาปรับเวลาเริ่มต้นและเวลาสิ้นสุดให้เรียงลำดับถูกต้อง"
                    />
                ) : null}

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(5, minmax(0, 1fr))',
                        gap: 8,
                    }}
                >
                    {quickPresets.map((option) => {
                        const selected = activePreset === option.value;
                        return (
                            <button
                                key={`shift-history-preset-${option.value}`}
                                type="button"
                                onClick={() => onApply(resolveShiftHistoryPresetRange(option.value), option.value)}
                                style={{
                                    minHeight: 48,
                                    borderRadius: 14,
                                    border: selected ? '1px solid rgba(37,99,235,0.35)' : '1px solid #E2E8F0',
                                    background: selected ? '#EFF6FF' : '#FFFFFF',
                                    color: selected ? '#1D4ED8' : '#334155',
                                    fontWeight: 700,
                                    fontSize: 13,
                                    cursor: 'pointer',
                                    padding: '0 12px',
                                }}
                            >
                                {option.label}
                            </button>
                        );
                    })}
                </div>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))',
                        gap: 12,
                    }}
                >
                    {([
                        { key: 'start' as const, label: 'วันเริ่มต้น', dateValue: draftDates[0], timeValue: draftTimes.start },
                        { key: 'end' as const, label: 'วันสิ้นสุด', dateValue: draftDates[1], timeValue: draftTimes.end },
                    ]).map((item) => (
                        <div
                            key={item.key}
                            style={{
                                display: 'grid',
                                gap: 10,
                                padding: 14,
                                borderRadius: 18,
                                border: '1px solid #E2E8F0',
                                background: '#FFFFFF',
                            }}
                        >
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                {item.label}
                            </Text>
                            <input
                                type="date"
                                value={item.dateValue ? item.dateValue.format('YYYY-MM-DD') : ''}
                                onChange={(event) => handleManualDateInput(item.key, event.target.value)}
                                style={{
                                    width: '100%',
                                    border: 'none',
                                    outline: 'none',
                                    fontSize: 16,
                                    fontWeight: 700,
                                    color: '#0F172A',
                                    background: 'transparent',
                                }}
                            />
                            <div
                                style={{
                                    display: 'grid',
                                    gap: 6,
                                    padding: 12,
                                    borderRadius: 14,
                                    background: '#F8FAFC',
                                    border: '1px solid #E2E8F0',
                                }}
                            >
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    เวลา
                                </Text>
                                <input
                                    type="time"
                                    step={60}
                                    value={item.timeValue}
                                    onChange={(event) => handleTimeInput(item.key, event.target.value)}
                                    style={{
                                        width: '100%',
                                        border: 'none',
                                        outline: 'none',
                                        fontSize: 18,
                                        fontWeight: 700,
                                        color: '#0F172A',
                                        background: 'transparent',
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: showDualMonth ? 'repeat(2, minmax(0, 1fr))' : '1fr',
                        gap: 12,
                    }}
                >
                    <Button icon={<LeftOutlined />} onClick={() => setVisibleMonth((current) => current.subtract(1, 'month'))}>
                        เดือนก่อน
                    </Button>
                    <Text type="secondary" style={{ fontSize: 12, textAlign: 'center' }}>
                        เลือกช่วงเวลาได้โดยแตะวันเริ่มต้นและวันสิ้นสุด
                    </Text>
                    <Button icon={<RightOutlined />} onClick={() => setVisibleMonth((current) => current.add(1, 'month'))}>
                        เดือนถัดไป
                    </Button>
                </div>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: showDualMonth ? 'repeat(2, minmax(0, 1fr))' : '1fr',
                        gap: 12,
                    }}
                >
                    <ShiftHistoryCalendarMonth month={visibleMonth} draftRange={draftDates} onSelect={handleSelectDay} />
                    {showDualMonth ? (
                        <ShiftHistoryCalendarMonth month={visibleMonth.add(1, 'month')} draftRange={draftDates} onSelect={handleSelectDay} />
                    ) : null}
                </div>
            </div>
        </Modal>
    );
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

    const dateRange = useMemo<ShiftHistoryDateRange>(() => {
        const from = dateFrom ? toThaiTime(dateFrom) : null;
        const to = dateTo ? toThaiTime(dateTo) : null;
        if (from?.isValid() && to?.isValid()) {
            return [from, to];
        }
        return null;
    }, [dateFrom, dateTo]);

    const setDateRange = useCallback((range: ShiftHistoryDateRange) => {
        setFilters(prev => ({
            ...prev,
            date_from: range?.[0] ? range[0].toISOString() : '',
            date_to: range?.[1] ? range[1].toISOString() : ''
        }));
        setPage(1);
    }, [setFilters, setPage]);

    const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
    const [isDateModalVisible, setIsDateModalVisible] = useState(false);
    const handleViewSummary = useCallback((id: string) => {
        setSelectedShiftId(id);
    }, []);

    const activeDatePreset = useMemo(() => getMatchingPreset(dateRange), [dateRange]);
    const dateLabel = useMemo(() => formatDateRangeLabel(dateRange), [dateRange]);
    const dateMetaLabel = useMemo(() => {
        if (!dateRange) return 'ทุกช่วงเวลา';
        return `${countRangeDays(dateRange)} วัน • ${formatRangeTimeLabel(dateRange)}`;
    }, [dateRange]);
    const showDualMonthCalendar = Boolean(screens.xl);

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
                                <button
                                    type="button"
                                    onClick={() => setIsDateModalVisible(true)}
                                    className="date-picker-button"
                                    style={{
                                        width: '100%',
                                        border: dateRange ? '1px solid rgba(79,70,229,0.28)' : '1px solid #E2E8F0',
                                        borderRadius: 18,
                                        background: dateRange
                                            ? 'linear-gradient(135deg, rgba(238,242,255,0.96) 0%, rgba(224,231,255,0.98) 100%)'
                                            : 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
                                        display: 'grid',
                                        gridTemplateColumns: isMobile ? '1fr' : 'auto 1fr auto',
                                        gap: 12,
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        minHeight: isMobile ? 86 : 72,
                                        transition: 'all 0.2s ease',
                                        padding: isMobile ? '14px 16px' : '14px 18px',
                                        textAlign: 'left',
                                        boxShadow: dateRange ? '0 14px 28px rgba(79, 70, 229, 0.08)' : 'none',
                                    }}
                                >
                                    <div
                                        style={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: 14,
                                            display: 'grid',
                                            placeItems: 'center',
                                            background: dateRange
                                                ? 'linear-gradient(135deg, rgba(79,70,229,0.14) 0%, rgba(37,99,235,0.16) 100%)'
                                                : 'linear-gradient(135deg, rgba(148,163,184,0.12) 0%, rgba(226,232,240,0.8) 100%)',
                                            color: dateRange ? '#4F46E5' : '#64748B',
                                        }}
                                    >
                                        <CalendarOutlined />
                                    </div>
                                    <div style={{ display: 'grid', gap: 4, minWidth: 0 }}>
                                        <span style={{ fontSize: 12, color: '#64748B' }}>
                                            ช่วงเวลากรองประวัติกะ
                                        </span>
                                        <span style={{ color: '#0F172A', fontWeight: 700, fontSize: isMobile ? 14 : 16 }}>
                                            {dateLabel}
                                        </span>
                                        <span style={{ color: '#64748B', fontSize: 12 }}>
                                            {dateMetaLabel}
                                        </span>
                                    </div>
                                    <CheckCircleOutlined
                                        style={{
                                            fontSize: 14,
                                            color: dateRange ? '#4F46E5' : '#94A3B8',
                                            justifySelf: isMobile ? 'start' : 'end',
                                        }}
                                    />
                                </button>
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
            <ShiftHistoryDateRangeDialog
                open={isDateModalVisible}
                initialRange={dateRange}
                activePreset={activeDatePreset}
                isMobile={isMobile}
                showDualMonth={showDualMonthCalendar}
                onClose={() => setIsDateModalVisible(false)}
                onApply={(range) => {
                    setDateRange(range);
                    setIsDateModalVisible(false);
                }}
            />
        </div>
    );
}
