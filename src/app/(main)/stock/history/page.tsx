"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  App,
  Button,
  Card,
  Col,
  Row,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  DeleteOutlined,
  EyeOutlined,
  HistoryOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSocket } from "../../../../hooks/useSocket";
import { useAuth } from "../../../../contexts/AuthContext";
import { useEffectivePermissions } from "../../../../hooks/useEffectivePermissions";
import { authService } from "../../../../services/auth.service";
import { LegacyRealtimeEvents, RealtimeEvents } from "../../../../utils/realtimeEvents";
import { Order, OrderStatus } from "../../../../types/api/stock/orders";
import ListPagination, { CreatedSort } from "../../../../components/ui/pagination/ListPagination";
import { DEFAULT_CREATED_SORT, parseCreatedSort } from "../../../../lib/list-sort";
import UIPageHeader from "../../../../components/ui/page/PageHeader";
import PageContainer from "../../../../components/ui/page/PageContainer";
import PageSection from "../../../../components/ui/page/PageSection";
import PageStack from "../../../../components/ui/page/PageStack";
import PageState from "../../../../components/ui/states/PageState";
import OrderDetailModal from "../../../../components/stock/OrderDetailModal";

const { Text, Title } = Typography;

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

function getStatusTag(status: OrderStatus): React.ReactNode {
  if (status === OrderStatus.COMPLETED) return <Tag color="success">เสร็จสิ้น</Tag>;
  if (status === OrderStatus.CANCELLED) return <Tag color="error">ยกเลิก</Tag>;
  return <Tag color="warning">รอดำเนินการ</Tag>;
}

