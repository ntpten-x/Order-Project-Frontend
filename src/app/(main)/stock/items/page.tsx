"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  App,
  Badge,
  Button,
  Card,
  Empty,
  Grid,
  List,
  Modal,
  Pagination,
  Radio,
  Segmented,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  CheckSquareOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  EyeOutlined,
  HistoryOutlined,
  PrinterOutlined,
  ReloadOutlined,
  ShoppingCartOutlined,
  SyncOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";

import { AccessGuardFallback } from "../../../../components/pos/AccessGuard";
import EditOrderModal from "../../../../components/stock/EditOrderModal";
import OrderDetailModal from "../../../../components/stock/OrderDetailModal";
import { StatsGroup } from "../../../../components/ui/card/StatsGroup";
import { SearchInput } from "../../../../components/ui/input/SearchInput";
import PageContainer from "../../../../components/ui/page/PageContainer";
import UIPageHeader from "../../../../components/ui/page/PageHeader";
import PageSection from "../../../../components/ui/page/PageSection";
import PageStack from "../../../../components/ui/page/PageStack";
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

const { Text, Title } = Typography;

type OrderFilterStatus = "all" | OrderStatus;
type SortCreated = "old" | "new";
type StockOrderPrintMode = "a4" | "receipt";
type ReceiptPaperPreset = Extract<PrintPreset, "thermal_58mm" | "thermal_80mm">;

const PAGE_SIZE_OPTIONS = [8, 12, 20, 50];

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

function getOrderLineCount(order: Order): number {
  return order.ordersItems?.length || 0;
}

function getOrderQuantity(order: Order): number {
  return (order.ordersItems || []).reduce(
    (sum, item) => sum + Number(item.quantity_ordered || 0),
    0
  );
}

function getStatusMeta(status: OrderStatus): { color: string; label: string; icon: React.ReactNode } {
  if (status === OrderStatus.COMPLETED) {
    return { color: "success", label: "เสร็จสิ้น", icon: <CheckSquareOutlined /> };
  }
  if (status === OrderStatus.CANCELLED) {
    return { color: "error", label: "ยกเลิก", icon: <CloseCircleOutlined /> };
  }
  return { color: "processing", label: "รอดำเนินการ", icon: <ClockCircleOutlined /> };
}

