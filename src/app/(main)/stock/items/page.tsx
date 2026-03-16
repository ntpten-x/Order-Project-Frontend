"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CheckSquareOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  EyeOutlined,
  PrinterOutlined,
  ReloadOutlined,
  ShoppingCartOutlined,
  SyncOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Modal,
  Radio,
  Segmented,
  Skeleton,
  Tag,
  Typography,
} from "antd";
import { useRouter } from "next/navigation";

import { AccessGuardFallback } from "../../../../components/pos/AccessGuard";
import EditOrderModal from "../../../../components/stock/EditOrderModal";
import OrderDetailModal from "../../../../components/stock/OrderDetailModal";
import { SearchInput } from "../../../../components/ui/input/SearchInput";
import ListPagination from "../../../../components/ui/pagination/ListPagination";
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
import { applyPresetToDocument } from "../../../../utils/print-settings/defaults";
import {
  closePrintWindow,
  getPrintSettings,
  primePrintResources,
  reservePrintWindow,
} from "../../../../utils/print-settings/runtime";
import { LegacyRealtimeEvents, RealtimeEvents } from "../../../../utils/realtimeEvents";
import { useDebouncedValue } from "../../../../utils/useDebouncedValue";
import { buildStockOrderPrintHtml } from "./print";
import ItemsPageStyle from "./style";

const { Text } = Typography;

type SortCreated = "old" | "new";
type StockOrderPrintMode = "a4" | "receipt";
type ReceiptPaperPreset = Extract<PrintPreset, "thermal_58mm" | "thermal_80mm">;

const ITEMS_PAGE_STATUS = OrderStatus.PENDING;

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