export default function StockHistoryPage() {
  const { message: messageApi, modal } = App.useApp();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initRef = useRef(false);

  const { socket } = useSocket();
  const { user } = useAuth();
  const { can } = useEffectivePermissions({ enabled: Boolean(user?.id) });
  const canDeleteOrders = can("stock.orders.page", "delete");

  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [createdSort, setCreatedSort] = useState<CreatedSort>(DEFAULT_CREATED_SORT);

  useEffect(() => {
    if (initRef.current) return;

    const pageParam = Number(searchParams.get("page") || "1");
    const limitParam = Number(searchParams.get("limit") || "10");
    const sortParam = searchParams.get("sort_created");

    setPage(Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1);
    setPageSize(Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 10);
    setCreatedSort(parseCreatedSort(sortParam));

    initRef.current = true;
  }, [searchParams]);

  useEffect(() => {
    if (!initRef.current) return;

    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));
    if (pageSize !== 10) params.set("limit", String(pageSize));
    if (createdSort !== DEFAULT_CREATED_SORT) params.set("sort_created", createdSort);

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [router, pathname, page, pageSize, createdSort]);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set("status", "completed,cancelled");
      params.set("page", String(page));
      params.set("limit", String(pageSize));
      params.set("sort_created", createdSort);

      const response = await fetch(`/api/stock/orders?${params.toString()}`, { cache: "no-store" });
      if (!response.ok) throw new Error("โหลดประวัติใบซื้อไม่สำเร็จ");

      const payload = await response.json();
      const data = Array.isArray(payload) ? payload : payload?.data || [];
      const totalCount = Array.isArray(payload) ? payload.length : Number(payload?.total || 0);

      setOrders(data);
      setTotal(totalCount);
    } catch {
      setError("โหลดประวัติใบซื้อไม่สำเร็จ");
      setOrders([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, createdSort]);

  useEffect(() => {
    if (!initRef.current) return;
    void fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    if (!socket) return;

    const refresh = () => {
      void fetchHistory();
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
  }, [socket, fetchHistory]);

  const deleteOrder = (order: Order) => {
    modal.confirm({
      title: `ลบใบซื้อ #${order.id.slice(0, 8).toUpperCase()}`,
      content: "การลบจะไม่สามารถกู้คืนได้ ต้องการดำเนินการต่อหรือไม่",
      okText: "ลบใบซื้อ",
      okButtonProps: { danger: true },
      cancelText: "ยกเลิก",
      onOk: async () => {
        try {
          const token = await authService.getCsrfToken();
          const response = await fetch(`/api/stock/orders/${order.id}`, {
            method: "DELETE",
            headers: { "X-CSRF-Token": token },
          });
          if (!response.ok) throw new Error("ลบใบซื้อไม่สำเร็จ");
          messageApi.success("ลบใบซื้อแล้ว");
          void fetchHistory();
        } catch {
          messageApi.error("ลบใบซื้อไม่สำเร็จ");
        }
      },
    });
  };

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

  return (
    <div style={{ minHeight: "100vh", background: "#f7f9fc", paddingBottom: 120 }}>
      <UIPageHeader
        title="ประวัติใบซื้อ"
        subtitle="รายการที่เสร็จสิ้นหรือยกเลิกแล้ว"
        icon={<HistoryOutlined />}
        actions={
          <Button icon={<ReloadOutlined />} onClick={() => void fetchHistory()} loading={loading}>
            รีเฟรช
          </Button>
        }
      />

      <PageContainer maxWidth={1300}>
        <PageStack gap={12}>
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Text type="secondary">ใบซื้อทั้งหมด</Text>
                <Title level={4} style={{ margin: "6px 0 0" }}>{total.toLocaleString()}</Title>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Text type="secondary">เสร็จสิ้น</Text>
                <Title level={4} style={{ margin: "6px 0 0", color: "#389e0d" }}>{summary.completed.toLocaleString()}</Title>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Text type="secondary">ยกเลิก</Text>
                <Title level={4} style={{ margin: "6px 0 0", color: "#cf1322" }}>{summary.cancelled.toLocaleString()}</Title>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Text type="secondary">สัดส่วนซื้อจริง/แผน</Text>
                <Title level={4} style={{ margin: "6px 0 0", color: "#1677ff" }}>
                  {summary.totalRequired > 0
                    ? `${Math.round((summary.totalActual / summary.totalRequired) * 100)}%`
                    : "-"}
                </Title>
              </Card>
            </Col>
          </Row>

          <PageSection
            title="รายการย้อนหลัง"
            extra={<Text strong>{total.toLocaleString()} รายการ</Text>}
          >
            {loading ? (
              <PageState status="loading" title="กำลังโหลดข้อมูล" />
            ) : error ? (
              <PageState status="error" title={error} onRetry={() => void fetchHistory()} />
            ) : orders.length === 0 ? (
              <PageState status="empty" title="ยังไม่มีประวัติใบซื้อ" />
            ) : (
              <>
                <Space direction="vertical" size={12} style={{ width: "100%" }}>
                  {orders.map((order) => {
                    const lineCount = order.ordersItems?.length || 0;
                    const required = (order.ordersItems || []).reduce(
                      (acc, item) => acc + Number(item.quantity_ordered || 0),
                      0
                    );
                    const actual = (order.ordersItems || []).reduce(
                      (acc, item) => acc + Number(item.ordersDetail?.actual_quantity || 0),
                      0
                    );

                    return (
                      <Card key={order.id} size="small" style={{ borderRadius: 14 }}>
                        <Row gutter={[12, 12]} align="middle">
                          <Col xs={24} md={14}>
                            <Space direction="vertical" size={2}>
                              <Space wrap>
                                <Text strong>#{order.id.slice(0, 8).toUpperCase()}</Text>
                                {getStatusTag(order.status)}
                              </Space>
                              <Text type="secondary">
                                ผู้สร้าง: {order.ordered_by?.name || order.ordered_by?.username || "-"}
                              </Text>
                              <Text type="secondary">วันที่สร้าง: {formatDateTime(order.create_date)}</Text>
                              <Space size={12}>
                                <Text style={{ fontSize: 12 }}>จำนวนรายการ {lineCount.toLocaleString()}</Text>
                                <Text style={{ fontSize: 12 }}>ต้องซื้อ {required.toLocaleString()}</Text>
                                <Text style={{ fontSize: 12, color: "#1677ff" }}>ซื้อจริง {actual.toLocaleString()}</Text>
                              </Space>
                            </Space>
                          </Col>
                          <Col xs={24} md={10}>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
                              <Button icon={<EyeOutlined />} onClick={() => setViewingOrder(order)}>
                                ดูรายละเอียด
                              </Button>
                              {canDeleteOrders ? (
                                <Button danger icon={<DeleteOutlined />} onClick={() => deleteOrder(order)}>
                                  ลบ
                                </Button>
                              ) : null}
                            </div>
                          </Col>
                        </Row>
                      </Card>
                    );
                  })}
                </Space>

                <div style={{ marginTop: 20 }}>
                  <ListPagination
                    page={page}
                    pageSize={pageSize}
                    total={total}
                    loading={loading}
                    onPageChange={setPage}
                    onPageSizeChange={(size) => {
                      setPage(1);
                      setPageSize(size);
                    }}
                    sortCreated={createdSort}
                    onSortCreatedChange={(nextSort) => {
                      setPage(1);
                      setCreatedSort(nextSort);
                    }}
                  />
                </div>
              </>
            )}
          </PageSection>
        </PageStack>
      </PageContainer>

      <OrderDetailModal
        open={Boolean(viewingOrder)}
        order={viewingOrder}
        onClose={() => setViewingOrder(null)}
      />
    </div>
  );
}
