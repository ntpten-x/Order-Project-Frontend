"use client";

import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import {
  App,
  Button,
  Grid,
  Input,
  Modal,
  Pagination,
  Segmented,
  Skeleton,
  Tag,
  Typography,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  EyeOutlined,
  HistoryOutlined,
  ReloadOutlined,
  SearchOutlined,
  SyncOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useSocket } from "../../../../hooks/useSocket";
import { useAuth } from "../../../../contexts/AuthContext";
import { useEffectivePermissions } from "../../../../hooks/useEffectivePermissions";
import { authService } from "../../../../services/auth.service";
import { LegacyRealtimeEvents, RealtimeEvents } from "../../../../utils/realtimeEvents";
import { Order, OrderStatus } from "../../../../types/api/stock/orders";
import { ordersService } from "../../../../services/stock/orders.service";
import { DEFAULT_CREATED_SORT, parseCreatedSort } from "../../../../lib/list-sort";
import UIPageHeader from "../../../../components/ui/page/PageHeader";
import PageContainer from "../../../../components/ui/page/PageContainer";
import PageSection from "../../../../components/ui/page/PageSection";
import PageState from "../../../../components/ui/states/PageState";
import OrderDetailModal from "../../../../components/stock/OrderDetailModal";
import { AccessGuardFallback } from "../../../../components/pos/AccessGuard";
import { POSSharedStyles, posLayoutStyles } from "../../../../components/pos/shared/style";
import { POSCategoryFilterBar } from "../../../../components/pos/shared/POSCategoryFilterBar";
import PageStack from "../../../../components/ui/page/PageStack";
import HistoryPageStyle from "./style";

const { Text } = Typography;

type CreatedSort = "old" | "new";
type HistoryStatusFilter = "all" | OrderStatus.COMPLETED | OrderStatus.CANCELLED;
const HISTORY_PAGE_STATUSES = [OrderStatus.COMPLETED, OrderStatus.CANCELLED] as const;
const HISTORY_PAGE_STATUS_QUERY = HISTORY_PAGE_STATUSES.join(",");

