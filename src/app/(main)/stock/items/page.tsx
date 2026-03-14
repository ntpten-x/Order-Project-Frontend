"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  App,
  Button,
  Grid,
  Input,
  Modal,
  Pagination,
  Radio,
  Segmented,
  Skeleton,
  Tag,
  Typography,
} from "antd";
import {
  CheckSquareOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  EyeOutlined,
  HistoryOutlined,
  PrinterOutlined,
  ReloadOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  SyncOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";

import { AccessGuardFallback } from "../../../../components/pos/AccessGuard";
import EditOrderModal from "../../../../components/stock/EditOrderModal";
import OrderDetailModal from "../../../../components/stock/OrderDetailModal";
import PageContainer from "../../../../components/ui/page/PageContainer";
import UIPageHeader from "../../../../components/ui/page/PageHeader";
import PageSection from "../../../../components/ui/page/PageSection";
import PageState from "../../../../components/ui/states/PageState";
import { useAuth } from "../../../../contexts/AuthContext";
import { useEffectivePermissions } from "../../../../hooks/useEffectivePermissions";
import { useSocket } from "../../../../hooks/useSocket";
import { authService } from "../../../../services/auth.service";
import { ordersService } from "../../../../services/stock/orders.service";
import { PrintPreset } from "../../../../types/api/pos/printSettings";
import { Order, OrderStatus } from "../../../../types/api/stock/orders";
import { useDebouncedValue } from "../../../../utils/useDebouncedValue";
import {
  closePrintWindow,
  getPrintSettings,
  primePrintResources,
  reservePrintWindow,
} from "../../../../utils/print-settings/runtime";
import { applyPresetToDocument } from "../../../../utils/print-settings/defaults";
import { LegacyRealtimeEvents, RealtimeEvents } from "../../../../utils/realtimeEvents";
import { buildStockOrderPrintHtml } from "./print";
import ItemsPageStyle from "./style";

const { Text } = Typography;

type OrderFilterStatus = "all" | OrderStatus;
type SortCreated = "old" | "new";
type StockOrderPrintMode = "a4" | "receipt";
type ReceiptPaperPreset = Extract<PrintPreset, "thermal_58mm" | "thermal_80mm">;

type StatusTabConfig = {
  key: OrderFilterStatus;
  label: string;
  icon: React.ReactNode;
  activeBg: string;
  activeShadow: string;
};

const PAGE_SIZE_OPTIONS = [8, 12, 20, 50];

const STATUS_TABS: StatusTabConfig[] = [
  {
    key: OrderStatus.PENDING,
    label: "รอดำเนินการ",
    icon: <ClockCircleOutlined />,
    activeBg: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    activeShadow: "0 4px 12px rgba(245, 158, 11, 0.25)",
  },
  {
    key: OrderStatus.COMPLETED,
    label: "เสร็จสิ้น",
    icon: <CheckSquareOutlined />,
    activeBg: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
    activeShadow: "0 4px 12px rgba(34, 197, 94, 0.22)",
  },
  {
    key: OrderStatus.CANCELLED,
    label: "ยกเลิก",
    icon: <CloseCircleOutlined />,
    activeBg: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    activeShadow: "0 4px 12px rgba(239, 68, 68, 0.22)",
  },
  {
    key: "all",
    label: "ทั้งหมด",
    icon: <UnorderedListOutlined />,
    activeBg: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    activeShadow: "0 4px 12px rgba(59, 130, 246, 0.24)",
  },
];

function formatDateTime(value?: string): string {
  if (!value) return "-";
  return new Date(value).toLocaleString("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTimeSince(value?: string): string {
  if (!value) return "-";
  const diffMinutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (diffMinutes < 1) return "เมื่อกี้";
  if (diffMinutes < 60) return `${diffMinutes} นาทีที่แล้ว`;
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} ชม.ที่แล้ว`;
  return formatDateTime(value);
}

function getOrderCode(id: string): string {
  return `#${id.slice(0, 8).toUpperCase()}`;
}

function getOrderLineCount(order: Order): number {
  return order.ordersItems?.length || 0;
}

function getOrderQuantity(order: Order): number {
  return (order.ordersItems || []).reduce(
    (sum, item) => sum + Number(item.quantity_ordered || 0),
    0
  );
}

function getStatusMeta(status: OrderStatus): {
  label: string;
  color: string;
  background: string;
  borderColor: string;
} {
  if (status === OrderStatus.COMPLETED) {
    return {
      label: "เสร็จสิ้น",
      color: "#15803d",
      background: "#f0fdf4",
      borderColor: "#bbf7d0",
    };
  }

  if (status === OrderStatus.CANCELLED) {
    return {
      label: "ยกเลิก",
      color: "#b91c1c",
      background: "#fef2f2",
      borderColor: "#fecaca",
    };
  }

  return {
    label: "รอดำเนินการ",
    color: "#b45309",
    background: "#fffbeb",
    borderColor: "#fde68a",
  };
}

type StockOrderCardProps = {
  order: Order;
  index: number;
  canUpdateOrders: boolean;
  isMobile: boolean;
  onView: (order: Order) => void;
  onPrint: (order: Order) => void;
  onEdit: (order: Order) => void;
  onReceive: (order: Order) => void;
  onCancel: (order: Order) => void;
};

function StockOrderCard({
  order,
  index,
  canUpdateOrders,
  isMobile,
  onView,
  onPrint,
  onEdit,
  onReceive,
  onCancel,
}: StockOrderCardProps) {
  const statusMeta = getStatusMeta(order.status);
  const previewItems = (order.ordersItems || []).slice(0, 4);
  const extraItems = Math.max(0, getOrderLineCount(order) - previewItems.length);
  const canMutate = canUpdateOrders && order.status === OrderStatus.PENDING;

  return (
    <div className="stock-items-card" style={{ animationDelay: `${index * 0.04}s` }}>
      <div className="stock-items-card-head">
        <div>
          <div className="stock-items-card-title">
            <span className="stock-items-card-code">{getOrderCode(order.id)}</span>
            <span
              className="stock-items-status-badge"
              style={{
                color: statusMeta.color,
                background: statusMeta.background,
                border: `1px solid ${statusMeta.borderColor}`,
              }}
            >
              <span
                className="stock-items-status-dot"
                style={{ background: statusMeta.color }}
              />
              {statusMeta.label}
            </span>
          </div>
          <div className="stock-items-meta-row" style={{ marginTop: 8 }}>
            <span>
              <ClockCircleOutlined />
              {formatDateTime(order.create_date)}
            </span>
            <span>{formatTimeSince(order.create_date)}</span>
          </div>
        </div>

        <div className="stock-items-card-metrics" style={{ justifyContent: isMobile ? "flex-start" : "flex-end" }}>
          <span>{getOrderLineCount(order)} รายการ</span>
          <span>{getOrderQuantity(order)} หน่วย</span>
        </div>
      </div>

      <div className="stock-items-card-main">
        <div className="stock-items-card-main-left">
          <div className="stock-items-meta-row">
            <span>ผู้สร้าง: {order.ordered_by?.name || order.ordered_by?.username || "-"}</span>
            <span>อัปเดตล่าสุด: {formatDateTime(order.update_date)}</span>
          </div>

          <div className="stock-items-item-chips">
            {previewItems.map((item) => (
              <Tag key={item.id} className="stock-items-item-chip">
                {item.ingredient?.display_name || "-"} x{Number(item.quantity_ordered || 0)}
              </Tag>
            ))}
            {extraItems > 0 ? (
              <Tag className="stock-items-item-chip">+{extraItems} รายการ</Tag>
            ) : null}
          </div>
        </div>

        <div className="stock-items-card-main-right">
          <div className="stock-items-card-metrics">
            <span>ซื้อแล้ว {order.ordersItems?.filter((item) => item.ordersDetail?.is_purchased).length || 0}</span>
            <span>คงเหลือ {Math.max(0, getOrderLineCount(order) - (order.ordersItems?.filter((item) => item.ordersDetail?.is_purchased).length || 0))}</span>
          </div>
        </div>
      </div>

      <div className="stock-items-card-foot" style={{ marginTop: 14 }}>
        {order.remark ? (
          <div className="stock-items-remark">
            <span className="stock-items-remark-title">หมายเหตุ</span>
            {order.remark}
          </div>
        ) : (
          <div />
        )}

        <div className="stock-items-card-actions">
          <Button
            icon={<EyeOutlined />}
            onClick={() => onView(order)}
            data-testid={`stock-order-view-${order.id}`}
          >
            ดู
          </Button>
          <Button
            icon={<PrinterOutlined />}
            onClick={() => onPrint(order)}
            data-testid={`stock-order-print-${order.id}`}
          >
            พิมพ์
          </Button>
          <Button
            icon={<EditOutlined />}
            onClick={() => onEdit(order)}
            disabled={!canMutate}
            data-testid={`stock-order-edit-${order.id}`}
          >
            แก้ไข
          </Button>
          <Button
            type="primary"
            icon={<CheckSquareOutlined />}
            onClick={() => onReceive(order)}
            disabled={!canMutate}
            data-testid={`stock-order-receive-${order.id}`}
          >
            ตรวจรับ
          </Button>
          {canUpdateOrders ? (
            <Button
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => onCancel(order)}
              disabled={order.status !== OrderStatus.PENDING}
              data-testid={`stock-order-cancel-${order.id}`}
            >
              ยกเลิก
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function StockOrdersQueuePage() {
  const router = useRouter();
  const { message: messageApi } = App.useApp();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const { socket } = useSocket();
  const { user } = useAuth();
  const { can, loading: permissionsLoading } = useEffectivePermissions({
    enabled: Boolean(user?.id),
  });

  const canViewOrders = can("stock.orders.page", "view");
  const canCreateOrders = can("stock.orders.page", "create");
  const canUpdateOrders = can("stock.orders.page", "update");

  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [lastPage, setLastPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<OrderFilterStatus>(OrderStatus.PENDING);
  const [sortCreated, setSortCreated] = useState<SortCreated>("new");
  const [searchText, setSearchText] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const debouncedSearch = useDebouncedValue(searchText.trim(), 300);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [csrfToken, setCsrfToken] = useState("");

  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [printMode, setPrintMode] = useState<StockOrderPrintMode>("a4");
  const [receiptPaperPreset, setReceiptPaperPreset] =
    useState<ReceiptPaperPreset>("thermal_80mm");
  const [printing, setPrinting] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const refreshTimerRef = useRef<number | null>(null);
  const hasLoadedRef = useRef(false);
  const orderCountRef = useRef(0);

  useEffect(() => {
    orderCountRef.current = orders.length;
  }, [orders.length]);

  const loadOrders = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = Boolean(options?.silent) && hasLoadedRef.current;
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
        setError(null);
      }

      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
        sort_created: sortCreated,
      });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (debouncedSearch) params.set("q", debouncedSearch);

      try {
        const payload = await ordersService.getAllOrders(undefined, params, {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        if (payload.last_page > 0 && page > payload.last_page) {
          setPage(payload.last_page);
          return;
        }

        hasLoadedRef.current = true;
        setOrders(payload.data);
        setTotal(payload.total);
        setLastPage(payload.last_page);
        setLastSyncedAt(new Date());
        setRefreshError(null);
        setError(null);
      } catch (caughtError) {
        if ((caughtError as { name?: string })?.name === "AbortError") return;
        const nextMessage =
          caughtError instanceof Error ? caughtError.message : "โหลดคิวใบสั่งซื้อไม่สำเร็จ";
        if (silent && orderCountRef.current > 0) {
          setRefreshError(nextMessage);
        } else {
          setError(caughtError);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [debouncedSearch, page, pageSize, sortCreated, statusFilter]
  );

  useEffect(() => {
    if (!canViewOrders) return;
    void loadOrders({ silent: hasLoadedRef.current });
  }, [canViewOrders, loadOrders]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (refreshTimerRef.current) window.clearTimeout(refreshTimerRef.current);
    };
  }, []);

  useEffect(() => {
    primePrintResources();
  }, []);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const token = await authService.getCsrfToken();
        if (mounted) setCsrfToken(token);
      } catch {
        if (mounted) messageApi.error("โหลดโทเคนความปลอดภัยไม่สำเร็จ");
      }
    };
    void run();
    return () => {
      mounted = false;
    };
  }, [messageApi]);

  useEffect(() => {
    if (!socket || !canViewOrders) return;
    const queueRefresh = () => {
      if (refreshTimerRef.current) window.clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = window.setTimeout(() => {
        void loadOrders({ silent: true });
      }, 300);
    };

    socket.on(RealtimeEvents.stockOrders.create, queueRefresh);
    socket.on(RealtimeEvents.stockOrders.update, queueRefresh);
    socket.on(RealtimeEvents.stockOrders.status, queueRefresh);
    socket.on(RealtimeEvents.stockOrders.delete, queueRefresh);
    socket.on(RealtimeEvents.stockOrders.detailUpdate, queueRefresh);
    socket.on(LegacyRealtimeEvents.stockOrdersUpdated, queueRefresh);

    return () => {
      socket.off(RealtimeEvents.stockOrders.create, queueRefresh);
      socket.off(RealtimeEvents.stockOrders.update, queueRefresh);
      socket.off(RealtimeEvents.stockOrders.status, queueRefresh);
      socket.off(RealtimeEvents.stockOrders.delete, queueRefresh);
      socket.off(RealtimeEvents.stockOrders.detailUpdate, queueRefresh);
      socket.off(LegacyRealtimeEvents.stockOrdersUpdated, queueRefresh);
      if (refreshTimerRef.current) window.clearTimeout(refreshTimerRef.current);
    };
  }, [canViewOrders, loadOrders, socket]);

  const cancelOrder = useCallback(
    (order: Order) => {
      if (!canUpdateOrders) {
        messageApi.error("คุณไม่มีสิทธิ์ยกเลิกใบสั่งซื้อ");
        return;
      }

      Modal.confirm({
        title: `ยกเลิกใบสั่งซื้อ ${getOrderCode(order.id)}`,
        content: "ต้องการยกเลิกใบสั่งซื้อนี้ใช่หรือไม่",
        okText: "ยืนยันยกเลิก",
        okButtonProps: { danger: true },
        cancelText: "ปิด",
        onOk: async () => {
          try {
            await ordersService.updateStatus(order.id, OrderStatus.CANCELLED, undefined, csrfToken);
            messageApi.success("ยกเลิกใบสั่งซื้อแล้ว");
            void loadOrders({ silent: true });
          } catch (caughtError) {
            messageApi.error(
              caughtError instanceof Error ? caughtError.message : "ยกเลิกใบสั่งซื้อไม่สำเร็จ"
            );
          }
        },
      });
    },
    [canUpdateOrders, csrfToken, loadOrders, messageApi]
  );

  const openPrintModal = useCallback((order: Order) => {
    setPrintingOrder(order);
    setPrintMode("a4");
  }, []);

  const handleConfirmPrint = useCallback(async () => {
    if (!printingOrder) return;
    const popup = reservePrintWindow(`ใบสั่งซื้อ ${getOrderCode(printingOrder.id)}`);
    if (!popup) {
      messageApi.error("เบราว์เซอร์บล็อกหน้าต่างพิมพ์ กรุณาอนุญาตป๊อปอัป");
      return;
    }

    try {
      setPrinting(true);
      const printSettings = await getPrintSettings();
      const documentSetting =
        printMode === "a4"
          ? printSettings.documents.purchase_order
          : {
              ...applyPresetToDocument(
                printSettings.documents.purchase_order,
                receiptPaperPreset
              ),
              margin_top: 3,
              margin_right: 3,
              margin_bottom: 3,
              margin_left: 3,
              density: "compact" as const,
              line_spacing: 1.12,
              font_scale: Math.min(
                printSettings.documents.purchase_order.font_scale || 100,
                100
              ),
            };

      popup.document.open();
      popup.document.write(
        buildStockOrderPrintHtml({
          order: printingOrder,
          documentSetting,
          receiptPaperPreset,
        })
      );
      popup.document.close();
      setPrintingOrder(null);
    } catch (caughtError) {
      closePrintWindow(popup);
      messageApi.error(
        caughtError instanceof Error ? caughtError.message : "เปิดหน้าพิมพ์ใบสั่งซื้อไม่สำเร็จ"
      );
    } finally {
      setPrinting(false);
    }
  }, [messageApi, printMode, printingOrder, receiptPaperPreset]);

  const pageStats = useMemo(() => {
    const pending = orders.filter((order) => order.status === OrderStatus.PENDING).length;
    const completed = orders.filter((order) => order.status === OrderStatus.COMPLETED).length;
    const cancelled = orders.filter((order) => order.status === OrderStatus.CANCELLED).length;
    const lines = orders.reduce((sum, order) => sum + getOrderLineCount(order), 0);
    const quantity = orders.reduce((sum, order) => sum + getOrderQuantity(order), 0);

    return { pending, completed, cancelled, lines, quantity };
  }, [orders]);

  const tabCounts = useMemo(
    () => ({
      all: statusFilter === "all" ? total : total,
      [OrderStatus.PENDING]:
        statusFilter === OrderStatus.PENDING ? total : pageStats.pending,
      [OrderStatus.COMPLETED]:
        statusFilter === OrderStatus.COMPLETED ? total : pageStats.completed,
      [OrderStatus.CANCELLED]:
        statusFilter === OrderStatus.CANCELLED ? total : pageStats.cancelled,
    }),
    [pageStats.cancelled, pageStats.completed, pageStats.pending, statusFilter, total]
  );

  if (permissionsLoading) {
    return <PageState status="loading" title="กำลังตรวจสอบสิทธิ์การใช้งาน" />;
  }

  if (!canViewOrders) {
    return (
      <AccessGuardFallback
        message="คุณไม่มีสิทธิ์เข้าถึงคิวใบสั่งซื้อของสต็อก"
        tone="danger"
      />
    );
  }

  const isInitialLoading = loading && !hasLoadedRef.current;

  return (
    <div className="stock-items-page-shell" data-testid="stock-orders-page">
      <ItemsPageStyle />

      <UIPageHeader
        title="คิวใบสั่งซื้อสต็อก"
        subtitle={
          lastSyncedAt
            ? `อัปเดตล่าสุด ${formatDateTime(lastSyncedAt.toISOString())}`
            : `รายการทั้งหมด ${total.toLocaleString()} รายการ`
        }
        icon={<UnorderedListOutlined />}
        actions={
          <div className="stock-items-header-actions">
            <Button
              type="text"
              icon={<SearchOutlined />}
              onClick={() => setShowSearch((prev) => !prev)}
              style={{
                borderRadius: 12,
                width: 40,
                height: 40,
                color: showSearch ? "#2563eb" : undefined,
                background: showSearch ? "#eff6ff" : undefined,
              }}
            />
            <Button
              icon={<HistoryOutlined />}
              onClick={() => router.push("/stock/history")}
            >
              ประวัติ
            </Button>
            <Button
              icon={refreshing ? <SyncOutlined spin /> : <ReloadOutlined />}
              onClick={() => void loadOrders({ silent: true })}
              loading={loading && !hasLoadedRef.current}
            >
              รีเฟรช
            </Button>
          </div>
        }
      />

      <PageContainer maxWidth={1440}>
        {showSearch ? (
          <div className="stock-items-search-panel">
            <Input
              allowClear
              prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
              placeholder="ค้นหารหัสใบสั่งซื้อ ผู้สร้าง หมายเหตุ หรือชื่อวัตถุดิบ"
              value={searchText}
              onChange={(event) => {
                setSearchText(event.target.value);
                setPage(1);
              }}
              onClear={() => {
                setSearchText("");
                setPage(1);
              }}
              variant="borderless"
            />
          </div>
        ) : null}

        <div className="stock-items-summary-grid">
          <div className="stock-items-summary-card">
            <span className="stock-items-summary-label">เอกสารทั้งหมด</span>
            <span className="stock-items-summary-value">{total.toLocaleString()}</span>
            <span className="stock-items-summary-meta">ตามตัวกรองที่เลือก</span>
          </div>
          <div className="stock-items-summary-card">
            <span className="stock-items-summary-label">เอกสารบนหน้านี้</span>
            <span className="stock-items-summary-value">{orders.length.toLocaleString()}</span>
            <span className="stock-items-summary-meta">
              หน้า {page} จาก {Math.max(lastPage, 1)}
            </span>
          </div>
          <div className="stock-items-summary-card">
            <span className="stock-items-summary-label">รายการวัตถุดิบ</span>
            <span className="stock-items-summary-value">{pageStats.lines.toLocaleString()}</span>
            <span className="stock-items-summary-meta">รวมจำนวนบรรทัดในหน้านี้</span>
          </div>
          <div className="stock-items-summary-card">
            <span className="stock-items-summary-label">จำนวนที่ต้องซื้อ</span>
            <span className="stock-items-summary-value">{pageStats.quantity.toLocaleString()}</span>
            <span className="stock-items-summary-meta">รวมทุกหน่วยในหน้านี้</span>
          </div>
        </div>

        <div className="stock-items-tab-row">
          {STATUS_TABS.map((tab) => {
            const isActive = statusFilter === tab.key;
            const count =
              tab.key === "all"
                ? tabCounts.all
                : tabCounts[tab.key as OrderStatus];

            return (
              <button
                key={tab.key}
                type="button"
                className="stock-items-tab-btn"
                onClick={() => {
                  setStatusFilter(tab.key);
                  setPage(1);
                }}
                style={{
                  background: isActive ? tab.activeBg : "#ffffff",
                  color: isActive ? "#ffffff" : "#475569",
                  boxShadow: isActive ? tab.activeShadow : "0 1px 4px rgba(15, 23, 42, 0.06)",
                  border: isActive ? "none" : "1px solid #e2e8f0",
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {count > 0 ? (
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: 999,
                      background: isActive ? "rgba(255,255,255,0.2)" : "#f1f5f9",
                      color: isActive ? "#ffffff" : "#475569",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="stock-items-toolbar">
          <Segmented<SortCreated>
            className="stock-items-segmented"
            value={sortCreated}
            onChange={(value) => {
              setSortCreated(value);
              setPage(1);
            }}
            options={[
              { label: "ล่าสุดก่อน", value: "new" },
              { label: "เก่าก่อน", value: "old" },
            ]}
          />

          <div className="stock-items-toolbar-right">
            <Segmented<number>
              className="stock-items-segmented"
              value={pageSize}
              onChange={(value) => {
                setPageSize(value);
                setPage(1);
              }}
              options={PAGE_SIZE_OPTIONS.map((value) => ({
                label: `${value}/หน้า`,
                value,
              }))}
            />
          </div>
        </div>

        <PageSection title="รายการใบสั่งซื้อ" extra={<Text strong>{total.toLocaleString()} รายการ</Text>}>
          {refreshError ? (
            <div className="stock-items-feedback stock-items-feedback-danger">
              <Text>{refreshError}</Text>
            </div>
          ) : null}

          {isInitialLoading ? (
            <div className="stock-items-list">
              {[1, 2, 3].map((value) => (
                <div key={value} className="stock-items-card">
                  <Skeleton active paragraph={{ rows: 3 }} />
                </div>
              ))}
            </div>
          ) : error ? (
            <PageState
              status="error"
              title="โหลดคิวใบสั่งซื้อไม่สำเร็จ"
              error={error}
              onRetry={() => void loadOrders()}
            />
          ) : orders.length === 0 ? (
            <PageState
              status="empty"
              title="ไม่พบใบสั่งซื้อในตัวกรองนี้"
              description={
                debouncedSearch
                  ? "ลองเปลี่ยนคำค้นหาหรือสลับสถานะที่ต้องการดู"
                  : "เมื่อมีใบสั่งซื้อ ระบบจะแสดงรายการที่นี่"
              }
              action={
                canCreateOrders ? (
                  <Button
                    type="primary"
                    icon={<ShoppingCartOutlined />}
                    onClick={() => router.push("/stock")}
                  >
                    ไปสร้างใบสั่งซื้อ
                  </Button>
                ) : null
              }
            />
          ) : (
            <>
              <div className="stock-items-list">
                {orders.map((order, index) => (
                  <StockOrderCard
                    key={order.id}
                    order={order}
                    index={index}
                    canUpdateOrders={canUpdateOrders}
                    isMobile={isMobile}
                    onView={(target) => setViewingOrder(target)}
                    onPrint={openPrintModal}
                    onEdit={(target) => setEditingOrder(target)}
                    onReceive={(target) => router.push(`/stock/buying?orderId=${target.id}`)}
                    onCancel={cancelOrder}
                  />
                ))}
              </div>

              <div className="stock-items-pagination">
                <div className="stock-items-pagination-summary">
                  แสดง {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} จาก{" "}
                  {total.toLocaleString()} รายการ
                </div>
                <Pagination
                  current={page}
                  pageSize={pageSize}
                  total={total}
                  showSizeChanger={false}
                  onChange={(nextPage) => setPage(nextPage)}
                />
              </div>
            </>
          )}
        </PageSection>
      </PageContainer>

      <EditOrderModal
        open={Boolean(editingOrder)}
        order={editingOrder}
        onClose={() => setEditingOrder(null)}
        onSuccess={() => void loadOrders({ silent: true })}
      />

      <OrderDetailModal
        open={Boolean(viewingOrder)}
        order={viewingOrder}
        onClose={() => setViewingOrder(null)}
      />

      <Modal
        title="พิมพ์ใบสั่งซื้อ"
        open={Boolean(printingOrder)}
        onCancel={() => !printing && setPrintingOrder(null)}
        onOk={() => void handleConfirmPrint()}
        okText="พิมพ์"
        cancelText="ยกเลิก"
        confirmLoading={printing}
        destroyOnClose
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Text type="secondary">
            {printingOrder ? `ใบสั่งซื้อ ${getOrderCode(printingOrder.id)}` : "เลือกรูปแบบการพิมพ์"}
          </Text>

          <Radio.Group
            value={printMode}
            onChange={(event) => setPrintMode(event.target.value as StockOrderPrintMode)}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Radio value="receipt">สำหรับเครื่องพิมพ์ใบเสร็จ</Radio>
              <Radio value="a4">สำหรับเครื่องพิมพ์ทั่วไป (A4)</Radio>
            </div>
          </Radio.Group>

          {printMode === "receipt" ? (
            <div>
              <Text strong>เลือกหน้ากว้างกระดาษ</Text>
              <Radio.Group
                value={receiptPaperPreset}
                onChange={(event) =>
                  setReceiptPaperPreset(event.target.value as ReceiptPaperPreset)
                }
                style={{ display: "block", marginTop: 8 }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <Radio value="thermal_58mm">58mm</Radio>
                  <Radio value="thermal_80mm">80mm</Radio>
                </div>
              </Radio.Group>
            </div>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}