function getStatusMeta(status: OrderStatus): {
  label: string;
  color: string;
  background: string;
  borderColor: string;
} {
  if (status === OrderStatus.COMPLETED) {
    return {
      label: "เสร็จสมบูรณ์แล้ว",
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
    label: "กำลังดำเนินการ",
    color: "#b45309",
    background: "#fffbeb",
    borderColor: "#fde68a",
  };
}

type StockOrderCardProps = {
  order: Order;
  index: number;
  canUpdateOrders: boolean;
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
    <div
      className="stock-items-card-wrapper"
      style={{
        background: "#ffffff",
        borderRadius: 20,
        border: "1px solid #E2E8F0",
        boxShadow: "0 2px 12px rgba(15,23,42,0.04)",
        padding: "16px 20px",
        marginBottom: 16,
        overflow: "hidden",
        transition: "all 0.25s ease",
        animation: "stockItemsFadeInUp 0.35s ease both",
        animationDelay: `${index * 0.04}s`,
        cursor: "pointer",
      }}
      onClick={() => onView(order)}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 12,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#1E293B" }}>
              {getOrderCode(order.id)}
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "4px 10px",
                borderRadius: 20,
                background: statusMeta.background,
                color: statusMeta.color,
                fontSize: 12,
                fontWeight: 700,
                border: `1px solid ${statusMeta.borderColor}`,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: statusMeta.color,
                  display: "inline-block",
                }}
              />
              {statusMeta.label}
            </span>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, color: "#64748B", fontSize: 13 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <ClockCircleOutlined style={{ fontSize: 14 }} />
              {formatDateTime(order.create_date)}
            </span>
            <span>{formatTimeSince(order.create_date)}</span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 14,
            color: "#64748B",
            fontSize: 13,
            textAlign: "right",
          }}
        >
          <div>
            <span style={{ display: "block", fontWeight: 600, color: "#0F172A" }}>
              {getOrderLineCount(order)} รายการ
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 16,
          borderTop: "1px solid #F1F5F9",
          paddingTop: 12,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 8, color: "#64748B", fontSize: 13 }}>
            <span>ผู้สั่งซื้อ: {order.ordered_by?.name || order.ordered_by?.username || "-"}</span>
            <span>อัปเดตล่าสุด: {formatDateTime(order.update_date)}</span>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {previewItems.map((item) => (
              <Tag
                key={item.id}
                style={{
                  borderRadius: 8,
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  color: "#475569",
                  fontWeight: 500,
                  marginRight: 0,
                }}
              >
                {item.ingredient?.display_name || "-"} x{Number(item.quantity_ordered || 0)}
              </Tag>
            ))}
            {extraItems > 0 ? (
              <Tag
                style={{
                  borderRadius: 8,
                  background: "#EFF6FF",
                  border: "1px solid #DBEAFE",
                  color: "#2563EB",
                  fontWeight: 600,
                  marginRight: 0,
                }}
              >
                +{extraItems} รายการ
              </Tag>
            ) : null}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          borderTop: "1px solid #F1F5F9",
          paddingTop: 14,
        }}
      >
        {order.remark ? (
          <div style={{ flex: 1, color: "#64748B", fontSize: 13 }}>
            <span style={{ fontWeight: 600, color: "#475569", marginRight: 6 }}>หมายเหตุ:</span>
            {order.remark}
          </div>
        ) : (
          <div style={{ flex: 1 }} />
        )}

        <div
          style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}
          onClick={(event) => event.stopPropagation()}
        >
          <Button
            icon={<EyeOutlined />}
            onClick={() => onView(order)}
            style={{ borderRadius: 10 }}
            data-testid={`stock-order-view-${order.id}`}
          >
            ดู
          </Button>
          <Button
            icon={<PrinterOutlined />}
            onClick={() => onPrint(order)}
            style={{ borderRadius: 10 }}
            data-testid={`stock-order-print-${order.id}`}
          >
            พิมพ์
          </Button>
          <Button
            icon={<EditOutlined />}
            onClick={() => onEdit(order)}
            disabled={!canMutate}
            style={{ borderRadius: 10 }}
            data-testid={`stock-order-edit-${order.id}`}
          >
            แก้ไข
          </Button>
          <Button
            type="primary"
            icon={<CheckSquareOutlined />}
            onClick={() => onReceive(order)}
            disabled={!canMutate}
            style={{ borderRadius: 10, background: "#6366F1", borderColor: "#6366F1" }}
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
              style={{ borderRadius: 10 }}
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
  const [pageSize, setPageSize] = useState(10);
  const [sortCreated, setSortCreated] = useState<SortCreated>("new");
  const [searchText, setSearchText] = useState("");
  const debouncedSearch = useDebouncedValue(searchText.trim(), 250);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
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
        status: ITEMS_PAGE_STATUS,
      });
      if (debouncedSearch) {
        params.set("q", debouncedSearch);
      }

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
        setOrders(
          (Array.isArray(payload.data) ? payload.data : []).filter(
            (order) => order.status === ITEMS_PAGE_STATUS
          )
        );
        setTotal(payload.total);
        setRefreshError(null);
        setError(null);
      } catch (caughtError) {
        if ((caughtError as { name?: string })?.name === "AbortError") return;

        const nextMessage =
          caughtError instanceof Error ? caughtError.message : "โหลดคิวใบสั่งซื้อไม่สำเร็จ";

        if (silent && hasLoadedRef.current) {
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
    [debouncedSearch, page, pageSize, sortCreated]
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
        if (mounted) {
          messageApi.error("โหลดโทเคนความปลอดภัยไม่สำเร็จ");
        }
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, [messageApi]);

  const ensureCsrfToken = useCallback(async (): Promise<string> => {
    if (csrfToken) return csrfToken;

    const token = await authService.getCsrfToken();
    if (token) {
      setCsrfToken(token);
    }

    return token;
  }, [csrfToken]);

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
            const token = await ensureCsrfToken();
            await ordersService.updateStatus(order.id, OrderStatus.CANCELLED, undefined, token);
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
    [canUpdateOrders, ensureCsrfToken, loadOrders, messageApi]
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
              ...applyPresetToDocument(printSettings.documents.purchase_order, receiptPaperPreset),
              margin_top: 3,
              margin_right: 3,
              margin_bottom: 3,
              margin_left: 3,
              density: "compact" as const,
              line_spacing: 1.12,
              font_scale: Math.min(printSettings.documents.purchase_order.font_scale || 100, 100),
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
        title="รายการใบสั่งซื้อสต็อก"
        icon={<UnorderedListOutlined />}
        actions={
          <Button
            icon={refreshing ? <SyncOutlined spin /> : <ReloadOutlined />}
            onClick={() => void loadOrders({ silent: true })}
            loading={loading && !hasLoadedRef.current}
            data-testid="stock-orders-refresh"
          />
        }
      />

      <PageContainer maxWidth={1440}>
        <div className="stock-items-toolbar">
          <div style={{ width: "100%", maxWidth: 420 }} data-testid="stock-orders-search">
            <SearchInput
              placeholder="ค้นหาใบสั่งซื้อ"
              value={searchText}
              onChange={(value) => {
                setSearchText(value);
                setPage(1);
              }}
            />
          </div>
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
        </div>

        <PageSection title="รายการใบสั่งซื้อ" extra={<Text strong>{total.toLocaleString()} รายการ</Text>}>
          {refreshError ? (
            <div style={{ marginBottom: 16 }}>
              <Text>{refreshError}</Text>
            </div>
          ) : null}

          {isInitialLoading ? (
            <div className="stock-items-list">
              {[1, 2, 3].map((value) => (
                <div key={value}>
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
              description="เมื่อมีใบสั่งซื้อ ระบบจะแสดงรายการที่นี่"
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
                    onView={(target) => setViewingOrder(target)}
                    onPrint={openPrintModal}
                    onEdit={(target) => setEditingOrder(target)}
                    onReceive={(target) => router.push(`/stock/buying?orderId=${target.id}`)}
                    onCancel={cancelOrder}
                  />
                ))}
              </div>

              <div style={{ marginTop: 12 }}>
                <ListPagination
                  page={page}
                  pageSize={pageSize}
                  total={total}
                  loading={loading || refreshing}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                  activeColor="#0e7490"
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
        hideActualMetrics={true}
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
            {printingOrder
              ? `ใบสั่งซื้อ ${getOrderCode(printingOrder.id)}`
              : "เลือกรูปแบบการพิมพ์"}
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