type StatusTabConfig = {
  key: HistoryStatusFilter;
  label: string;
  icon: React.ReactNode;
  activeBg: string;
  activeShadow: string;
};

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const STATUS_TABS: StatusTabConfig[] = [
  {
    key: "all",
    label: "ทั้งหมด",
    icon: <HistoryOutlined />,
    activeBg: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    activeShadow: "0 4px 12px rgba(59, 130, 246, 0.24)",
  },
  {
    key: OrderStatus.COMPLETED,
    label: "เสร็จสิ้น",
    icon: <CheckCircleOutlined />,
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

function getOrderCode(id: string): string {
  return `#${id.slice(0, 8).toUpperCase()}`;
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

type HistoryOrderCardProps = {
  order: Order;
  index: number;
  canDeleteOrders: boolean;
  isMobile: boolean;
  onView: (order: Order) => void;
  onDelete: (order: Order) => void;
};

function HistoryOrderCard({
  order,
  index,
  canDeleteOrders,
  isMobile,
  onView,
  onDelete,
}: HistoryOrderCardProps) {
  const statusMeta = getStatusMeta(order.status);
  const previewItems = (order.ordersItems || []).slice(0, 4);
  const lineCount = order.ordersItems?.length || 0;
  const required = (order.ordersItems || []).reduce(
    (acc, item) => acc + Number(item.quantity_ordered || 0),
    0
  );
  const actual = (order.ordersItems || []).reduce(
    (acc, item) => acc + Number(item.ordersDetail?.actual_quantity || 0),
    0
  );
  const extraItems = Math.max(0, lineCount - previewItems.length);

  return (
    <div className="stock-history-card" style={{ animationDelay: `${index * 0.04}s` }}>
      <div className="stock-history-card-head">
        <div>
          <div className="stock-history-card-title" style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
            <span className="stock-history-card-code">{getOrderCode(order.id)}</span>
            <span
              className="stock-history-status-badge"
              style={{
                color: statusMeta.color,
                background: statusMeta.background,
                border: `1px solid ${statusMeta.borderColor}`,
              }}
            >
              <span
                className="stock-history-status-dot"
                style={{ background: statusMeta.color }}
              />
              {statusMeta.label}
            </span>
            <span style={{ marginLeft: "auto", fontSize: 13, color: "#64748b", fontWeight: 600 }}>
              {lineCount} รายการ
            </span>
          </div>
          <div className="stock-history-meta-row" style={{ marginTop: 8 }}>
            <span>ผู้สร้าง: {order.ordered_by?.name || order.ordered_by?.username || "-"}</span>
            <span>สร้างเมื่อ: {formatDateTime(order.create_date)}</span>
          </div>
        </div>

        <div />
      </div>

      <div className="stock-history-card-main">
        <div className="stock-history-card-main-left">
          <div className="stock-history-item-chips">
            {previewItems.map((item) => (
              <Tag key={item.id} className="stock-history-item-chip">
                {item.ingredient?.display_name || "-"} x
                {Number(
                  order.status === OrderStatus.COMPLETED
                    ? item.ordersDetail?.actual_quantity || item.quantity_ordered || 0
                    : item.quantity_ordered || 0
                )}
              </Tag>
            ))}
            {extraItems > 0 ? (
              <Tag className="stock-history-item-chip">+{extraItems} รายการ</Tag>
            ) : null}
          </div>

          {order.remark ? (
            <div className="stock-history-remark">
              <span className="stock-history-remark-title">หมายเหตุ</span>
              {order.remark}
            </div>
          ) : null}
        </div>

        <div className="stock-history-card-main-right">
          <div className="stock-history-card-metrics">
            <span>อัปเดตล่าสุด {formatDateTime(order.update_date)}</span>
          </div>
        </div>
      </div>

      <div className="stock-history-card-foot" style={{ marginTop: 14 }}>
        <div />
        <div className="stock-history-card-actions" style={{ display: "flex", gap: 12, width: "100%" }}>
          <Button icon={<EyeOutlined />} onClick={() => onView(order)} style={{ flex: 1 }}>
            ดูรายละเอียด
          </Button>
          {canDeleteOrders ? (
            <Button danger icon={<DeleteOutlined />} onClick={() => onDelete(order)} style={{ flex: 1 }}>
              ลบ
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function StockHistoryPage() {
  const { message: messageApi } = App.useApp();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const initRef = useRef(false);
  const hasLoadedRef = useRef(false);
  const requestRef = useRef<AbortController | null>(null);

  const { socket } = useSocket();
  const { user, loading: authLoading } = useAuth();
  const { can, loading: permissionLoading } = useEffectivePermissions({
    enabled: Boolean(user?.id),
  });
  const canViewOrders = can("stock.orders.page", "view");
  const canDeleteOrders = can("stock.orders.page", "delete");

  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [createdSort, setCreatedSort] = useState<CreatedSort>(DEFAULT_CREATED_SORT);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<HistoryStatusFilter>("all");

  const deferredSearchText = useDeferredValue(searchText.trim());
  const historyCategories = useMemo(() => [
    { id: OrderStatus.COMPLETED, display_name: "เสร็จสิ้น" },
    { id: OrderStatus.CANCELLED, display_name: "ยกเลิก" },
  ], []);

  useEffect(() => {
    if (initRef.current) return;

    const pageParam = Number(searchParams.get("page") || "1");
    const limitParam = Number(searchParams.get("limit") || "10");
    const sortParam = searchParams.get("sort_created");
    const qParam = searchParams.get("q") || "";
    const statusParam = searchParams.get("status");

    setPage(Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1);
    setPageSize(Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 10);
    setCreatedSort(parseCreatedSort(sortParam));
    setSearchText(qParam);
    setStatusFilter(
      statusParam === OrderStatus.COMPLETED || statusParam === OrderStatus.CANCELLED
        ? statusParam
        : "all"
    );

    initRef.current = true;
  }, [searchParams]);

  useEffect(() => {
    if (!initRef.current) return;

    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));
    if (pageSize !== 10) params.set("limit", String(pageSize));
    if (createdSort !== DEFAULT_CREATED_SORT) params.set("sort_created", createdSort);
    if (deferredSearchText) params.set("q", deferredSearchText);
    if (statusFilter !== "all") params.set("status", statusFilter);

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [router, pathname, page, pageSize, createdSort, deferredSearchText, statusFilter]);

  const fetchHistory = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (!canViewOrders) return;

      requestRef.current?.abort();
      const controller = new AbortController();
      requestRef.current = controller;

      try {
        if (silent && hasLoadedRef.current) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);

        const params = new URLSearchParams();
        params.set("status", statusFilter === "all" ? HISTORY_PAGE_STATUS_QUERY : statusFilter);
        params.set("page", String(page));
        params.set("limit", String(pageSize));
        params.set("sort_created", createdSort);
        if (deferredSearchText) params.set("q", deferredSearchText);

        const payload = await ordersService.getAllOrders(undefined, params, {
          signal: controller.signal,
        });

        if (requestRef.current !== controller) return;

        setOrders(
          (Array.isArray(payload.data) ? payload.data : []).filter((order) =>
            HISTORY_PAGE_STATUSES.includes(
              order.status as (typeof HISTORY_PAGE_STATUSES)[number]
            )
          )
        );
        setTotal(Number(payload.total || 0));
        setLastSyncedAt(new Date());
        setRefreshError(null);
        hasLoadedRef.current = true;
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        if (requestRef.current !== controller) return;

        const nextMessage =
          err instanceof Error ? err.message : "โหลดประวัติใบสั่งซื้อไม่สำเร็จ";
        if (silent && orders.length > 0) {
          setRefreshError(nextMessage);
        } else {
          setError(nextMessage);
          setOrders([]);
          setTotal(0);
        }
      } finally {
        if (requestRef.current === controller) {
          requestRef.current = null;
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [canViewOrders, createdSort, deferredSearchText, page, pageSize, statusFilter, orders.length]
  );

  useEffect(() => {
    if (!initRef.current || !canViewOrders) return;
    void fetchHistory({ silent: hasLoadedRef.current });
    return () => {
      requestRef.current?.abort();
    };
  }, [canViewOrders, fetchHistory]);

  useEffect(() => {
    if (!socket || !canViewOrders) return;

    const refresh = () => {
      void fetchHistory({ silent: true });
    };

    socket.on(RealtimeEvents.stockOrders.create, refresh);
    socket.on(RealtimeEvents.stockOrders.update, refresh);
    socket.on(RealtimeEvents.stockOrders.status, refresh);
    socket.on(RealtimeEvents.stockOrders.delete, refresh);
    socket.on(RealtimeEvents.stockOrders.detailUpdate, refresh);
    socket.on(LegacyRealtimeEvents.stockOrdersUpdated, refresh);

    return () => {
      socket.off(RealtimeEvents.stockOrders.create, refresh);
      socket.off(RealtimeEvents.stockOrders.update, refresh);
      socket.off(RealtimeEvents.stockOrders.status, refresh);
      socket.off(RealtimeEvents.stockOrders.delete, refresh);
      socket.off(RealtimeEvents.stockOrders.detailUpdate, refresh);
      socket.off(LegacyRealtimeEvents.stockOrdersUpdated, refresh);
    };
  }, [socket, canViewOrders, fetchHistory]);

  const deleteOrder = useCallback(
    (order: Order) => {
      Modal.confirm({
        title: `ลบใบสั่งซื้อ ${getOrderCode(order.id)}`,
        content: "การลบไม่สามารถกู้คืนได้ ต้องการดำเนินการต่อหรือไม่",
        okText: "ลบใบสั่งซื้อ",
        okButtonProps: { danger: true },
        cancelText: "ยกเลิก",
        onOk: async () => {
          try {
            const token = await authService.getCsrfToken();
            await ordersService.deleteOrder(order.id, undefined, token);
            messageApi.success("ลบใบสั่งซื้อแล้ว");
            void fetchHistory({ silent: true });
          } catch (err) {
            messageApi.error(err instanceof Error ? err.message : "ลบใบสั่งซื้อไม่สำเร็จ");
          }
        },
      });
    },
    [fetchHistory, messageApi]
  );

  const summary = useMemo(() => {
    const completed = orders.filter((order) => order.status === OrderStatus.COMPLETED).length;
    const cancelled = orders.filter((order) => order.status === OrderStatus.CANCELLED).length;
    const totalRequired = orders.reduce(
      (acc, order) =>
        acc + (order.ordersItems || []).reduce((inner, item) => inner + Number(item.quantity_ordered || 0), 0),
      0
    );
    const totalActual = orders.reduce(
      (acc, order) =>
        acc +
        (order.ordersItems || []).reduce(
          (inner, item) => inner + Number(item.ordersDetail?.actual_quantity || 0),
          0
        ),
      0
    );

    return { completed, cancelled, totalRequired, totalActual };
  }, [orders]);

  const tabCounts = useMemo(
    () => ({
      all: total,
      [OrderStatus.COMPLETED]:
        statusFilter === OrderStatus.COMPLETED ? total : summary.completed,
      [OrderStatus.CANCELLED]:
        statusFilter === OrderStatus.CANCELLED ? total : summary.cancelled,
    }),
    [statusFilter, summary.cancelled, summary.completed, total]
  );

  if (authLoading || permissionLoading) {
    return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์..." />;
  }

  if (!user || !canViewOrders) {
    return (
      <AccessGuardFallback
        message="คุณไม่มีสิทธิ์เข้าถึงประวัติใบสั่งซื้อของสต็อก"
        tone="danger"
      />
    );
  }

  const isInitialLoading = loading && !hasLoadedRef.current;

  return (
    <div className="stock-history-page-shell">
      <POSSharedStyles />
      <HistoryPageStyle />

      <UIPageHeader
        title="ประวัติใบสั่งซื้อ"
        icon={<HistoryOutlined />}
        actions={
          <div className="stock-history-header-actions">
            <Button
              icon={refreshing ? <SyncOutlined spin /> : <ReloadOutlined />}
              onClick={() => void fetchHistory({ silent: true })}
              loading={loading && !hasLoadedRef.current}
            >
              รีเฟรช
            </Button>
          </div>
        }
      />

      <PageContainer maxWidth={1440}>
        <div className="stock-order-layout">
          <main className="stock-order-main">
            <PageStack gap={16}>
              <POSCategoryFilterBar
                categories={historyCategories}
                searchQuery={searchText}
                selectedCategory={statusFilter}
                onSearchChange={(value) => {
                  setPage(1);
                  setSearchText(value);
                }}
                onSelectCategory={(categoryId) => {
                  setPage(1);
                  setStatusFilter((categoryId as HistoryStatusFilter) || "all");
                }}
                showSearch={false}
              />

        <PageSection title="รายการย้อนหลัง" extra={<Text strong>{total.toLocaleString()} รายการ</Text>}>
          {refreshError ? (
            <div className="stock-history-feedback stock-history-feedback-danger">
              <Text>{refreshError}</Text>
            </div>
          ) : null}

          {isInitialLoading ? (
            <div className="stock-history-list">
              {[1, 2, 3].map((value) => (
                <div key={value} className="stock-history-card">
                  <Skeleton active paragraph={{ rows: 3 }} />
                </div>
              ))}
            </div>
          ) : error ? (
            <PageState
              status="error"
              title={error}
              onRetry={() => void fetchHistory()}
            />
          ) : orders.length === 0 ? (
            <PageState
              status="empty"
              title="ยังไม่มีประวัติใบสั่งซื้อ"
              description={
                deferredSearchText
                  ? "ลองเปลี่ยนคำค้นหาหรือสถานะที่ต้องการดู"
                  : "เมื่อมีรายการที่เสร็จสิ้นหรือยกเลิกแล้ว ระบบจะแสดงที่นี่"
              }
            />
          ) : (
            <>
              <div className="stock-history-list">
                {orders.map((order, index) => (
                  <HistoryOrderCard
                    key={order.id}
                    order={order}
                    index={index}
                    canDeleteOrders={canDeleteOrders}
                    isMobile={isMobile}
                    onView={(target) => setViewingOrder(target)}
                    onDelete={deleteOrder}
                  />
                ))}
              </div>

              <div className="pos-pagination-container" style={{ ...posLayoutStyles.paginationContainer, position: 'relative', marginTop: 16 }}>
                <div className="pos-pagination-total" style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)' }}>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    แสดง {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} จาก{" "}
                    {total.toLocaleString()} รายการ
                  </Text>
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
            </PageStack>
          </main>
        </div>
      </PageContainer>

      <OrderDetailModal
        open={Boolean(viewingOrder)}
        order={viewingOrder}
        onClose={() => setViewingOrder(null)}
      />
    </div>
  );
}
