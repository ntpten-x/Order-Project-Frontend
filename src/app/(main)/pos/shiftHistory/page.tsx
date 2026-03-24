'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Alert,
    Button,
    Card,
    Drawer,
    Grid,
    Modal,
    Pagination,
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
    CloseOutlined,
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
import { useAuth } from '../../../../contexts/AuthContext';
import { useEffectivePermissions } from '../../../../hooks/useEffectivePermissions';
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
import { type CreatedSort } from '../../../../components/ui/pagination/ListPagination';
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
    isMobile,
}: {
    month: Dayjs;
    draftRange: DraftDateRange;
    onSelect: (value: Dayjs) => void;
    isMobile?: boolean;
}) {
    const days = useMemo(() => buildMonthDays(month), [month]);
    const [start, end] = draftRange;
    const cellSize = isMobile ? 46 : 44;

    return (
        <div style={{ padding: isMobile ? '0 2px' : 0 }}>
            {/* Weekday headers */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                    gap: 2,
                    marginBottom: 8,
                    paddingBottom: 8,
                    borderBottom: '1px solid #F1F5F9',
                }}
            >
                {CALENDAR_WEEKDAYS.map((weekday, idx) => (
                    <div
                        key={`${month.format('YYYY-MM')}-${weekday}`}
                        style={{
                            textAlign: 'center',
                            fontSize: 11,
                            fontWeight: 600,
                            color: idx === 0 || idx === 6 ? '#94A3B8' : '#64748B',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                        }}
                    >
                        {weekday}
                    </div>
                ))}
            </div>

            {/* Day cells */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                    gap: 2,
                }}
            >
                {days.map((day) => {
                    const sameMonth = day.month() === month.month();
                    const isToday = day.isSame(thaiNow(), 'day');
                    const isStart = start ? day.isSame(start, 'day') : false;
                    const isEnd = end ? day.isSame(end, 'day') : false;
                    const isBetween =
                        start && end
                            ? day.isAfter(start, 'day') && day.isBefore(end, 'day')
                            : false;
                    const isSelected = isStart || isEnd;
                    const isSingleSelected = isStart && isEnd;

                    const rangeBg = isBetween
                        ? '#DBEAFE'
                        : isStart && end && !isSingleSelected
                            ? 'linear-gradient(90deg, transparent 0%, transparent 50%, #DBEAFE 50%, #DBEAFE 100%)'
                            : isEnd && start && !isSingleSelected
                                ? 'linear-gradient(90deg, #DBEAFE 0%, #DBEAFE 50%, transparent 50%, transparent 100%)'
                                : 'transparent';

                    return (
                        <div
                            key={day.format('YYYY-MM-DD')}
                            style={{
                                background: rangeBg,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minHeight: cellSize,
                            }}
                        >
                            <button
                                type="button"
                                aria-label={day.format('YYYY-MM-DD')}
                                onClick={() => onSelect(day)}
                                style={{
                                    width: cellSize - 4,
                                    height: cellSize - 4,
                                    borderRadius: isSelected ? '50%' : 12,
                                    border: 'none',
                                    background: isSelected
                                        ? 'linear-gradient(135deg, #0D9488 0%, #2563EB 100%)'
                                        : isToday
                                            ? '#F0F9FF'
                                            : 'transparent',
                                    color: isSelected
                                        ? '#FFFFFF'
                                        : !sameMonth
                                            ? '#CBD5E1'
                                            : isToday
                                                ? '#0369A1'
                                                : '#1E293B',
                                    cursor: 'pointer',
                                    fontSize: isMobile ? 15 : 14,
                                    fontWeight: isSelected ? 700 : isToday ? 700 : 500,
                                    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: isSelected
                                        ? '0 4px 14px rgba(13, 148, 136, 0.35)'
                                        : 'none',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 2,
                                    position: 'relative',
                                    transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                                }}
                            >
                                <span>{day.date()}</span>
                                {isToday && !isSelected ? (
                                    <span
                                        style={{
                                            width: 4,
                                            height: 4,
                                            borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #0D9488, #2563EB)',
                                            position: 'absolute',
                                            bottom: 5,
                                        }}
                                    />
                                ) : null}
                            </button>
                        </div>
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

    /* ─── Shared inner content ─── */
    const dialogContent = (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                background: '#FFFFFF',
            }}
        >
            {/* ── Header: Range summary ── */}
            <div
                style={{
                    padding: isMobile ? '20px 16px 16px' : '24px 28px 18px',
                    borderBottom: '1px solid #F1F5F9',
                    background: 'linear-gradient(135deg, #F0FDFA 0%, #EFF6FF 50%, #FDF4FF 100%)',
                    flexShrink: 0,
                }}
            >
                {isMobile ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <span style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>เลือกช่วงเวลา</span>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="close-date-range-dialog"
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                border: 'none',
                                background: 'rgba(15, 23, 42, 0.06)',
                                cursor: 'pointer',
                                display: 'grid',
                                placeItems: 'center',
                                color: '#64748B',
                                fontSize: 16,
                            }}
                        >
                            <CloseOutlined />
                        </button>
                    </div>
                ) : null}

                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                    }}
                >
                    <div
                        style={{
                            width: 4,
                            alignSelf: 'stretch',
                            borderRadius: 4,
                            background: 'linear-gradient(180deg, #0D9488 0%, #2563EB 100%)',
                            flexShrink: 0,
                        }}
                    />
                    <div style={{ display: 'grid', gap: 2, flex: 1, minWidth: 0 }}>
                        <Text
                            strong
                            style={{
                                fontSize: isMobile ? 17 : 20,
                                color: '#0F172A',
                                lineHeight: 1.3,
                            }}
                        >
                            {draftRange ? formatDateRangeLabel(draftRange) : 'ทั้งหมด'}
                        </Text>
                        <Text
                            style={{
                                fontSize: 13,
                                color: hasInvalidRange ? '#DC2626' : '#64748B',
                            }}
                        >
                            {!draftStart && !draftEnd
                                ? 'เลือกทั้งหมด หรือระบุวันและเวลาเอง'
                                : draftStart && !draftEnd
                                    ? '👆 แตะวันที่สิ้นสุดเพื่อสร้างช่วง'
                                    : hasInvalidRange
                                        ? '⚠️ เวลาเริ่มต้นต้องไม่มากกว่าเวลาสิ้นสุด'
                                        : draftRange
                                            ? `${countRangeDays(draftRange)} วัน · ${formatRangeTimeLabel(draftRange)}`
                                            : 'แตะวันเริ่มต้น แล้วแตะวันสิ้นสุด'}
                        </Text>
                    </div>
                </div>
            </div>

            {/* ── Scrollable body ── */}
            <div
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    padding: isMobile ? '12px 12px 0' : '20px 28px 0',
                    display: 'grid',
                    gap: isMobile ? 14 : 18,
                    alignContent: 'start',
                    WebkitOverflowScrolling: 'touch',
                }}
            >
                {/* Quick presets - horizontal scroll on mobile */}
                <div
                    style={{
                        display: 'flex',
                        gap: 8,
                        overflowX: isMobile ? 'auto' : 'visible',
                        flexWrap: isMobile ? 'nowrap' : 'wrap',
                        paddingBottom: 4,
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
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
                                    height: 40,
                                    borderRadius: 20,
                                    border: selected
                                        ? '1.5px solid #0D9488'
                                        : '1px solid #E2E8F0',
                                    background: selected
                                        ? 'linear-gradient(135deg, #F0FDFA 0%, #EFF6FF 100%)'
                                        : '#FFFFFF',
                                    color: selected ? '#0D9488' : '#475569',
                                    fontWeight: selected ? 700 : 600,
                                    fontSize: 13,
                                    cursor: 'pointer',
                                    padding: '0 18px',
                                    whiteSpace: 'nowrap',
                                    flexShrink: 0,
                                    transition: 'all 0.15s ease',
                                    boxShadow: selected
                                        ? '0 2px 8px rgba(13, 148, 136, 0.15)'
                                        : '0 1px 2px rgba(15, 23, 42, 0.04)',
                                }}
                            >
                                {option.label}
                            </button>
                        );
                    })}
                </div>

                {/* Date/time input cards */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                        gap: isMobile ? 8 : 12,
                    }}
                >
                    {([
                        { key: 'start' as const, label: 'เริ่มต้น', dateValue: draftDates[0], timeValue: draftTimes.start, accent: '#0D9488' },
                        { key: 'end' as const, label: 'สิ้นสุด', dateValue: draftDates[1], timeValue: draftTimes.end, accent: '#2563EB' },
                    ]).map((item) => (
                        <div
                            key={item.key}
                            style={{
                                display: 'grid',
                                gap: 8,
                                padding: isMobile ? 10 : 14,
                                borderRadius: 16,
                                border: `1px solid ${item.accent}22`,
                                background: `${item.accent}06`,
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div
                                    style={{
                                        width: 6,
                                        height: 6,
                                        borderRadius: '50%',
                                        background: item.accent,
                                        flexShrink: 0,
                                    }}
                                />
                                <Text style={{ fontSize: 11, fontWeight: 600, color: item.accent, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {item.label}
                                </Text>
                            </div>
                            <input
                                type="date"
                                value={item.dateValue ? item.dateValue.format('YYYY-MM-DD') : ''}
                                onChange={(event) => handleManualDateInput(item.key, event.target.value)}
                                style={{
                                    width: '100%',
                                    border: 'none',
                                    outline: 'none',
                                    fontSize: isMobile ? 14 : 15,
                                    fontWeight: 700,
                                    color: '#0F172A',
                                    background: 'transparent',
                                    padding: 0,
                                }}
                            />
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '6px 10px',
                                    borderRadius: 10,
                                    background: '#FFFFFF',
                                    border: '1px solid #E2E8F0',
                                }}
                            >
                                <CalendarOutlined style={{ fontSize: 13, color: '#94A3B8' }} />
                                <input
                                    type="time"
                                    step={60}
                                    value={item.timeValue}
                                    onChange={(event) => handleTimeInput(item.key, event.target.value)}
                                    style={{
                                        width: '100%',
                                        border: 'none',
                                        outline: 'none',
                                        fontSize: isMobile ? 15 : 16,
                                        fontWeight: 700,
                                        color: '#0F172A',
                                        background: 'transparent',
                                        padding: 0,
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Month navigation + calendar */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: showDualMonth
                            ? 'repeat(2, minmax(0, 1fr))'
                            : '1fr',
                        gap: isMobile ? 0 : 24,
                    }}
                >
                    {/* First month */}
                    <div>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: 12,
                                padding: '0 4px',
                            }}
                        >
                            <button
                                type="button"
                                aria-label="previous-month"
                                onClick={() => setVisibleMonth((current) => current.subtract(1, 'month'))}
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: '50%',
                                    border: '1px solid #E2E8F0',
                                    background: '#FFFFFF',
                                    cursor: 'pointer',
                                    display: 'grid',
                                    placeItems: 'center',
                                    color: '#475569',
                                    fontSize: 14,
                                    transition: 'all 0.15s ease',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                                }}
                            >
                                <LeftOutlined />
                            </button>
                            <Text strong style={{ fontSize: 16, color: '#0F172A' }}>
                                {visibleMonth.format('MMMM YYYY')}
                            </Text>
                            {showDualMonth ? (
                                <div style={{ width: 36 }} />
                            ) : (
                                <button
                                    type="button"
                                    aria-label="next-month"
                                    onClick={() => setVisibleMonth((current) => current.add(1, 'month'))}
                                    style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: '50%',
                                        border: '1px solid #E2E8F0',
                                        background: '#FFFFFF',
                                        cursor: 'pointer',
                                        display: 'grid',
                                        placeItems: 'center',
                                        color: '#475569',
                                        fontSize: 14,
                                        transition: 'all 0.15s ease',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                                    }}
                                >
                                    <RightOutlined />
                                </button>
                            )}
                        </div>
                        <ShiftHistoryCalendarMonth
                            month={visibleMonth}
                            draftRange={draftDates}
                            onSelect={handleSelectDay}
                            isMobile={isMobile}
                        />
                    </div>

                    {/* Second month (desktop only) */}
                    {showDualMonth ? (
                        <div>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: 12,
                                    padding: '0 4px',
                                }}
                            >
                                <div style={{ width: 36 }} />
                                <Text strong style={{ fontSize: 16, color: '#0F172A' }}>
                                    {visibleMonth.add(1, 'month').format('MMMM YYYY')}
                                </Text>
                                <button
                                    type="button"
                                    aria-label="next-month"
                                    onClick={() => setVisibleMonth((current) => current.add(1, 'month'))}
                                    style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: '50%',
                                        border: '1px solid #E2E8F0',
                                        background: '#FFFFFF',
                                        cursor: 'pointer',
                                        display: 'grid',
                                        placeItems: 'center',
                                        color: '#475569',
                                        fontSize: 14,
                                        transition: 'all 0.15s ease',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                                    }}
                                >
                                    <RightOutlined />
                                </button>
                            </div>
                            <ShiftHistoryCalendarMonth
                                month={visibleMonth.add(1, 'month')}
                                draftRange={draftDates}
                                onSelect={handleSelectDay}
                                isMobile={isMobile}
                            />
                        </div>
                    ) : null}
                </div>

                {/* Spacer for sticky footer */}
                <div style={{ height: isMobile ? 80 : 20 }} />
            </div>

            {/* ── Sticky footer ── */}
            <div
                style={{
                    padding: isMobile ? '12px 16px' : '16px 28px',
                    borderTop: '1px solid #F1F5F9',
                    background: '#FFFFFF',
                    display: 'flex',
                    gap: 10,
                    justifyContent: 'flex-end',
                    flexShrink: 0,
                    boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.04)',
                }}
            >
                {!isMobile ? (
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            height: 44,
                            borderRadius: 12,
                            border: '1px solid #E2E8F0',
                            background: '#FFFFFF',
                            color: '#64748B',
                            fontWeight: 600,
                            fontSize: 14,
                            cursor: 'pointer',
                            padding: '0 24px',
                            transition: 'all 0.15s ease',
                        }}
                    >
                        ยกเลิก
                    </button>
                ) : null}
                <button
                    type="button"
                    disabled={!canApplyDraft}
                    onClick={() => {
                        if (!draftRange) return;
                        onApply(draftRange, 'custom');
                    }}
                    style={{
                        height: isMobile ? 50 : 44,
                        borderRadius: isMobile ? 14 : 12,
                        border: 'none',
                        background: canApplyDraft
                            ? 'linear-gradient(135deg, #0D9488 0%, #2563EB 100%)'
                            : '#E2E8F0',
                        color: canApplyDraft ? '#FFFFFF' : '#94A3B8',
                        fontWeight: 700,
                        fontSize: isMobile ? 16 : 14,
                        cursor: canApplyDraft ? 'pointer' : 'not-allowed',
                        padding: '0 28px',
                        flex: isMobile ? 1 : 'none',
                        transition: 'all 0.2s ease',
                        boxShadow: canApplyDraft
                            ? '0 8px 24px rgba(13, 148, 136, 0.25)'
                            : 'none',
                    }}
                >
                    ใช้ช่วงเวลานี้
                </button>
            </div>
        </div>
    );

    /* ─── Mobile: Full-screen Drawer ─── */
    if (isMobile) {
        return (
            <Drawer
                open={open}
                onClose={onClose}
                placement="bottom"
                height="100dvh"
                closable={false}
                headerStyle={{ display: 'none' }}
                bodyStyle={{ padding: 0 }}
                styles={{ body: { padding: 0 } }}
                zIndex={1600}
                destroyOnClose
            >
                {dialogContent}
            </Drawer>
        );
    }

    /* ─── Desktop/Tablet: Modal ─── */
    return (
        <Modal
            open={open}
            onCancel={onClose}
            title={null}
            closable={false}
            width={showDualMonth ? 920 : 520}
            style={{ top: 32 }}
            zIndex={1600}
            footer={null}
            bodyStyle={{ padding: 0 }}
            styles={{ body: { padding: 0 } }}
            destroyOnClose
        >
            {dialogContent}
        </Modal>
    );
}

