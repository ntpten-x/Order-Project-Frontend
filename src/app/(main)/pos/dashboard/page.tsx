"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Drawer,
  Empty,
  Grid,
  List,
  Modal,
  Progress,
  Radio,
  Row,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from "antd";
import {
  CalendarOutlined,
  CarOutlined,
  CloseOutlined,
  DownloadOutlined,
  EyeOutlined,
  FileExcelOutlined,
  HomeOutlined,
  LeftOutlined,
  PrinterOutlined,
  ReloadOutlined,
  RightOutlined,
  RiseOutlined,
  ShopOutlined,
  ShoppingOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/th";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useRouter } from "next/navigation";
import {
  exportSalesReportExcel,
  exportSalesReportPDF,
  type SalesReportBranding,
} from "../../../../utils/export.utils";
import { dashboardService } from "../../../../services/pos/dashboard.service";
import {
  shopProfileService,
  type ShopProfile,
} from "../../../../services/pos/shopProfile.service";
import {
  DashboardOverview,
  RecentOrderSummary,
  TopItem,
} from "../../../../types/api/pos/dashboard";
import { useGlobalLoading } from "../../../../contexts/pos/GlobalLoadingContext";
import { useSocket } from "../../../../hooks/useSocket";
import { useRealtimeRefresh } from "../../../../utils/pos/realtime";
import { RealtimeEvents } from "../../../../utils/realtimeEvents";
import { useAuth } from "../../../../contexts/AuthContext";
import { useEffectivePermissions } from "../../../../hooks/useEffectivePermissions";
import UIPageHeader from "../../../../components/ui/page/PageHeader";
import PageContainer from "../../../../components/ui/page/PageContainer";
import PageSection from "../../../../components/ui/page/PageSection";
import PageStack from "../../../../components/ui/page/PageStack";
import { AccessGuardFallback } from "../../../../components/pos/AccessGuard";
import { t } from "../../../../utils/i18n";
import { resolveImageSource } from "../../../../utils/image/source";
import SmartAvatar from "../../../../components/ui/image/SmartAvatar";
import {
  closePrintWindow,
  getPrintSettings,
  primePrintResources,
  reservePrintWindow,
} from "../../../../utils/print-settings/runtime";
import { applyPresetToDocument } from "../../../../utils/print-settings/defaults";
import { readCache, writeCache } from "../../../../utils/pos/cache";
import { PrintPreset } from "../../../../types/api/pos/printSettings";


const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("th");

const DASHBOARD_TIMEZONE = "Asia/Bangkok";

type PresetKey = "today" | "yesterday" | "7d" | "15d" | "30d" | "custom";
type ExportFormat = "a4" | "receipt" | "xlsx";

const PRESET_OPTIONS: Array<{ label: string; value: PresetKey }> = [
  { label: "วันนี้", value: "today" },
  { label: "เมื่อวาน", value: "yesterday" },
  { label: "7 วันล่าสุด", value: "7d" },
  { label: "15 วันล่าสุด", value: "15d" },
  { label: "30 วันล่าสุด", value: "30d" },
  { label: "กำหนดเอง", value: "custom" },
];

const STATUS_META: Record<string, { label: string; color: string }> = {
  Paid: { label: "ชำระแล้ว", color: "green" },
  Completed: { label: "เสร็จสิ้น", color: "green" },
  Cancelled: { label: "ยกเลิก", color: "red" },
  Pending: { label: "รอดำเนินการ", color: "gold" },
  Cooking: { label: "รอดำเนินการ", color: "gold" },
  Served: { label: "รอดำเนินการ", color: "gold" },
  WaitingForPayment: { label: "รอชำระ", color: "orange" },
};

const CALENDAR_WEEKDAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

type DraftDateRange = [dayjs.Dayjs | null, dayjs.Dayjs | null];

function thaiNow(): dayjs.Dayjs {
  return dayjs().tz(DASHBOARD_TIMEZONE);
}

function toThaiTime(value: string | dayjs.Dayjs): dayjs.Dayjs {
  return dayjs(value).tz(DASHBOARD_TIMEZONE);
}

function parseThaiDateInput(rawValue: string): dayjs.Dayjs {
  return dayjs.tz(`${rawValue}T00:00:00`, DASHBOARD_TIMEZONE);
}

function buildMonthDays(month: dayjs.Dayjs): dayjs.Dayjs[] {
  const start = month.startOf("month").startOf("week");
  return Array.from({ length: 42 }, (_, index) => start.add(index, "day"));
}

function isAllDayRange(range: [dayjs.Dayjs, dayjs.Dayjs]): boolean {
  return (
    range[0].format("HH:mm") === "00:00" &&
    range[1].format("HH:mm") === "23:59"
  );
}

function formatDateRangeLabel(range: [dayjs.Dayjs, dayjs.Dayjs]): string {
  const showTime = !isAllDayRange(range);
  if (range[0].isSame(range[1], "day")) {
    return showTime
      ? `${range[0].format("DD MMM YYYY HH:mm")} - ${range[1].format("HH:mm")}`
      : range[0].format("DD MMM YYYY");
  }
  return showTime
    ? `${range[0].format("DD MMM YYYY HH:mm")} - ${range[1].format("DD MMM YYYY HH:mm")}`
    : `${range[0].format("DD MMM YYYY")} - ${range[1].format("DD MMM YYYY")}`;
}

function countRangeDays(range: [dayjs.Dayjs, dayjs.Dayjs]): number {
  return range[1].startOf("day").diff(range[0].startOf("day"), "day") + 1;
}

function formatRangeTimeLabel(range: [dayjs.Dayjs, dayjs.Dayjs]): string {
  if (isAllDayRange(range)) {
    return "ทั้งวัน";
  }
  return `${range[0].format("HH:mm")} - ${range[1].format("HH:mm")}`;
}

function mergeDateAndTime(
  date: dayjs.Dayjs,
  timeValue: string,
  field: "start" | "end",
): dayjs.Dayjs {
  const [hours, minutes] = timeValue.split(":").map((value) => Number(value));
  return date
    .hour(Number.isFinite(hours) ? hours : field === "start" ? 0 : 23)
    .minute(Number.isFinite(minutes) ? minutes : field === "start" ? 0 : 59)
    .second(field === "start" ? 0 : 59)
    .millisecond(field === "start" ? 0 : 999);
}

function DashboardRangeCalendarMonth({
  month,
  draftRange,
  onSelect,
  isMobile,
}: {
  month: dayjs.Dayjs;
  draftRange: DraftDateRange;
  onSelect: (value: dayjs.Dayjs) => void;
  isMobile?: boolean;
}) {
  const days = useMemo(() => buildMonthDays(month), [month]);
  const [start, end] = draftRange;
  const cellSize = isMobile ? 46 : 44;

  return (
    <div style={{ padding: isMobile ? "0 2px" : 0 }}>
      {/* Weekday headers */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
          gap: 2,
          marginBottom: 8,
          paddingBottom: 8,
          borderBottom: "1px solid #F1F5F9",
        }}
      >
        {CALENDAR_WEEKDAYS.map((weekday, idx) => (
          <div
            key={`${month.format("YYYY-MM")}-${weekday}`}
            style={{
              textAlign: "center",
              fontSize: 11,
              fontWeight: 600,
              color: idx === 0 || idx === 6 ? "#94A3B8" : "#64748B",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {weekday}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
          gap: 2,
        }}
      >
        {days.map((day) => {
          const sameMonth = day.month() === month.month();
          const isToday = day.isSame(thaiNow(), "day");
          const isStart = start ? day.isSame(start, "day") : false;
          const isEnd = end ? day.isSame(end, "day") : false;
          const isBetween =
            start && end
              ? day.isAfter(start, "day") && day.isBefore(end, "day")
              : false;
          const isSelected = isStart || isEnd;
          const isSingleSelected = isStart && isEnd;

          /* Range background fill (the band between start and end) */
          const rangeBg = isBetween
            ? "#DBEAFE"
            : isStart && end && !isSingleSelected
              ? "linear-gradient(90deg, transparent 0%, transparent 50%, #DBEAFE 50%, #DBEAFE 100%)"
              : isEnd && start && !isSingleSelected
                ? "linear-gradient(90deg, #DBEAFE 0%, #DBEAFE 50%, transparent 50%, transparent 100%)"
                : "transparent";

          return (
            <div
              key={day.format("YYYY-MM-DD")}
              style={{
                background: rangeBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: cellSize,
              }}
            >
              <button
                type="button"
                aria-label={day.format("YYYY-MM-DD")}
                onClick={() => onSelect(day)}
                style={{
                  width: cellSize - 4,
                  height: cellSize - 4,
                  borderRadius: isSelected ? "50%" : 12,
                  border: "none",
                  background: isSelected
                    ? "linear-gradient(135deg, #0D9488 0%, #2563EB 100%)"
                    : isToday
                      ? "#F0F9FF"
                      : "transparent",
                  color: isSelected
                    ? "#FFFFFF"
                    : !sameMonth
                      ? "#CBD5E1"
                      : isToday
                        ? "#0369A1"
                        : "#1E293B",
                  cursor: "pointer",
                  fontSize: isMobile ? 15 : 14,
                  fontWeight: isSelected ? 700 : isToday ? 700 : 500,
                  transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: isSelected
                    ? "0 4px 14px rgba(13, 148, 136, 0.35)"
                    : "none",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 2,
                  position: "relative",
                  transform: isSelected ? "scale(1.08)" : "scale(1)",
                }}
              >
                <span>{day.date()}</span>
                {/* Today dot indicator */}
                {isToday && !isSelected ? (
                  <span
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #0D9488, #2563EB)",
                      position: "absolute",
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

function DashboardDateRangeDialog({
  open,
  initialRange,
  activePreset,
  isMobile,
  showDualMonth,
  onClose,
  onApply,
}: {
  open: boolean;
  initialRange: [dayjs.Dayjs, dayjs.Dayjs];
  activePreset: PresetKey;
  isMobile: boolean;
  showDualMonth: boolean;
  onClose: () => void;
  onApply: (range: [dayjs.Dayjs, dayjs.Dayjs], preset: PresetKey) => void;
}) {
  const quickPresets = useMemo(
    () => PRESET_OPTIONS.filter((option) => option.value !== "custom"),
    [],
  );
  const [draftDates, setDraftDates] = useState<DraftDateRange>([
    initialRange[0].startOf("day"),
    initialRange[1].startOf("day"),
  ]);
  const [draftTimes, setDraftTimes] = useState({
    start: initialRange[0].format("HH:mm"),
    end: initialRange[1].format("HH:mm"),
  });
  const [visibleMonth, setVisibleMonth] = useState(
    initialRange[0].startOf("month"),
  );

  useEffect(() => {
    if (!open) return;
    setDraftDates([initialRange[0].startOf("day"), initialRange[1].startOf("day")]);
    setDraftTimes({
      start: initialRange[0].format("HH:mm"),
      end: initialRange[1].format("HH:mm"),
    });
    setVisibleMonth(initialRange[0].startOf("month"));
  }, [initialRange, open]);

  const handleSelectDay = useCallback((value: dayjs.Dayjs) => {
    const selectedDay = value.startOf("day");
    setDraftDates((current) => {
      const [start, end] = current;
      if (!start || end) {
        return [selectedDay, null];
      }
      if (selectedDay.isBefore(start, "day")) {
        return [selectedDay, start];
      }
      return [start, selectedDay];
    });
  }, []);

  const handleManualDateInput = useCallback(
    (field: "start" | "end", rawValue: string) => {
      if (!rawValue) return;
      const parsed = parseThaiDateInput(rawValue);
      if (!parsed.isValid()) return;

      if (field === "start") {
        setVisibleMonth(parsed.startOf("month"));
        setDraftDates((current) => {
          const nextStart = parsed.startOf("day");
          const currentEnd = current[1];
          if (!currentEnd) {
            return [nextStart, nextStart];
          }
          if (nextStart.isAfter(currentEnd, "day")) {
            return [nextStart, nextStart];
          }
          return [nextStart, currentEnd];
        });
        return;
      }

      setDraftDates((current) => {
        const nextEnd = parsed.startOf("day");
        const currentStart = current[0];
        if (!currentStart) {
          setVisibleMonth(parsed.startOf("month"));
          return [nextEnd, nextEnd];
        }
        if (nextEnd.isBefore(currentStart, "day")) {
          return [nextEnd, nextEnd];
        }
        return [currentStart, nextEnd];
      });
    },
    [],
  );

  const handleTimeInput = useCallback(
    (field: "start" | "end", value: string) => {
      setDraftTimes((current) => ({
        ...current,
        [field]: value || (field === "start" ? "00:00" : "23:59"),
      }));
    },
    [],
  );

  const draftStart =
    draftDates[0] ? mergeDateAndTime(draftDates[0], draftTimes.start, "start") : null;
  const draftEnd =
    draftDates[1] ? mergeDateAndTime(draftDates[1], draftTimes.end, "end") : null;
  const hasInvalidRange = Boolean(
    draftStart && draftEnd && draftStart.isAfter(draftEnd),
  );
  const canApplyDraft = Boolean(draftStart && draftEnd && !hasInvalidRange);

  /* ─── Shared inner content ─── */
  const dialogContent = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "#FFFFFF",
      }}
    >
      {/* ── Header: Range summary ── */}
      <div
        style={{
          padding: isMobile ? "20px 16px 16px" : "24px 28px 18px",
          borderBottom: "1px solid #F1F5F9",
          background: "linear-gradient(135deg, #F0FDFA 0%, #EFF6FF 50%, #FDF4FF 100%)",
          flexShrink: 0,
        }}
      >
        {/* Close button for mobile */}
        {isMobile ? (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: "#0F172A" }}>เลือกช่วงวันที่</span>
            <button
              type="button"
              onClick={onClose}
              aria-label="close-date-range-dialog"
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: "none",
                background: "rgba(15, 23, 42, 0.06)",
                cursor: "pointer",
                display: "grid",
                placeItems: "center",
                color: "#64748B",
                fontSize: 16,
              }}
            >
              <CloseOutlined />
            </button>
          </div>
        ) : null}

        {/* Selected range display */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 4,
              alignSelf: "stretch",
              borderRadius: 4,
              background: "linear-gradient(180deg, #0D9488 0%, #2563EB 100%)",
              flexShrink: 0,
            }}
          />
          <div style={{ display: "grid", gap: 2, flex: 1, minWidth: 0 }}>
            <Text
              strong
              style={{
                fontSize: isMobile ? 17 : 20,
                color: "#0F172A",
                lineHeight: 1.3,
              }}
            >
              {draftStart && draftEnd
                ? formatDateRangeLabel([draftStart, draftEnd])
                : "เลือกวันเริ่มต้นและวันสิ้นสุด"}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: hasInvalidRange ? "#DC2626" : "#64748B",
              }}
            >
              {draftStart && !draftEnd
                ? "👆 แตะวันที่สิ้นสุดเพื่อสร้างช่วง"
                : hasInvalidRange
                  ? "⚠️ เวลาเริ่มต้นต้องไม่มากกว่าเวลาสิ้นสุด"
                  : draftStart && draftEnd
                    ? `${countRangeDays([draftStart, draftEnd])} วัน · ${formatRangeTimeLabel([draftStart, draftEnd])}`
                    : "แตะวันที่เริ่มต้น แล้วแตะวันที่สิ้นสุด"}
            </Text>
          </div>
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          padding: isMobile ? "12px 12px 0" : "20px 28px 0",
          display: "grid",
          gap: isMobile ? 14 : 18,
          alignContent: "start",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* Quick presets - horizontal scroll on mobile */}
        <div
          style={{
            display: "flex",
            gap: 8,
            overflowX: isMobile ? "auto" : "visible",
            flexWrap: isMobile ? "nowrap" : "wrap",
            paddingBottom: 4,
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {quickPresets.map((option) => {
            const selected = activePreset === option.value;
            return (
              <button
                key={`dialog-preset-${option.value}`}
                type="button"
                aria-label={`dialog-preset-${option.value}`}
                onClick={() =>
                  onApply(resolvePresetRange(option.value), option.value)
                }
                style={{
                  height: 40,
                  borderRadius: 20,
                  border: selected
                    ? "1.5px solid #0D9488"
                    : "1px solid #E2E8F0",
                  background: selected
                    ? "linear-gradient(135deg, #F0FDFA 0%, #EFF6FF 100%)"
                    : "#FFFFFF",
                  color: selected ? "#0D9488" : "#475569",
                  fontWeight: selected ? 700 : 600,
                  fontSize: 13,
                  cursor: "pointer",
                  padding: "0 18px",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  transition: "all 0.15s ease",
                  boxShadow: selected
                    ? "0 2px 8px rgba(13, 148, 136, 0.15)"
                    : "0 1px 2px rgba(15, 23, 42, 0.04)",
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
            display: "grid",
            gridTemplateColumns: isMobile
              ? "repeat(2, minmax(0, 1fr))"
              : "repeat(2, minmax(0, 1fr))",
            gap: isMobile ? 8 : 12,
          }}
        >
          {([
            {
              key: "start" as const,
              label: "เริ่มต้น",
              dateValue: draftDates[0],
              timeValue: draftTimes.start,
              accent: "#0D9488",
            },
            {
              key: "end" as const,
              label: "สิ้นสุด",
              dateValue: draftDates[1],
              timeValue: draftTimes.end,
              accent: "#2563EB",
            },
          ]).map((item) => (
            <div
              key={item.key}
              style={{
                display: "grid",
                gap: 8,
                padding: isMobile ? 10 : 14,
                borderRadius: 16,
                border: `1px solid ${item.accent}22`,
                background: `${item.accent}06`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: item.accent,
                    flexShrink: 0,
                  }}
                />
                <Text style={{ fontSize: 11, fontWeight: 600, color: item.accent, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {item.label}
                </Text>
              </div>
              <input
                type="date"
                aria-label={
                  item.key === "start" ? "custom-range-start" : "custom-range-end"
                }
                value={item.dateValue ? item.dateValue.format("YYYY-MM-DD") : ""}
                onChange={(event) =>
                  handleManualDateInput(item.key, event.target.value)
                }
                style={{
                  width: "100%",
                  border: "none",
                  outline: "none",
                  fontSize: isMobile ? 14 : 15,
                  fontWeight: 700,
                  color: "#0F172A",
                  background: "transparent",
                  padding: 0,
                }}
              />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 10px",
                  borderRadius: 10,
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                }}
              >
                <CalendarOutlined style={{ fontSize: 13, color: "#94A3B8" }} />
                <input
                  type="time"
                  step={60}
                  aria-label={
                    item.key === "start"
                      ? "custom-range-start-time"
                      : "custom-range-end-time"
                  }
                  value={item.timeValue}
                  onChange={(event) =>
                    handleTimeInput(item.key, event.target.value)
                  }
                  style={{
                    width: "100%",
                    border: "none",
                    outline: "none",
                    fontSize: isMobile ? 15 : 16,
                    fontWeight: 700,
                    color: "#0F172A",
                    background: "transparent",
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
            display: "grid",
            gridTemplateColumns: showDualMonth
              ? "repeat(2, minmax(0, 1fr))"
              : "1fr",
            gap: isMobile ? 0 : 24,
          }}
        >
          {/* First month */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
                padding: "0 4px",
              }}
            >
              <button
                type="button"
                aria-label="previous-month"
                onClick={() =>
                  setVisibleMonth((current) => current.subtract(1, "month"))
                }
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  border: "1px solid #E2E8F0",
                  background: "#FFFFFF",
                  cursor: "pointer",
                  display: "grid",
                  placeItems: "center",
                  color: "#475569",
                  fontSize: 14,
                  transition: "all 0.15s ease",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                <LeftOutlined />
              </button>
              <Text strong style={{ fontSize: 16, color: "#0F172A" }}>
                {visibleMonth.format("MMMM YYYY")}
              </Text>
              {showDualMonth ? (
                <div style={{ width: 36 }} />
              ) : (
                <button
                  type="button"
                  aria-label="next-month"
                  onClick={() =>
                    setVisibleMonth((current) => current.add(1, "month"))
                  }
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    border: "1px solid #E2E8F0",
                    background: "#FFFFFF",
                    cursor: "pointer",
                    display: "grid",
                    placeItems: "center",
                    color: "#475569",
                    fontSize: 14,
                    transition: "all 0.15s ease",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  }}
                >
                  <RightOutlined />
                </button>
              )}
            </div>
            <DashboardRangeCalendarMonth
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
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                  padding: "0 4px",
                }}
              >
                <div style={{ width: 36 }} />
                <Text strong style={{ fontSize: 16, color: "#0F172A" }}>
                  {visibleMonth.add(1, "month").format("MMMM YYYY")}
                </Text>
                <button
                  type="button"
                  aria-label="next-month"
                  onClick={() =>
                    setVisibleMonth((current) => current.add(1, "month"))
                  }
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    border: "1px solid #E2E8F0",
                    background: "#FFFFFF",
                    cursor: "pointer",
                    display: "grid",
                    placeItems: "center",
                    color: "#475569",
                    fontSize: 14,
                    transition: "all 0.15s ease",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  }}
                >
                  <RightOutlined />
                </button>
              </div>
              <DashboardRangeCalendarMonth
                month={visibleMonth.add(1, "month")}
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
          padding: isMobile ? "12px 16px" : "16px 28px",
          borderTop: "1px solid #F1F5F9",
          background: "#FFFFFF",
          display: "flex",
          gap: 10,
          justifyContent: "flex-end",
          flexShrink: 0,
          boxShadow: "0 -4px 16px rgba(0, 0, 0, 0.04)",
        }}
      >
        {!isMobile ? (
          <button
            type="button"
            aria-label="cancel-custom-date-range"
            onClick={onClose}
            style={{
              height: 44,
              borderRadius: 12,
              border: "1px solid #E2E8F0",
              background: "#FFFFFF",
              color: "#64748B",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              padding: "0 24px",
              transition: "all 0.15s ease",
            }}
          >
            ยกเลิก
          </button>
        ) : null}
        <button
          type="button"
          aria-label="apply-custom-date-range"
          disabled={!canApplyDraft}
          onClick={() => {
            if (!draftStart || !draftEnd) return;
            onApply([draftStart, draftEnd], "custom");
          }}
          style={{
            height: isMobile ? 50 : 44,
            borderRadius: isMobile ? 14 : 12,
            border: "none",
            background: canApplyDraft
              ? "linear-gradient(135deg, #0D9488 0%, #2563EB 100%)"
              : "#E2E8F0",
            color: canApplyDraft ? "#FFFFFF" : "#94A3B8",
            fontWeight: 700,
            fontSize: isMobile ? 16 : 14,
            cursor: canApplyDraft ? "pointer" : "not-allowed",
            padding: "0 28px",
            flex: isMobile ? 1 : "none",
            transition: "all 0.2s ease",
            boxShadow: canApplyDraft
              ? "0 8px 24px rgba(13, 148, 136, 0.25)"
              : "none",
          }}
        >
          ใช้ช่วงวันที่นี้
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
        headerStyle={{ display: "none" }}
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

function resolvePresetRange(preset: PresetKey): [dayjs.Dayjs, dayjs.Dayjs] {
  const today = thaiNow();
  if (preset === "today") return [today.startOf("day"), today.endOf("day")];
  if (preset === "yesterday")
    return [
      today.subtract(1, "day").startOf("day"),
      today.subtract(1, "day").endOf("day"),
    ];
  if (preset === "7d")
    return [today.subtract(6, "day").startOf("day"), today.endOf("day")];
  if (preset === "15d")
    return [today.subtract(14, "day").startOf("day"), today.endOf("day")];
  if (preset === "30d")
    return [today.subtract(29, "day").startOf("day"), today.endOf("day")];
  return [today.startOf("day"), today.endOf("day")];
}

type ShopProfileExtended = ShopProfile & {
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
};

function formatCurrency(value: number): string {
  return `฿${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function formatThaiDate(date: string): string {
  return toThaiTime(date).format("DD MMM YYYY");
}

function formatThaiDateTime(date: string): string {
  return toThaiTime(date).format("DD MMM YYYY HH:mm");
}

function getOrderTypeTag(type: string) {
  if (type === "DineIn")
    return <Tag color="blue">{t("dashboard.channel.dineIn")}</Tag>;
  if (type === "TakeAway")
    return <Tag color="green">{t("dashboard.channel.takeAway")}</Tag>;
  if (type === "Delivery")
    return <Tag color="magenta">{t("dashboard.channel.delivery")}</Tag>;
  return <Tag>{type || "-"}</Tag>;
}

function TopItemsList({
  items,
  compact,
}: {
  items: TopItem[];
  compact: boolean;
}) {
  if (!items.length) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={t("dashboard.topProducts.empty")}
      />
    );
  }

  return (
    <List
      dataSource={items}
      split={false}
      renderItem={(item, index) => {
        const maxQty = Math.max(items[0]?.total_quantity || 0, 1);
        const percent = Math.min(
          (Number(item.total_quantity || 0) / maxQty) * 100,
          100,
        );
        return (
          <List.Item style={{ padding: compact ? "10px 0" : "12px 0" }}>
            <div
              style={{
                display: "flex",
                width: "100%",
                gap: 10,
                alignItems: "center",
              }}
            >
              <Tag
                color={index === 0 ? "gold" : "default"}
                style={{ margin: 0, minWidth: 28, textAlign: "center" }}
              >
                {index + 1}
              </Tag>
              <SmartAvatar
                shape="square"
                src={resolveImageSource(item.img_url)}
                alt={item.display_name || "product"}
                icon={<ShoppingOutlined />}
                imageStyle={{ objectFit: "cover" }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text
                  strong
                  ellipsis={{ tooltip: item.display_name }}
                  style={{ display: "block" }}
                >
                  {item.display_name}
                </Text>
                <Progress
                  percent={Number(percent.toFixed(0))}
                  size="small"
                  showInfo={false}
                />
              </div>
              <div style={{ textAlign: "right" }}>
                <Text strong>
                  {Number(item.total_quantity || 0).toLocaleString()}
                </Text>
                <Text
                  type="secondary"
                  style={{ display: "block", fontSize: 12 }}
                >
                  {formatCurrency(Number(item.total_revenue || 0))}
                </Text>
              </div>
            </div>
          </List.Item>
        );
      }}
    />
  );
}

function RecentOrdersList({
  orders,
  canOpenDetails,
  onOpenDetails,
}: {
  orders: RecentOrderSummary[];
  canOpenDetails: boolean;
  onOpenDetails: (orderId: string) => void;
}) {
  if (!orders.length) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={t("dashboard.recentOrders.empty")}
      />
    );
  }

  return (
    <List
      dataSource={orders}
      renderItem={(order) => {
        const status = STATUS_META[order.status] || {
          label: order.status,
          color: "default",
        };
        return (
          <List.Item
            style={{ cursor: canOpenDetails ? "pointer" : "default" }}
            onClick={() => {
              if (!canOpenDetails) return;
              onOpenDetails(order.id);
            }}
          >
            <div style={{ width: "100%", display: "grid", gap: 6 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Space size={6} wrap>
                  <Text strong>#{order.order_no?.substring(0, 10)}</Text>
                  {getOrderTypeTag(order.order_type)}
                  <Tag color={status.color}>{status.label}</Tag>
                </Space>
                <Text strong style={{ color: "#0f766e" }}>
                  {formatCurrency(order.total_amount)}
                </Text>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {formatThaiDateTime(order.update_date || order.create_date)}
                </Text>
                <Space size={8}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    x{order.items_count}
                  </Text>
                  <Button
                    type="link"
                    size="small"
                    icon={<EyeOutlined />}
                    style={{ paddingInline: 0 }}
                    disabled={!canOpenDetails}
                    onClick={(event) => {
                      event.stopPropagation();
                      if (!canOpenDetails) return;
                      onOpenDetails(order.id);
                    }}
                  >
                    {t("dashboard.viewDetails")}
                  </Button>
                </Space>
              </div>
            </div>
          </List.Item>
        );
      }}
    />
  );
}

export default function DashboardPage() {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const router = useRouter();
  const { showLoading, hideLoading } = useGlobalLoading();
  const { socket, isConnected } = useSocket();
  const { message: messageApi } = App.useApp();
  const { user, loading: authLoading } = useAuth();
  const { can, loading: permissionLoading } = useEffectivePermissions({
    enabled: Boolean(user?.id),
  });
  const canViewDashboard = can("reports.sales.page", "view");
  const canViewDashboardSummary = can("reports.sales.summary.feature", "view");
  const canUseDashboardFilters = can("reports.sales.filters.feature", "view");
  const canViewDashboardChannels = can("reports.sales.channels.feature", "view");
  const canViewDashboardTopItems = can("reports.sales.top_items.feature", "view");
  const canViewDashboardRecentOrders = can("reports.sales.recent_orders.feature", "view");
  const canOpenDashboardOrderDetail = can("reports.sales.order_detail.feature", "access");
  const canExportDashboard = can("reports.sales.export.feature", "update");
  const currentRoleName = String(user?.role ?? "").trim().toLowerCase();


  const [preset, setPreset] = useState<PresetKey>("today");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>(
    resolvePresetRange("today"),
  );
  const [rangeDialogOpen, setRangeDialogOpen] = useState(false);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [shopProfile, setShopProfile] = useState<ShopProfileExtended | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("a4");
  const [receiptPaperPreset, setReceiptPaperPreset] =
    useState<Extract<PrintPreset, "thermal_58mm" | "thermal_80mm">>("thermal_80mm");
  const [exporting, setExporting] = useState(false);

  const startDate = dateRange[0].format("YYYY-MM-DD");
  const endDate = dateRange[1].format("YYYY-MM-DD");
  const startAt = dateRange[0].toISOString();
  const endAt = dateRange[1].toISOString();
  const branchId = user?.branch_id || user?.branch?.id || "default";
  const overviewCacheKey = useMemo(
    () => `pos:dashboard:overview:${branchId}:${startAt}:${endAt}`,
    [branchId, endAt, startAt],
  );
  const shopProfileCacheKey = useMemo(
    () => `pos:dashboard:shop-profile:${branchId}`,
    [branchId],
  );

  useEffect(() => {
    if (preset === "custom") return;
    setDateRange(resolvePresetRange(preset));
  }, [preset]);

  useEffect(() => {
    if (canUseDashboardFilters) return;
    if (preset === "custom") {
      setPreset("today");
      setDateRange(resolvePresetRange("today"));
    }
    if (rangeDialogOpen) {
      setRangeDialogOpen(false);
    }
  }, [canUseDashboardFilters, preset, rangeDialogOpen]);

  const fetchOverview = useCallback(
    async (silent = false) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      try {
        const shouldUseAdvancedFilters =
          canUseDashboardFilters &&
          (preset === "custom" || !isAllDayRange(dateRange));
        const data = await dashboardService.getOverview(
          startDate,
          endDate,
          7,
          8,
          shouldUseAdvancedFilters ? { startAt, endAt } : undefined,
        );
        setOverview(data);
        writeCache(overviewCacheKey, data);
      } catch (error) {
        console.error("Failed to fetch dashboard overview", error);
        if (!silent) {
          messageApi.error("ไม่สามารถโหลดข้อมูลสรุปการขายได้");
        }
      } finally {
        if (silent) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [
      canUseDashboardFilters,
      dateRange,
      endAt,
      endDate,
      messageApi,
      overviewCacheKey,
      preset,
      startAt,
      startDate,
    ],
  );

  useEffect(() => {
    if (!canViewDashboard) return;
    const cachedOverview = readCache<DashboardOverview>(overviewCacheKey, 60_000);
    if (cachedOverview) {
      setOverview(cachedOverview);
      setLoading(false);
      void fetchOverview(true);
      return;
    }
    void fetchOverview(false);
  }, [canViewDashboard, fetchOverview, overviewCacheKey]);

  const fetchShopProfile = useCallback(async () => {
    try {
      const cachedProfile = readCache<ShopProfileExtended>(shopProfileCacheKey, 5 * 60_000);
      if (cachedProfile) {
        setShopProfile(cachedProfile);
      }
      const data = await shopProfileService.getProfile();
      setShopProfile(data as ShopProfileExtended);
      writeCache(shopProfileCacheKey, data);
    } catch (error) {
      console.warn("Failed to fetch shop profile for export branding", error);
    }
  }, [shopProfileCacheKey]);

  useEffect(() => {
    if (!canViewDashboard) return;
    void fetchShopProfile();
  }, [canViewDashboard, fetchShopProfile]);

  useEffect(() => {
    primePrintResources();
  }, []);

  useRealtimeRefresh({
    socket,
    events: [
      RealtimeEvents.orders.create,
      RealtimeEvents.orders.update,
      RealtimeEvents.orders.delete,
      RealtimeEvents.payments.create,
      RealtimeEvents.payments.update,
    ],
    onRefresh: () => fetchOverview(true),
    intervalMs: isConnected ? undefined : 20000,
    debounceMs: 900,
  });

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      let pdfPreviewWindow: Window | null = null;
      if (format === "a4" || format === "receipt") {
        pdfPreviewWindow = reservePrintWindow(
          format === "a4"
            ? "รายงานสรุปผลการขาย A4"
            : "รายงานสรุปผลการขายสำหรับเครื่องพิมพ์ใบเสร็จ",
        );
        if (!pdfPreviewWindow) {
          messageApi.error("เบราว์เซอร์บล็อกหน้าต่าง PDF กรุณาอนุญาตป๊อปอัป");
          return;
        }
      }

      try {
        setExporting(true);
        showLoading("กำลังเตรียมไฟล์สรุปผลการขาย...");
        const rangeStart = dateRange[0];
        const rangeEnd = dateRange[1];
        const exportStart = rangeStart.format("YYYY-MM-DD");
        const exportEnd = rangeEnd.format("YYYY-MM-DD");
        const shouldUseAdvancedFilters =
          canUseDashboardFilters &&
          (preset === "custom" || !isAllDayRange([rangeStart, rangeEnd]));
        const exportLabel =
          preset === "custom" || !isAllDayRange([rangeStart, rangeEnd])
            ? formatDateRangeLabel([rangeStart, rangeEnd])
            : PRESET_OPTIONS.find((option) => option.value === preset)?.label ||
              "ช่วงวันที่ที่เลือก";

        const exportOverview = await dashboardService.getOverview(
          exportStart,
          exportEnd,
          10,
          20,
          shouldUseAdvancedFilters
            ? {
                startAt: rangeStart.toISOString(),
                endAt: rangeEnd.toISOString(),
              }
            : undefined,
        );
        if (!exportOverview?.summary) {
          throw new Error("ไม่พบข้อมูลสรุปสำหรับการส่งออก");
        }

        const payload = {
          summary: exportOverview.summary,
          daily_sales: exportOverview.daily_sales,
          top_items: exportOverview.top_items,
          recent_orders: exportOverview.recent_orders,
        };
        const printSettings = await getPrintSettings();
        const branding: SalesReportBranding = {
          shopName: shopProfile?.shop_name || "ร้านค้า POS",
          branchName: user?.branch?.branch_name,
          logoUrl: shopProfile?.logo_url,
          primaryColor: shopProfile?.primary_color || "#0f766e",
          secondaryColor: shopProfile?.secondary_color || "#1d4ed8",
        };

        if (format === "a4" || format === "receipt") {
          const receiptDocumentSetting =
            format === "receipt"
              ? applyPresetToDocument(
                  printSettings.documents.receipt,
                  receiptPaperPreset,
                )
              : null;
          await exportSalesReportPDF(
            payload,
            [exportStart, exportEnd],
            exportLabel,
            branding,
            {
              targetWindow: pdfPreviewWindow,
              documentSetting:
                format === "a4"
                  ? printSettings.documents.order_summary
                  : receiptDocumentSetting,
            },
          );
        } else {
          await exportSalesReportExcel(
            payload,
            [exportStart, exportEnd],
            exportLabel,
            branding,
            { documentSetting: printSettings.documents.order_summary },
          );
        }

        messageApi.success(
          format === "xlsx"
            ? `ส่งออก XLSX สำเร็จ (${exportLabel})`
            : format === "a4"
              ? `เปิดหน้าพิมพ์ A4 สำเร็จ (${exportLabel})`
              : `เปิดหน้าพิมพ์แบบยาว ${receiptPaperPreset === "thermal_58mm" ? "58mm" : "80mm"} สำเร็จ (${exportLabel})`,
        );
        setExportDialogOpen(false);
      } catch (error) {
        closePrintWindow(pdfPreviewWindow);
        console.error("Export sales summary failed", error);
        messageApi.error("ส่งออกไฟล์สรุปผลการขายไม่สำเร็จ");
      } finally {
        setExporting(false);
        hideLoading();
      }
    },
    [
      showLoading,
      hideLoading,
      messageApi,
      shopProfile,
      user?.branch?.branch_name,
      dateRange,
      preset,
      receiptPaperPreset,
      canUseDashboardFilters,
    ],
  );

  const openExportDialog = useCallback(() => {
    if (!canExportDashboard) {
      messageApi.warning("This role cannot export or print dashboard reports");
      return;
    }
    if (!overview || loading) {
      messageApi.warning("กรุณารอโหลดข้อมูลสรุปให้เสร็จก่อน");
      return;
    }
    setExportDialogOpen(true);
  }, [canExportDashboard, overview, loading, messageApi]);

  const quickPresetOptions = useMemo(
    () => PRESET_OPTIONS.filter((option) => option.value !== "custom"),
    [],
  );
  const showDualMonthCalendar = Boolean(screens.xl);
  const selectedPresetLabel = useMemo(
    () =>
      PRESET_OPTIONS.find((option) => option.value === preset)?.label ||
      "Custom",
    [preset],
  );
  const selectedRangeLabel = useMemo(
    () => formatDateRangeLabel(dateRange),
    [dateRange],
  );
  const selectedRangeTimeLabel = useMemo(
    () => formatRangeTimeLabel(dateRange),
    [dateRange],
  );
  const selectedRangeDays = useMemo(
    () => countRangeDays(dateRange),
    [dateRange],
  );
  const applyDateRange = useCallback(
    (nextRange: [dayjs.Dayjs, dayjs.Dayjs], nextPreset: PresetKey) => {
      setPreset(nextPreset);
      setDateRange(nextRange);
      setRangeDialogOpen(false);
    },
    [],
  );

  const summary = overview?.summary;
  const dailyRows = useMemo(() => overview?.daily_sales ?? [], [overview]);
  const topItems = overview?.top_items || [];
  const recentOrders = overview?.recent_orders || [];

  const totalChannelSales = useMemo(() => {
    if (!summary) return 0;
    return (
      Number(summary.dine_in_sales || 0) +
      Number(summary.takeaway_sales || 0) +
      Number(summary.delivery_sales || 0)
    );
  }, [summary]);

  const channelCards = useMemo(() => {
    if (!summary) return [];
    return [
      {
        key: "dinein",
        label: t("dashboard.channel.dineIn"),
        icon: <ShopOutlined style={{ color: "#2563EB" }} />,
        value: Number(summary.dine_in_sales || 0),
        color: "#2563EB",
      },
      {
        key: "takeaway",
        label: t("dashboard.channel.takeAway"),
        icon: <HomeOutlined style={{ color: "#059669" }} />,
        value: Number(summary.takeaway_sales || 0),
        color: "#059669",
      },
      {
        key: "delivery",
        label: t("dashboard.channel.delivery"),
        icon: <CarOutlined style={{ color: "#DB2777" }} />,
        value: Number(summary.delivery_sales || 0),
        color: "#DB2777",
      },
    ];
  }, [summary]);

  const dailyTableData = useMemo(
    () =>
      dailyRows.map((row) => ({
        key: row.date,
        date: row.date,
        orders: Number(row.total_orders || 0),
        sales: Number(row.total_sales || 0),
        avg:
          Number(row.total_orders || 0) > 0
            ? Number(row.total_sales || 0) / Number(row.total_orders || 1)
            : 0,
      })),
    [dailyRows],
  );

  const handleOpenOrderDetail = useCallback(
    (orderId: string) => {
      if (!canOpenDashboardOrderDetail) {
        messageApi.warning("This role cannot open order detail from dashboard");
        return;
      }
      void router.push(`/pos/dashboard/${orderId}?from=dashboard`);
    },
    [canOpenDashboardOrderDetail, messageApi, router],
  );

  const hiddenSections = useMemo(() => {
    const sections: string[] = [];
    if (!canUseDashboardFilters) sections.push("custom date range");
    if (!canViewDashboardChannels) sections.push("channel mix");
    if (!canViewDashboardRecentOrders) sections.push("recent orders");
    if (!canOpenDashboardOrderDetail) sections.push("order detail");
    if (!canExportDashboard) sections.push("export and print");
    return sections;
  }, [
    canExportDashboard,
    canOpenDashboardOrderDetail,
    canUseDashboardFilters,
    canViewDashboardChannels,
    canViewDashboardRecentOrders,
  ]);

  if (authLoading || permissionLoading) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          background: "#F8FAFC",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!user || !canViewDashboard) {
    return (
      <AccessGuardFallback
        message="คุณไม่มีสิทธิ์เข้าถึงหน้าสรุปการขาย"
        tone="danger"
      />
    );
  }

  return (
    <div
      style={{ minHeight: "100dvh", background: "#F8FAFC", paddingBottom: 100 }}
    >
      <UIPageHeader
        title={t("dashboard.title")}
        subtitle={t("dashboard.subtitle")}
        icon={<RiseOutlined />}
        actions={
          <Space size={8} wrap>
            <Button
              icon={<ReloadOutlined />}
              loading={refreshing}
              onClick={() => void fetchOverview(true)}
            >
              {!isMobile ? t("dashboard.reload") : ""}
            </Button>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={openExportDialog}
              disabled={!overview || loading || !canExportDashboard}
            >
              {!isMobile ? "พิมพ์หรือดาวน์โหลดสรุปผลการขาย" : ""}
            </Button>
          </Space>
        }
      />

      <PageContainer maxWidth={1400}>
        <PageStack gap={12}>




          {hiddenSections.length > 0 ? (
            <Alert
              type="warning"
              showIcon
              message="Some dashboard sections are restricted by policy"
              description={`Hidden or locked for this role: ${hiddenSections.join(", ")}`}
            />
          ) : null}
          <PageSection title="ช่วงเวลา">
            <Row gutter={[12, 12]} align="middle">
              <Col xs={24}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: screens.lg
                      ? "repeat(5, minmax(0, 1fr))"
                      : screens.sm
                        ? "repeat(3, minmax(0, 1fr))"
                        : "repeat(2, minmax(0, 1fr))",
                    gap: 8,
                  }}
                >
                  {quickPresetOptions.map((option) => {
                    const selected = preset === option.value;
                    return (
                      <button
                        key={`quick-preset-${option.value}`}
                        type="button"
                        onClick={() => setPreset(option.value)}
                        style={{
                          minHeight: 54,
                          borderRadius: 16,
                          border: selected
                            ? "1px solid rgba(37,99,235,0.28)"
                            : "1px solid #E2E8F0",
                          background: selected
                            ? "linear-gradient(135deg, #EFF6FF 0%, #ECFDF5 100%)"
                            : "#FFFFFF",
                          color: selected ? "#0F172A" : "#475569",
                          cursor: "pointer",
                          padding: "12px 14px",
                          textAlign: "left",
                          boxShadow: selected
                            ? "0 10px 24px rgba(37,99,235,0.10)"
                            : "0 1px 2px rgba(15,23,42,0.03)",
                        }}
                      >
                        <div style={{ display: "grid", gap: 2 }}>
                          <span style={{ fontSize: 14, fontWeight: 700 }}>
                            {option.label}
                          </span>
                          <span
                            style={{
                              fontSize: 12,
                              color: selected ? "#2563EB" : "#94A3B8",
                            }}
                          >
                            {selected ? "ใช้งานอยู่" : "เลือกด่วน"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Col>
              <Col xs={24}>
                <button
                  type="button"
                  aria-label="open-custom-date-range"
                  onClick={() => {
                    if (!canUseDashboardFilters) return;
                    setRangeDialogOpen(true);
                  }}
                  style={{
                    width: "100%",
                    borderRadius: 22,
                    border:
                      preset === "custom"
                        ? "1px solid rgba(37,99,235,0.28)"
                        : "1px solid #E2E8F0",
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(239,246,255,0.92) 50%, rgba(236,253,245,0.92) 100%)",
                    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.06)",
                    padding: isMobile ? 16 : 18,
                    cursor: canUseDashboardFilters ? "pointer" : "not-allowed",
                    opacity: canUseDashboardFilters ? 1 : 0.72,
                  }}
                  disabled={!canUseDashboardFilters}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: isMobile ? "flex-start" : "center",
                      justifyContent: "space-between",
                      gap: 14,
                      flexDirection: isMobile ? "column" : "row",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 16,
                          display: "grid",
                          placeItems: "center",
                          background:
                            "linear-gradient(135deg, rgba(15,118,110,0.12) 0%, rgba(37,99,235,0.14) 100%)",
                          color: "#1D4ED8",
                          flexShrink: 0,
                        }}
                      >
                        <CalendarOutlined />
                      </div>
                      <div style={{ display: "grid", gap: 4, minWidth: 0 }}>
                        <Text strong style={{ fontSize: 16, color: "#0F172A" }}>
                          เลือกช่วงวันที่เอง
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {!canUseDashboardFilters
                            ? "Use standard presets only"
                            : preset === "custom"
                            ? "กำหนดเองแล้ว"
                            : `ตอนนี้ใช้: ${selectedPresetLabel}`}
                        </Text>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gap: 4,
                        textAlign: isMobile ? "left" : "right",
                        width: isMobile ? "100%" : "auto",
                      }}
                    >
                      <Text
                        strong
                        style={{ fontSize: isMobile ? 15 : 18, color: "#0F172A" }}
                      >
                        {selectedRangeLabel}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {selectedRangeTimeLabel}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {selectedRangeDays} วัน
                      </Text>
                    </div>
                  </div>
                </button>
              </Col>
              <Col xs={24}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  ปุ่มดาวน์โหลดจะส่งออกตามช่วงวันที่ที่คุณเลือกไว้ด้านบน
                </Text>
              </Col>
            </Row>
          </PageSection>

          {loading ? (
            <PageSection>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  padding: "56px 0",
                }}
              >
                <Spin size="large" tip={t("dashboard.loading")} />
              </div>
            </PageSection>
          ) : !overview ? (
            <PageSection>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t("page.error")}
              />
            </PageSection>
          ) : (
            <>
              {canViewDashboardSummary ? (
              <Row gutter={[12, 12]}>
                <Col xs={12} sm={12} lg={6}>
                  <Card>
                    <Text type="secondary">{t("dashboard.totalSales")}</Text>
                    <Title
                      level={4}
                      style={{ margin: "6px 0 0", color: "#0f766e" }}
                    >
                      {formatCurrency(Number(summary?.total_sales || 0))}
                    </Title>
                  </Card>
                </Col>
                <Col xs={12} sm={12} lg={6}>
                  <Card>
                    <Text type="secondary">จำนวนออเดอร์</Text>
                    <Title level={4} style={{ margin: "6px 0 0" }}>
                      {Number(summary?.total_orders || 0).toLocaleString()}
                    </Title>
                  </Card>
                </Col>
                <Col xs={12} sm={12} lg={6}>
                  <Card>
                    <Text type="secondary">ยอดเฉลี่ยต่อบิล</Text>
                    <Title level={4} style={{ margin: "6px 0 0" }}>
                      {formatCurrency(
                        Number(summary?.average_order_value || 0),
                      )}
                    </Title>
                  </Card>
                </Col>
                <Col xs={12} sm={12} lg={6}>
                  <Card>
                    <Text type="secondary">
                      {t("dashboard.discount", { amount: "" }).replace(
                        " ฿",
                        "",
                      )}
                    </Text>
                    <Title
                      level={4}
                      style={{ margin: "6px 0 0", color: "#b91c1c" }}
                    >
                      {formatCurrency(Number(summary?.total_discount || 0))}
                    </Title>
                  </Card>
                </Col>
              </Row>
              ) : null}

              <Row gutter={[12, 12]}>
                <Col xs={24} lg={12}>
                  <PageSection title="ยอดขายตามช่องทาง">
                    {canViewDashboardChannels ? (
                    <div style={{ display: "grid", gap: 10 }}>
                      {channelCards.map((channel) => {
                        const percent =
                          totalChannelSales > 0
                            ? (channel.value / totalChannelSales) * 100
                            : 0;
                        return (
                          <Card key={channel.key} size="small">
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 8,
                              }}
                            >
                              <Space>
                                {channel.icon}
                                <Text strong>{channel.label}</Text>
                              </Space>
                              <Text strong>
                                {formatCurrency(channel.value)}
                              </Text>
                            </div>
                            <Progress
                              percent={Number(percent.toFixed(1))}
                              strokeColor={channel.color}
                              size="small"
                              style={{ marginTop: 8 }}
                            />
                          </Card>
                        );
                      })}
                      <Card size="small">
                        <Row gutter={8}>
                          <Col span={12}>
                            <Text type="secondary">เงินสด</Text>
                            <Title level={5} style={{ margin: "4px 0 0" }}>
                              {formatCurrency(Number(summary?.cash_sales || 0))}
                            </Title>
                          </Col>
                          <Col span={12}>
                            <Text type="secondary">QR/PromptPay</Text>
                            <Title level={5} style={{ margin: "4px 0 0" }}>
                              {formatCurrency(Number(summary?.qr_sales || 0))}
                            </Title>
                          </Col>
                        </Row>
                      </Card>
                    </div>
                    ) : (
                      <Alert
                        type="warning"
                        showIcon
                        message="Channel mix is restricted for this role"
                        description="This role can open the dashboard but cannot see sales channel and payment mix."
                      />
                    )}
                  </PageSection>
                </Col>

                <Col xs={24} lg={12}>
                  <PageSection title={t("dashboard.topProducts")}>
                    {canViewDashboardTopItems ? (
                      <TopItemsList items={topItems} compact={isMobile} />
                    ) : (
                      <Alert
                        type="warning"
                        showIcon
                        message="Top products are restricted for this role"
                      />
                    )}
                  </PageSection>
                </Col>
              </Row>

              <Row gutter={[12, 12]}>
                <Col xs={24} lg={12}>
                  <PageSection title={t("dashboard.recentOrders")}>
                    {canViewDashboardRecentOrders ? (
                      <RecentOrdersList
                        orders={recentOrders}
                        canOpenDetails={canOpenDashboardOrderDetail}
                        onOpenDetails={handleOpenOrderDetail}
                      />
                    ) : (
                      <Alert
                        type="warning"
                        showIcon
                        message="Recent orders are restricted for this role"
                        description="Order feed and drill-down are available only to operational reviewers."
                      />
                    )}
                  </PageSection>
                </Col>
                <Col xs={24} lg={12}>
                  <PageSection title={t("dashboard.dailySales")}>
                    {canViewDashboardSummary ? (
                    <div style={{ width: "100%", overflowX: "auto" }}>
                    <Table
                      size="small"
                      pagination={false}
                      scroll={{ x: 460 }}
                      dataSource={dailyTableData}
                      columns={[
                        {
                          title: t("dashboard.dailySales.date"),
                          dataIndex: "date",
                          key: "date",
                          render: (value: string) => formatThaiDate(value),
                        },
                        {
                          title: t("dashboard.dailySales.orders"),
                          dataIndex: "orders",
                          key: "orders",
                          align: "center",
                          render: (value: number) => value.toLocaleString(),
                        },
                        {
                          title: t("dashboard.dailySales.sales"),
                          dataIndex: "sales",
                          key: "sales",
                          align: "right",
                          render: (value: number) => formatCurrency(value),
                        },
                        {
                          title: "เฉลี่ย/บิล",
                          dataIndex: "avg",
                          key: "avg",
                          align: "right",
                          render: (value: number) => formatCurrency(value),
                        },
                      ]}
                    />
                    </div>
                    ) : (
                      <Alert
                        type="warning"
                        showIcon
                        message="Daily sales detail is restricted for this role"
                      />
                    )}
                  </PageSection>
                </Col>
              </Row>
            </>
          )}
        </PageStack>
      </PageContainer>

      <DashboardDateRangeDialog
        open={rangeDialogOpen}
        initialRange={dateRange}
        activePreset={preset}
        isMobile={isMobile}
        showDualMonth={showDualMonthCalendar}
        onClose={() => setRangeDialogOpen(false)}
        onApply={applyDateRange}
      />

      <Modal
        title="พิมพ์หรือดาวน์โหลดสรุปผลการขาย"
        open={exportDialogOpen}
        onCancel={() => !exporting && setExportDialogOpen(false)}
        footer={[
          <Button
            key="cancel"
            onClick={() => setExportDialogOpen(false)}
            disabled={exporting}
          >
            ยกเลิก
          </Button>,
          <Button
            key="confirm"
            type="primary"
            loading={exporting}
            onClick={() => void handleExport(exportFormat)}
            icon={
              exportFormat === "xlsx" ? (
                <FileExcelOutlined />
              ) : (
                <PrinterOutlined />
              )
            }
          >
            {exportFormat === "xlsx" ? "ยืนยันการดาวน์โหลด" : "พิมพ์"}
          </Button>,
        ]}
        maskClosable={!exporting}
        closable={!exporting}
        destroyOnClose
      >
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <Alert
            type="info"
            showIcon
            message="ช่วงข้อมูลที่จะส่งออก"
            description={`${dateRange[0].format("DD/MM/YYYY")} - ${dateRange[1].format("DD/MM/YYYY")}`}
          />
          <div>
            <Text strong>เลือกรูปแบบการส่งออก</Text>
            <Radio.Group
              style={{ display: "grid", gap: 8, marginTop: 8 }}
              value={exportFormat}
              onChange={(event) =>
                setExportFormat(event.target.value as ExportFormat)
              }
            >
              <Radio value="a4">สำหรับเครื่องพิมพ์ปกติ</Radio>
              <Radio value="receipt">สำหรับเครื่องพิมพ์ใบเสร็จ</Radio>
              <Radio value="xlsx">.xlsx</Radio>
            </Radio.Group>
          </div>
          {exportFormat === "receipt" ? (
            <div>
              <Text strong>เลือกหน้ากว้างกระดาษใบเสร็จ</Text>
              <Radio.Group
                style={{ display: "grid", gap: 8, marginTop: 8 }}
                value={receiptPaperPreset}
                onChange={(event) =>
                  setReceiptPaperPreset(
                    event.target.value as Extract<
                      PrintPreset,
                      "thermal_58mm" | "thermal_80mm"
                    >,
                  )
                }
              >
                <Radio value="thermal_58mm">58mm</Radio>
                <Radio value="thermal_80mm">80mm</Radio>
              </Radio.Group>
            </div>
          ) : null}
          <Text type="secondary" style={{ fontSize: 12 }}>
            {exportFormat === "xlsx"
              ? "เมื่อกดปุ่มยืนยัน ระบบจะเริ่มสร้างไฟล์ทันที"
              : exportFormat === "receipt"
                ? `เมื่อกดปุ่มพิมพ์ ระบบจะเปิดหน้าพิมพ์แบบยาวสำหรับกระดาษ ${receiptPaperPreset === "thermal_58mm" ? "58mm" : "80mm"}`
                : "เมื่อกดปุ่มพิมพ์ ระบบจะเปิดหน้าพิมพ์ตามรูปแบบที่เลือก"}
          </Text>
        </Space>
      </Modal>
    </div>
  );
}