function renderStatusTag(status: OrderStatus) {
  const meta = getStatusMeta(status);
  return (
    <Tag color={meta.color} icon={meta.icon} className="stock-items-status-tag">
      {meta.label}
    </Tag>
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

      if (silent) setRefreshing(true);
      else {
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
          caughtError instanceof Error ? caughtError.message : "โหลดรายการใบซื้อไม่สำเร็จ";
        if (silent && orderCountRef.current > 0) setRefreshError(nextMessage);
        else setError(caughtError);
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
        messageApi.error("คุณไม่มีสิทธิ์ยกเลิกใบซื้อ");
        return;
      }
      Modal.confirm({
        title: `ยกเลิกใบซื้อ ${getOrderCode(order.id)}`,
        content: "ต้องการยกเลิกใบซื้อนี้ใช่หรือไม่",
        okText: "ยืนยันยกเลิก",
        okButtonProps: { danger: true },
        cancelText: "ปิด",
        onOk: async () => {
          try {
            await ordersService.updateStatus(order.id, OrderStatus.CANCELLED, undefined, csrfToken);
            messageApi.success("ยกเลิกใบซื้อแล้ว");
            void loadOrders({ silent: true });
          } catch (caughtError) {
            messageApi.error(
              caughtError instanceof Error ? caughtError.message : "ยกเลิกใบซื้อไม่สำเร็จ"
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

  const metrics = useMemo(
    () => [
      {
        label: "เอกสารทั้งหมด",
        value: total.toLocaleString(),
        color: "#0f172a",
        subLabel: "ตามตัวกรองที่เลือก",
      },
      {
        label: "เอกสารบนหน้านี้",
        value: orders.length.toLocaleString(),
        color: "#1d4ed8",
        subLabel: `หน้า ${page} จาก ${Math.max(lastPage, 1)}`,
      },
      {
        label: "รายการย่อยบนหน้านี้",
        value: orders.reduce((sum, order) => sum + getOrderLineCount(order), 0).toLocaleString(),
        color: "#7c3aed",
        subLabel: "จำนวนบรรทัดวัตถุดิบ",
      },
      {
        label: "หน่วยที่ต้องซื้อ",
        value: orders.reduce((sum, order) => sum + getOrderQuantity(order), 0).toLocaleString(),
        color: "#15803d",
        subLabel: `คิวรอดำเนินการ ${
          orders.filter((order) => order.status === OrderStatus.PENDING).length
        } ใบ`,
      },
    ],
    [lastPage, orders, page, total]
  );

  const renderActions = useCallback(
    (order: Order) => (
      <Space wrap size={8}>
        <Button
          className="stock-items-action-button"
          icon={<EyeOutlined />}
          onClick={() => setViewingOrder(order)}
          data-testid={`stock-order-view-${order.id}`}
        >
          ดู
        </Button>
        <Button
          className="stock-items-action-button"
          icon={<PrinterOutlined />}
          onClick={() => openPrintModal(order)}
          data-testid={`stock-order-print-${order.id}`}
        >
          พิมพ์
        </Button>
        <Button
          className="stock-items-action-button"
          icon={<EditOutlined />}
          onClick={() => setEditingOrder(order)}
          disabled={!canUpdateOrders || order.status !== OrderStatus.PENDING}
          data-testid={`stock-order-edit-${order.id}`}
        >
          แก้ไข
        </Button>
        <Button
          type="primary"
          className="stock-items-action-button"
          icon={<CheckSquareOutlined />}
          onClick={() => router.push(`/stock/buying?orderId=${order.id}`)}
          disabled={!canUpdateOrders || order.status !== OrderStatus.PENDING}
          data-testid={`stock-order-receive-${order.id}`}
        >
          ตรวจรับ
        </Button>
        {canUpdateOrders ? (
          <Button
            danger
            className="stock-items-action-button"
            icon={<CloseCircleOutlined />}
            onClick={() => cancelOrder(order)}
            disabled={order.status !== OrderStatus.PENDING}
            data-testid={`stock-order-cancel-${order.id}`}
          >
            ยกเลิก
          </Button>
        ) : null}
      </Space>
    ),
    [canUpdateOrders, cancelOrder, openPrintModal, router]
  );

  const columns = useMemo<ColumnsType<Order>>(
    () => [
      {
        title: "ใบซื้อ",
        key: "id",
        width: 180,
        render: (_, record) => (
          <Space direction="vertical" size={2}>
            <Text strong>{getOrderCode(record.id)}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {formatDateTime(record.create_date)}
            </Text>
          </Space>
        ),
      },
      {
        title: "ผู้สร้าง",
        dataIndex: "ordered_by",
        key: "ordered_by",
        width: 180,
        render: (orderedBy: Order["ordered_by"]) => (
          <Space direction="vertical" size={0}>
            <Text>{orderedBy?.name || orderedBy?.username || "-"}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {orderedBy?.username ? `@${orderedBy.username}` : "ไม่มีชื่อผู้ใช้"}
            </Text>
          </Space>
        ),
      },
      {
        title: "รายการ",
        key: "items",
        render: (_, record) => {
          const preview = (record.ordersItems || []).slice(0, 3);
          return (
            <Space direction="vertical" size={6}>
              <Text>
                {getOrderLineCount(record)} รายการ • {getOrderQuantity(record)} หน่วย
              </Text>
              <Space wrap size={[6, 6]}>
                {preview.map((item) => (
                  <Tag key={item.id} className="stock-items-preview-tag">
                    {item.ingredient?.display_name || "-"}
                  </Tag>
                ))}
                {getOrderLineCount(record) > preview.length ? (
                  <Tag className="stock-items-preview-tag">
                    +{getOrderLineCount(record) - preview.length} รายการ
                  </Tag>
                ) : null}
              </Space>
            </Space>
          );
        },
      },
      {
        title: "สถานะ",
        dataIndex: "status",
        key: "status",
        width: 130,
        render: (status: OrderStatus) => renderStatusTag(status),
      },
      {
        title: "การจัดการ",
        key: "actions",
        width: 360,
        render: (_, record) => renderActions(record),
      },
    ],
    [renderActions]
  );

  if (permissionsLoading) {
    return <PageState status="loading" title="กำลังตรวจสอบสิทธิ์การใช้งาน" />;
  }
  if (!canViewOrders) {
    return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงคิวใบซื้อของสต๊อก" tone="danger" />;
  }

  return (
    <div className="stock-items-page-shell" data-testid="stock-orders-page">
      <ItemsPageStyle />

      <UIPageHeader
        title="คิวใบซื้อสต๊อก"
        subtitle={
          lastSyncedAt
            ? `อัปเดตล่าสุด ${formatDateTime(lastSyncedAt.toISOString())}`
            : "ติดตามใบซื้อที่ต้องตรวจรับในหน้าจอเดียว"
        }
        icon={<UnorderedListOutlined />}
        actions={
          <Space wrap>
            <Button icon={<HistoryOutlined />} onClick={() => router.push("/stock/history")}>
              ประวัติ
            </Button>
            <Button
              icon={refreshing ? <SyncOutlined spin /> : <ReloadOutlined />}
              onClick={() => void loadOrders({ silent: true })}
              loading={loading && !hasLoadedRef.current}
            >
              รีเฟรช
            </Button>
          </Space>
        }
      />

      <PageContainer maxWidth={1440}>
        <PageStack gap={16}>
          <section className="stock-items-hero">
            <div className="stock-items-hero-copy">
              <Badge
                status={refreshing ? "processing" : "success"}
                text={refreshing ? "กำลังซิงก์ข้อมูลล่าสุด" : "ข้อมูลคิวอัปเดตแบบเรียลไทม์"}
              />
              <Title level={3} style={{ margin: "10px 0 6px" }}>
                ตรวจรับต่อ แก้ไข หรือพิมพ์ใบซื้อได้ทันที
              </Title>
              <Text type="secondary">
                ลดการโหลดซ้ำเกินจำเป็นและจัดลำดับ action สำคัญให้ชัดเจนบนทุกขนาดหน้าจอ
              </Text>
            </div>
            <div className="stock-items-hero-side">
              <StatsGroup stats={metrics} />
            </div>
          </section>

          <PageSection title="รายการใบซื้อ">
            <div className="stock-items-toolbar">
              <div className="stock-items-toolbar-main">
                <div className="stock-items-search" data-testid="stock-orders-search">
                  <SearchInput
                    value={searchText}
                    onChange={(value) => {
                      setSearchText(value);
                      setPage(1);
                    }}
                    onClear={() => {
                      setSearchText("");
                      setPage(1);
                    }}
                    placeholder="ค้นหารหัสใบซื้อ ผู้สร้าง หมายเหตุ หรือชื่อวัตถุดิบ"
                  />
                </div>
                <Segmented<OrderFilterStatus>
                  value={statusFilter}
                  onChange={(value) => {
                    setStatusFilter(value);
                    setPage(1);
                  }}
                  options={[
                    { label: "รอดำเนินการ", value: OrderStatus.PENDING },
                    { label: "เสร็จสิ้น", value: OrderStatus.COMPLETED },
                    { label: "ยกเลิก", value: OrderStatus.CANCELLED },
                    { label: "ทั้งหมด", value: "all" },
                  ]}
                  className="stock-items-segmented"
                />
              </div>

              <div className="stock-items-toolbar-secondary">
                <Segmented<SortCreated>
                  value={sortCreated}
                  onChange={(value) => {
                    setSortCreated(value);
                    setPage(1);
                  }}
                  options={[
                    { label: "ใหม่ก่อน", value: "new" },
                    { label: "เก่าก่อน", value: "old" },
                  ]}
                  className="stock-items-segmented stock-items-segmented-compact"
                />
                <Segmented<number>
                  value={pageSize}
                  onChange={(value) => {
                    setPageSize(value);
                    setPage(1);
                  }}
                  options={PAGE_SIZE_OPTIONS.map((value) => ({
                    label: `${value}/หน้า`,
                    value,
                  }))}
                  className="stock-items-segmented stock-items-segmented-compact"
                />
              </div>
            </div>

            {refreshError ? (
              <div className="stock-items-refresh-error">
                <Text>{refreshError}</Text>
              </div>
            ) : null}

            {loading && !hasLoadedRef.current ? (
              <PageState status="loading" title="กำลังโหลดคิวใบซื้อ" />
            ) : error ? (
              <PageState status="error" title="โหลดคิวใบซื้อไม่สำเร็จ" error={error} onRetry={() => void loadOrders()} />
            ) : orders.length === 0 ? (
              <div className="stock-items-empty-card">
                <PageState
                  status="empty"
                  title="ไม่พบใบซื้อในตัวกรองนี้"
                  description="ลองเปลี่ยนสถานะ คำค้นหา หรือกลับไปสร้างใบซื้อใหม่"
                  action={
                    canCreateOrders ? (
                      <Button type="primary" icon={<ShoppingCartOutlined />} onClick={() => router.push("/stock")}>
                        ไปจดรายการซื้อ
                      </Button>
                    ) : null
                  }
                />
              </div>
            ) : isMobile ? (
              <List
                dataSource={orders}
                split={false}
                renderItem={(order) => (
                  <List.Item style={{ padding: 0 }}>
                    <Card className="stock-items-card" bordered={false}>
                      <div className="stock-items-card-head">
                        <div>
                          <Text strong>{getOrderCode(order.id)}</Text>
                          <div className="stock-items-card-subtitle">
                            {formatDateTime(order.create_date)}
                          </div>
                        </div>
                        {renderStatusTag(order.status)}
                      </div>

                      <div className="stock-items-card-meta">
                        <div>
                          <Text type="secondary">ผู้สร้าง</Text>
                          <div>{order.ordered_by?.name || order.ordered_by?.username || "-"}</div>
                        </div>
                        <div>
                          <Text type="secondary">สรุปรายการ</Text>
                          <div>
                            {getOrderLineCount(order)} รายการ • {getOrderQuantity(order)} หน่วย
                          </div>
                        </div>
                      </div>

                      <div className="stock-items-card-tags">
                        {(order.ordersItems || []).slice(0, 3).map((item) => (
                          <Tag key={item.id} className="stock-items-preview-tag">
                            {item.ingredient?.display_name || "-"}
                          </Tag>
                        ))}
                      </div>

                      {order.remark ? (
                        <div className="stock-items-card-remark">
                          <Text type="secondary">หมายเหตุ</Text>
                          <div>{order.remark}</div>
                        </div>
                      ) : null}

                      <div className="stock-items-card-actions">{renderActions(order)}</div>
                    </Card>
                  </List.Item>
                )}
              />
            ) : (
              <div className="stock-items-table-wrap">
                <Table
                  rowKey="id"
                  dataSource={orders}
                  columns={columns}
                  pagination={false}
                  scroll={{ x: 1080 }}
                  className="items-table"
                  locale={{
                    emptyText: <Empty description="ไม่มีข้อมูล" image={Empty.PRESENTED_IMAGE_SIMPLE} />,
                  }}
                />
              </div>
            )}

            {!loading && orders.length > 0 ? (
              <div className="stock-items-pagination">
                <div className="stock-items-pagination-summary">
                  แสดง {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} จาก {total.toLocaleString()} รายการ
                </div>
                <Pagination
                  current={page}
                  pageSize={pageSize}
                  total={total}
                  showSizeChanger={false}
                  onChange={(nextPage) => setPage(nextPage)}
                />
              </div>
            ) : null}
          </PageSection>
        </PageStack>
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
        <Space direction="vertical" size={14} style={{ width: "100%" }}>
          <Text type="secondary">
            {printingOrder ? `ใบสั่งซื้อ ${getOrderCode(printingOrder.id)}` : "เลือกรูปแบบการพิมพ์"}
          </Text>
          <Radio.Group value={printMode} onChange={(event) => setPrintMode(event.target.value as StockOrderPrintMode)}>
            <Space direction="vertical" size={10}>
              <Radio value="receipt">สำหรับเครื่องพิมพ์ใบเสร็จ</Radio>
              <Radio value="a4">สำหรับเครื่องพิมพ์ปกติ (A4)</Radio>
            </Space>
          </Radio.Group>
          {printMode === "receipt" ? (
            <div>
              <Text strong>เลือกหน้ากว้างกระดาษใบเสร็จ</Text>
              <Radio.Group
                value={receiptPaperPreset}
                onChange={(event) => setReceiptPaperPreset(event.target.value as ReceiptPaperPreset)}
                style={{ display: "block", marginTop: 8 }}
              >
                <Space direction="vertical" size={10}>
                  <Radio value="thermal_58mm">58mm</Radio>
                  <Radio value="thermal_80mm">80mm</Radio>
                </Space>
              </Radio.Group>
            </div>
          ) : null}
        </Space>
      </Modal>
    </div>
  );
}
