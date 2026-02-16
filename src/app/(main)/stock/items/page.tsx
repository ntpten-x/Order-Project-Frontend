"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  App,
  Button,
  Card,
  Col,
  Empty,
  Grid,
  List,
  Modal,
  Row,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  CheckSquareOutlined,
  CloseCircleOutlined,
  EditOutlined,
  EyeOutlined,
  PrinterOutlined,
  ReloadOutlined,
  ShoppingCartOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { Order, OrderStatus } from "../../../../types/api/stock/orders";
import EditOrderModal from "../../../../components/stock/EditOrderModal";
import OrderDetailModal from "../../../../components/stock/OrderDetailModal";
import { useSocket } from "../../../../hooks/useSocket";
import { LegacyRealtimeEvents, RealtimeEvents } from "../../../../utils/realtimeEvents";
import { authService } from "../../../../services/auth.service";
import { useAuth } from "../../../../contexts/AuthContext";
import { useEffectivePermissions } from "../../../../hooks/useEffectivePermissions";
import UIPageHeader from "../../../../components/ui/page/PageHeader";
import PageContainer from "../../../../components/ui/page/PageContainer";
import PageSection from "../../../../components/ui/page/PageSection";
import PageStack from "../../../../components/ui/page/PageStack";
import PageState from "../../../../components/ui/states/PageState";

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