const ShiftHistoryCard = React.memo(({
    shift,
    canViewFinancials,
    canViewSummary,
    onViewSummary
}: {
    shift: ShiftHistoryItem;
    canViewFinancials: boolean;
    canViewSummary: boolean;
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

                    {canViewFinancials ? (
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
                    ) : (
                        <Alert
                            type="info"
                            showIcon
                            message="ข้อมูลยอดเงินถูกจำกัดตาม policy"
                            description="role นี้ดูไทม์ไลน์กะได้ แต่ไม่เห็นจำนวนเงินเริ่มต้น ยอดคาดหวัง ยอดนับจริง และผลต่าง"
                            style={{ marginTop: 14, borderRadius: 16 }}
                        />
                    )}
                </div>

                {canViewSummary ? (
                    <Button className="shift-view-btn" onClick={() => onViewSummary(shift.id)}>
                        ดูสรุป
                    </Button>
                ) : null}
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
    const { user } = useAuth();
    const { isAuthorized, isChecking } = useRoleGuard();
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });
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
    const canSearchShiftHistory = can('shift_history.search.feature', 'view');
    const canFilterShiftHistory = can('shift_history.filter.feature', 'view');
    const canViewShiftStats = can('shift_history.stats.feature', 'view');
    const canViewShiftSummary = can('shift_history.summary.feature', 'access');
    const canViewShiftFinancials = can('shift_history.financials.feature', 'view');
    const canViewCurrentShiftPage = can('shifts.page', 'view');
    const handleViewSummary = useCallback((id: string) => {
        if (!canViewShiftSummary) return;
        setSelectedShiftId(id);
    }, [canViewShiftSummary]);

    const activeDatePreset = useMemo(() => getMatchingPreset(dateRange), [dateRange]);
    const dateLabel = useMemo(() => formatDateRangeLabel(dateRange), [dateRange]);
    const dateMetaLabel = useMemo(() => {
        if (!dateRange) return 'ทุกช่วงเวลา';
        return `${countRangeDays(dateRange)} วัน • ${formatRangeTimeLabel(dateRange)}`;
    }, [dateRange]);
    const showDualMonthCalendar = Boolean(screens.xl);

    const effectiveSearchQuery = canSearchShiftHistory ? debouncedSearch.trim() : '';
    const effectiveStatusFilter = canFilterShiftHistory ? statusFilter : 'all';
    const effectiveCreatedSort = canFilterShiftHistory ? createdSort : undefined;
    const effectiveDateFrom = canFilterShiftHistory ? dateFrom : undefined;
    const effectiveDateTo = canFilterShiftHistory ? dateTo : undefined;

    const historyQuery = useQuery<ShiftHistoryResponse>({
        queryKey: ['shiftHistory', page, pageSize, effectiveSearchQuery, effectiveStatusFilter, effectiveCreatedSort, effectiveDateFrom, effectiveDateTo],
        queryFn: async () => {
            return shiftsService.getHistory({
                page,
                limit: pageSize,
                q: effectiveSearchQuery || undefined,
                status: effectiveStatusFilter === 'all' ? undefined : effectiveStatusFilter,
                sort_created: effectiveCreatedSort,
                date_from: effectiveDateFrom,
                date_to: effectiveDateTo
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
        enabled: canViewShiftSummary && Boolean(selectedShiftId),
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

    if (permissionLoading) {
        return <AccessGuardFallback message="กำลังโหลด capability ของหน้านี้..." />;
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
                        <Button icon={<ClockCircleOutlined />} onClick={() => router.push('/pos/shift')} disabled={!canViewCurrentShiftPage}>
                            ไปหน้ากะปัจจุบัน
                        </Button>
                    </Space>
                }
            />

            <PageContainer>
                <PageStack>






                    {canViewShiftStats ? (
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
                    ) : (
                        <Alert
                            type="info"
                            showIcon
                            message="Branch shift stats are hidden for this role"
                            description="ยังดูรายการประวัติกะได้ แต่ KPI และยอดรวมของสาขาจะไม่ถูกแสดง"
                        />
                    )}

                    <SearchBar>
                        <SearchInput
                            placeholder="ค้นหา"
                            value={searchText}
                            disabled={!canSearchShiftHistory}
                            onChange={(val) => {
                                if (!canSearchShiftHistory) return;
                                setSearchText(val);
                            }}
                        />
                        <div
                            style={{
                                display: 'grid',
                                gap: 10,
                                gridTemplateColumns: isMobile
                                    ? 'minmax(0, 1fr)'
                                    : 'minmax(150px, auto) minmax(120px, auto) minmax(0, 1fr)',
                                alignItems: 'start',
                            }}
                        >
                            <ModalSelector<StatusFilter>
                                title="เลือกสถานะ"
                                options={[
                                    { label: `ทั้งหมด (${totalCount})`, value: 'all' },
                                    { label: `OPEN (${openCount})`, value: ShiftStatus.OPEN },
                                    { label: `CLOSED (${closedCount})`, value: ShiftStatus.CLOSED },
                                ]}
                                value={statusFilter}
                                onChange={(value) => {
                                    if (!canFilterShiftHistory) return;
                                    updateFilter('status', value);
                                }}
                                disabled={!canFilterShiftHistory}
                                style={{ minWidth: isMobile ? 0 : 150, width: '100%' }}
                            />
                            <ModalSelector<CreatedSort>
                                title="เรียงลำดับ"
                                options={[
                                    { label: 'เรียงจากเก่าก่อน', value: 'old' },
                                    { label: 'เรียงจากใหม่ก่อน', value: 'new' },
                                ]}
                                value={createdSort}
                                onChange={(value) => {
                                    if (!canFilterShiftHistory) return;
                                    setCreatedSort(value);
                                }}
                                disabled={!canFilterShiftHistory}
                                style={{ minWidth: isMobile ? 0 : 120, width: '100%' }}
                            />
                            <div style={{ minWidth: 0, width: '100%' }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!canFilterShiftHistory) return;
                                        setIsDateModalVisible(true);
                                    }}
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
                                        cursor: canFilterShiftHistory ? 'pointer' : 'not-allowed',
                                        minHeight: isMobile ? 86 : 72,
                                        transition: 'all 0.2s ease',
                                        padding: isMobile ? '14px 16px' : '14px 18px',
                                        textAlign: 'left',
                                        boxShadow: dateRange ? '0 14px 28px rgba(79, 70, 229, 0.08)' : 'none',
                                        opacity: canFilterShiftHistory ? 1 : 0.6,
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
                                            {canFilterShiftHistory ? dateLabel : 'ต้องมีสิทธิ์ filter'}
                                        </span>
                                        <span style={{ color: '#64748B', fontSize: 12 }}>
                                            {canFilterShiftHistory ? dateMetaLabel : 'วันที่และการเรียงลำดับถูกล็อกตาม policy'}
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
                        </div>
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
                                        canViewFinancials={canViewShiftFinancials}
                                        canViewSummary={canViewShiftSummary}
                                        onViewSummary={handleViewSummary}
                                    />
                                ))}

                                <div className="pos-pagination-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 16, position: 'relative', width: '100%', borderTop: '1px solid #E2E8F0', paddingTop: 16 }}>
                                    <div className="pos-pagination-total" style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)' }}>
                                        <Text type="secondary" style={{ fontSize: 13, color: '#64748B' }}>
                                            ทั้งหมด {total} รายการ
                                        </Text>
                                    </div>
                                    <Pagination
                                        current={page}
                                        total={total}
                                        pageSize={pageSize}
                                        onChange={(nextPage) => setPage(nextPage)}
                                        showSizeChanger={false}
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
                open={canViewShiftSummary && Boolean(selectedShiftId)}
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
                    if (!canFilterShiftHistory) return;
                    setDateRange(range);
                    setIsDateModalVisible(false);
                }}
            />
        </div>
    );
}