function statusTag(status: OrderStatus): React.ReactNode {
  if (status === OrderStatus.COMPLETED) return <Tag color="success">เสร็จสิ้น</Tag>;
  if (status === OrderStatus.CANCELLED) return <Tag color="error">ยกเลิก</Tag>;
  return <Tag color="warning">รอดำเนินการ</Tag>;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export default function StockOrdersQueuePage() {
  const { message: messageApi } = App.useApp();
  const router = useRouter();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const { socket } = useSocket();
  const { user } = useAuth();
  const { can } = useEffectivePermissions({ enabled: Boolean(user?.id) });
  const canUpdateOrders = can("stock.orders.page", "update");

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [csrfToken, setCsrfToken] = useState("");
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/stock/orders?status=pending&sort_created=new", {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("โหลดรายการใบซื้อไม่สำเร็จ");
      const payload = await response.json();
      setOrders(Array.isArray(payload) ? payload : payload?.data || []);
    } catch (caughtError) {
      const message = (caughtError as Error)?.message || "โหลดรายการใบซื้อไม่สำเร็จ";
      setError(message);
      messageApi.error(message);
    } finally {
      setLoading(false);
    }
  }, [messageApi]);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

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
    if (!socket) return;

    const refresh = () => {
      void fetchOrders();
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
  }, [socket, fetchOrders]);

  const cancelOrder = (order: Order) => {
    if (!canUpdateOrders) {
      messageApi.error("คุณไม่มีสิทธิ์ยกเลิกใบซื้อ");
      return;
    }
    Modal.confirm({
      title: `ยกเลิกใบซื้อ #${order.id.slice(0, 8).toUpperCase()}`,
      content: "ต้องการยกเลิกใบซื้อนี้ใช่หรือไม่",
      okText: "ยืนยันยกเลิก",
      okButtonProps: { danger: true },
      cancelText: "ปิด",
      onOk: async () => {
        try {
          const response = await fetch(`/api/stock/orders/${order.id}/status`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "X-CSRF-Token": csrfToken,
            },
            body: JSON.stringify({ status: OrderStatus.CANCELLED }),
          });
          if (!response.ok) throw new Error("ยกเลิกใบซื้อไม่สำเร็จ");
          messageApi.success("ยกเลิกใบซื้อแล้ว");
          void fetchOrders();
        } catch {
          messageApi.error("ยกเลิกใบซื้อไม่สำเร็จ");
        }
      },
    });
  };

  const printOrderToPdf = useCallback((order: Order) => {
    const popup = window.open("", "_blank", "width=960,height=720");
    if (!popup) {
      messageApi.error("เบราว์เซอร์บล็อกหน้าต่างพิมพ์ กรุณาอนุญาตป๊อปอัป");
      return;
    }

    const createdAt = formatDateTime(order.create_date);
    const orderedBy = order.ordered_by?.name || order.ordered_by?.username || "-";
    const printAt = new Date().toLocaleString("th-TH", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const safeRemark = escapeHtml(order.remark?.trim() || "-");
    const orderCode = `#${order.id.slice(0, 8).toUpperCase()}`;
    const rows = (order.ordersItems || [])
      .map((item, index) => {
        const name = escapeHtml(item.ingredient?.display_name || item.ingredient?.ingredient_name || "-");
        const unit = escapeHtml(item.ingredient?.unit?.display_name || item.ingredient?.unit?.unit_name || "หน่วย");
        const quantity = Number(item.quantity_ordered || 0);
        return `
          <tr>
            <td class="center">${index + 1}</td>
            <td>${name}</td>
            <td class="center">${quantity.toLocaleString()}</td>
            <td class="center">${unit}</td>
          </tr>
        `;
      })
      .join("");

    const totalItems = (order.ordersItems || []).length;
    const totalQty = (order.ordersItems || []).reduce(
      (acc, item) => acc + Number(item.quantity_ordered || 0),
      0
    );

    const html = `
      <!DOCTYPE html>
      <html lang="th">
        <head>
          <meta charset="UTF-8" />
          <title>ใบสั่งซื้อ ${orderCode}</title>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              background: #eef2f7;
              font-family: "Tahoma", "Noto Sans Thai", sans-serif;
              color: #1f2937;
            }
            .sheet {
              width: 210mm;
              min-height: 297mm;
              margin: 10mm auto;
              background: #fff;
              padding: 14mm 12mm;
              border-radius: 10px;
              box-shadow: 0 8px 28px rgba(15, 23, 42, 0.14);
            }
            .header {
              display: flex;
              justify-content: space-between;
              gap: 12px;
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 10px;
            }
            .title {
              margin: 0;
              font-size: 26px;
              color: #0f172a;
            }
            .subtitle {
              margin-top: 4px;
              color: #475569;
              font-size: 13px;
            }
            .badge {
              align-self: flex-start;
              border: 1px solid #1d4ed8;
              color: #1d4ed8;
              padding: 8px 12px;
              border-radius: 8px;
              font-size: 12px;
              font-weight: 700;
              background: #eff6ff;
            }
            .meta {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 8px 14px;
              margin-top: 14px;
            }
            .meta-card {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 8px 10px;
            }
            .meta-label { color: #64748b; font-size: 12px; }
            .meta-value { margin-top: 2px; font-size: 14px; font-weight: 600; color: #0f172a; }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 14px;
              font-size: 13px;
            }
            thead th {
              background: #f1f5f9;
              border: 1px solid #cbd5e1;
              padding: 9px 8px;
              text-align: left;
              color: #0f172a;
            }
            td {
              border: 1px solid #e2e8f0;
              padding: 8px;
              vertical-align: top;
            }
            .center { text-align: center; }
            .summary {
              margin-top: 12px;
              display: flex;
              justify-content: flex-end;
            }
            .summary-box {
              width: 270px;
              border: 1px solid #dbeafe;
              background: #f8fbff;
              border-radius: 8px;
              padding: 8px 10px;
              font-size: 13px;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              padding: 4px 0;
            }
            .remarks {
              margin-top: 14px;
              border: 1px dashed #cbd5e1;
              background: #fcfdff;
              border-radius: 8px;
              padding: 10px;
              min-height: 58px;
            }
            .signatures {
              margin-top: 32px;
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 22px;
            }
            .sign-box {
              text-align: center;
              font-size: 12px;
              color: #475569;
            }
            .sign-line {
              border-bottom: 1px solid #94a3b8;
              margin: 0 auto 8px;
              width: 78%;
              height: 28px;
            }
            .footer {
              margin-top: 20px;
              border-top: 1px solid #e5e7eb;
              padding-top: 8px;
              font-size: 11px;
              color: #64748b;
              text-align: right;
            }
            @media print {
              body { background: #fff; }
              .sheet {
                margin: 0;
                border-radius: 0;
                box-shadow: none;
                width: auto;
                min-height: auto;
                padding: 8mm 6mm;
              }
            }
          </style>
        </head>
        <body>
          <main class="sheet">
            <header class="header">
              <div>
                <h1 class="title">ใบสั่งซื้อสินค้า (Stock)</h1>
                <div class="subtitle">เอกสารสำหรับจดรายการที่ต้องซื้อและตรวจรับภายหลัง</div>
              </div>
              <div class="badge">${escapeHtml(orderCode)}</div>
            </header>

            <section class="meta">
              <div class="meta-card">
                <div class="meta-label">วันที่สร้างเอกสาร</div>
                <div class="meta-value">${escapeHtml(createdAt)}</div>
              </div>
              <div class="meta-card">
                <div class="meta-label">ผู้สร้างใบสั่งซื้อ</div>
                <div class="meta-value">${escapeHtml(orderedBy)}</div>
              </div>
              <div class="meta-card">
                <div class="meta-label">สถานะใบสั่งซื้อ</div>
                <div class="meta-value">${escapeHtml(order.status === OrderStatus.PENDING ? "รอดำเนินการ" : order.status === OrderStatus.COMPLETED ? "เสร็จสิ้น" : "ยกเลิก")}</div>
              </div>
              <div class="meta-card">
                <div class="meta-label">พิมพ์เมื่อ</div>
                <div class="meta-value">${escapeHtml(printAt)}</div>
              </div>
            </section>

            <table>
              <thead>
                <tr>
                  <th class="center" style="width: 56px;">ลำดับ</th>
                  <th>รายการสินค้า</th>
                  <th class="center" style="width: 120px;">จำนวนที่ต้องซื้อ</th>
                  <th class="center" style="width: 110px;">หน่วย</th>
                </tr>
              </thead>
              <tbody>
                ${rows || `<tr><td colspan="4" class="center">ไม่มีรายการสินค้า</td></tr>`}
              </tbody>
            </table>

            <section class="summary">
              <div class="summary-box">
                <div class="summary-row"><span>จำนวนรายการทั้งหมด</span><strong>${totalItems.toLocaleString()} รายการ</strong></div>
                <div class="summary-row"><span>จำนวนหน่วยรวม</span><strong>${totalQty.toLocaleString()} หน่วย</strong></div>
              </div>
            </section>

            <section class="remarks">
              <div class="meta-label">หมายเหตุ</div>
              <div class="meta-value">${safeRemark}</div>
            </section>

            <section class="signatures">
              <div class="sign-box">
                <div class="sign-line"></div>
                ผู้จัดทำใบสั่งซื้อ
              </div>
              <div class="sign-box">
                <div class="sign-line"></div>
                ผู้ตรวจรับสินค้า
              </div>
            </section>

            <footer class="footer">เอกสารนี้จัดทำจากระบบจัดการคลังสินค้า</footer>
          </main>
          <script>
            window.addEventListener("load", () => {
              setTimeout(() => {
                window.print();
              }, 250);
            });
          </script>
        </body>
      </html>
    `;

    popup.document.open();
    popup.document.write(html);
    popup.document.close();
  }, [messageApi]);

  const metrics = useMemo(() => {
    const totalOrders = orders.length;
    const totalLines = orders.reduce((acc, order) => acc + Number(order.ordersItems?.length || 0), 0);
    const totalRequiredQty = orders.reduce(
      (acc, order) =>
        acc +
        (order.ordersItems || []).reduce((inner, item) => inner + Number(item.quantity_ordered || 0), 0),
      0
    );

    return { totalOrders, totalLines, totalRequiredQty };
  }, [orders]);

  const tableColumns = [
    {
      title: "รหัสใบซื้อ",
      key: "id",
      width: 150,
      render: (_: unknown, record: Order) => <Text strong>#{record.id.slice(0, 8).toUpperCase()}</Text>,
    },
    {
      title: "ผู้สร้าง",
      dataIndex: "ordered_by",
      key: "ordered_by",
      width: 180,
      render: (orderedBy: { name?: string; username?: string } | null) => (
        <Text>{orderedBy?.name || orderedBy?.username || "-"}</Text>
      ),
    },
    {
      title: "รายการ",
      key: "items",
      render: (_: unknown, record: Order) => {
        const lines = record.ordersItems?.length || 0;
        const qty = (record.ordersItems || []).reduce((acc, item) => acc + Number(item.quantity_ordered || 0), 0);
        return (
          <Space direction="vertical" size={0}>
            <Text>{lines.toLocaleString()} รายการ</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              รวม {qty.toLocaleString()} หน่วย
            </Text>
          </Space>
        );
      },
    },
    {
      title: "วันที่สร้าง",
      dataIndex: "create_date",
      key: "create_date",
      width: 180,
      render: (value: string) => <Text>{formatDateTime(value)}</Text>,
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (value: OrderStatus) => statusTag(value),
    },
    {
      title: "การจัดการ",
      key: "actions",
      width: 340,
      render: (_: unknown, record: Order) => (
        <Space wrap>
          <Tooltip title="ดูรายละเอียด">
            <Button icon={<EyeOutlined />} onClick={() => setViewingOrder(record)}>
              ดู
            </Button>
          </Tooltip>
          <Tooltip title="พิมพ์ใบสั่งซื้อ (PDF)">
            <Button icon={<PrinterOutlined />} onClick={() => printOrderToPdf(record)}>
              พิมพ์
            </Button>
          </Tooltip>
          <Tooltip title="แก้ไขรายการ">
            <Button
              icon={<EditOutlined />}
              onClick={() => setEditingOrder(record)}
              disabled={!canUpdateOrders || record.status !== OrderStatus.PENDING}
            >
              แก้ไข
            </Button>
          </Tooltip>
          <Tooltip title="ตรวจรับหลังซื้อ">
            <Button
              type="primary"
              icon={<CheckSquareOutlined />}
              onClick={() => router.push(`/stock/buying?orderId=${record.id}`)}
              disabled={!canUpdateOrders || record.status !== OrderStatus.PENDING}
            >
              ตรวจรับ
            </Button>
          </Tooltip>
          {canUpdateOrders ? (
            <Tooltip title="ยกเลิกใบซื้อ">
              <Button danger icon={<CloseCircleOutlined />} onClick={() => cancelOrder(record)}>
                ยกเลิก
              </Button>
            </Tooltip>
          ) : null}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f7f9fc", paddingBottom: 120 }}>
      <UIPageHeader
        title="รายการใบซื้อที่รอตรวจรับ"
        subtitle={`คิวที่ต้องดำเนินการ ${orders.length} ใบ`}
        icon={<UnorderedListOutlined />}
        actions={
          <Button icon={<ReloadOutlined />} onClick={() => void fetchOrders()} loading={loading}>
            รีเฟรช
          </Button>
        }
      />

      <PageContainer maxWidth={1400}>
        <PageStack gap={12}>
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={8}>
              <Card>
                <Text type="secondary">จำนวนใบซื้อ</Text>
                <Title level={4} style={{ margin: "6px 0 0" }}>{metrics.totalOrders.toLocaleString()}</Title>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Text type="secondary">จำนวนรายการทั้งหมด</Text>
                <Title level={4} style={{ margin: "6px 0 0", color: "#1677ff" }}>{metrics.totalLines.toLocaleString()}</Title>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Text type="secondary">จำนวนหน่วยที่ต้องซื้อ</Text>
                <Title level={4} style={{ margin: "6px 0 0", color: "#389e0d" }}>{metrics.totalRequiredQty.toLocaleString()}</Title>
              </Card>
            </Col>
          </Row>

          <PageSection title="คิวใบซื้อ">
            {loading ? (
              <PageState status="loading" title="กำลังโหลดรายการใบซื้อ" />
            ) : error ? (
              <PageState status="error" title={error} onRetry={() => void fetchOrders()} />
            ) : orders.length === 0 ? (
              <PageState
                status="empty"
                title="ไม่มีใบซื้อที่รอดำเนินการ"
                action={
                  <Button type="primary" icon={<ShoppingCartOutlined />} onClick={() => router.push("/stock")}> 
                    ไปจดรายการซื้อ
                  </Button>
                }
              />
            ) : isMobile ? (
              <List
                dataSource={orders}
                renderItem={(order) => {
                  const lines = order.ordersItems?.length || 0;
                  const qty = (order.ordersItems || []).reduce((acc, item) => acc + Number(item.quantity_ordered || 0), 0);
                  return (
                    <List.Item>
                      <Card style={{ width: "100%", borderRadius: 14 }}>
                        <Space direction="vertical" size={8} style={{ width: "100%" }}>
                          <Space wrap>
                            <Text strong>#{order.id.slice(0, 8).toUpperCase()}</Text>
                            {statusTag(order.status)}
                          </Space>
                          <Text type="secondary">ผู้สร้าง: {order.ordered_by?.name || order.ordered_by?.username || "-"}</Text>
                          <Text>{lines.toLocaleString()} รายการ | รวม {qty.toLocaleString()} หน่วย</Text>
                          <Text type="secondary">{formatDateTime(order.create_date)}</Text>
                          <Space wrap>
                            <Button size="small" icon={<EyeOutlined />} onClick={() => setViewingOrder(order)}>ดู</Button>
                            <Button size="small" icon={<PrinterOutlined />} onClick={() => printOrderToPdf(order)}>พิมพ์</Button>
                            <Button
                              size="small"
                              icon={<EditOutlined />}
                              onClick={() => setEditingOrder(order)}
                              disabled={!canUpdateOrders || order.status !== OrderStatus.PENDING}
                            >
                              แก้ไข
                            </Button>
                            <Button
                              size="small"
                              type="primary"
                              icon={<CheckSquareOutlined />}
                              onClick={() => router.push(`/stock/buying?orderId=${order.id}`)}
                              disabled={!canUpdateOrders || order.status !== OrderStatus.PENDING}
                            >
                              ตรวจรับ
                            </Button>
                          </Space>
                        </Space>
                      </Card>
                    </List.Item>
                  );
                }}
              />
            ) : (
              <Table
                rowKey="id"
                dataSource={orders}
                columns={tableColumns}
                pagination={{ pageSize: 10 }}
                scroll={{ x: 1024 }}
                locale={{
                  emptyText: <Empty description="ไม่มีข้อมูล" image={Empty.PRESENTED_IMAGE_SIMPLE} />,
                }}
              />
            )}
          </PageSection>
        </PageStack>
      </PageContainer>

      <EditOrderModal
        open={Boolean(editingOrder)}
        order={editingOrder}
        onClose={() => setEditingOrder(null)}
        onSuccess={() => void fetchOrders()}
      />

      <OrderDetailModal
        open={Boolean(viewingOrder)}
        order={viewingOrder}
        onClose={() => setViewingOrder(null)}
      />
    </div>
  );
}
