"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Alert,
  App,
  Avatar,
  Button,
  Card,
  Col,
  Empty,
  InputNumber,
  Modal,
  Row,
  Space,
  Spin,
  Switch,
  Tag,
  Typography,
} from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CheckSquareOutlined,
  ReloadOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../../../contexts/AuthContext";
import { useSocket } from "../../../../hooks/useSocket";
import { LegacyRealtimeEvents, RealtimeEvents } from "../../../../utils/realtimeEvents";
import { Order } from "../../../../types/api/stock/orders";
import { authService } from "../../../../services/auth.service";
import UIPageHeader from "../../../../components/ui/page/PageHeader";
import PageContainer from "../../../../components/ui/page/PageContainer";
import PageSection from "../../../../components/ui/page/PageSection";
import PageStack from "../../../../components/ui/page/PageStack";
import PageState from "../../../../components/ui/states/PageState";
import { resolveImageSource } from "../../../../utils/image/source";

const { Text, Title } = Typography;

interface PurchaseItemState {
  ingredient_id: string;
  display_name: string;
  unit_name: string;
  img_url?: string | null;
  ordered_quantity: number;
  actual_quantity: number;
  is_purchased: boolean;
}

function buildItems(order: Order | null): PurchaseItemState[] {
  if (!order?.ordersItems) return [];
  return order.ordersItems.map((item) => ({
    ingredient_id: item.ingredient_id,
    display_name: item.ingredient?.display_name || "-",
    unit_name: item.ingredient?.unit?.display_name || "หน่วย",
    img_url: item.ingredient?.img_url,
    ordered_quantity: Number(item.quantity_ordered || 0),
    actual_quantity: Number(item.ordersDetail?.actual_quantity ?? item.quantity_ordered ?? 0),
    is_purchased: Boolean(item.ordersDetail?.is_purchased),
  }));
}

export default function StockBuyingPage() {
  const { message: messageApi } = App.useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const { user } = useAuth();
  const { socket } = useSocket();

  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<PurchaseItemState[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [csrfToken, setCsrfToken] = useState("");

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/stock/orders/${orderId}`, { cache: "no-store" });
      if (!response.ok) throw new Error("โหลดข้อมูลใบซื้อไม่สำเร็จ");
      const payload = await response.json();
      setOrder(payload);
      setItems(buildItems(payload));
    } catch {
      messageApi.error("โหลดข้อมูลใบซื้อไม่สำเร็จ");
      setOrder(null);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [orderId, messageApi]);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }
    if (orderId) {
      void fetchOrder();
    }
  }, [user, router, orderId, fetchOrder]);

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
    if (!socket || !orderId) return;

    const refresh = (payload?: { id?: string; orderId?: string }) => {
      if (payload?.id && payload.id !== orderId) return;
      if (payload?.orderId && payload.orderId !== orderId) return;
      void fetchOrder();
    };
    const refreshLegacy = () => {
      void fetchOrder();
    };

    socket.on(RealtimeEvents.stockOrders.update, refresh);
    socket.on(RealtimeEvents.stockOrders.status, refresh);
    socket.on(RealtimeEvents.stockOrders.detailUpdate, refresh);
    socket.on(LegacyRealtimeEvents.stockOrdersUpdated, refreshLegacy);

    return () => {
      socket.off(RealtimeEvents.stockOrders.update, refresh);
      socket.off(RealtimeEvents.stockOrders.status, refresh);
      socket.off(RealtimeEvents.stockOrders.detailUpdate, refresh);
      socket.off(LegacyRealtimeEvents.stockOrdersUpdated, refreshLegacy);
    };
  }, [socket, orderId, fetchOrder]);

  const setPurchased = (ingredientId: string, checked: boolean) => {
    setItems((prev) =>
      prev.map((item) =>
        item.ingredient_id === ingredientId
          ? {
              ...item,
              is_purchased: checked,
              actual_quantity: checked ? item.actual_quantity : 0,
            }
          : item
      )
    );
  };

  const setActualQuantity = (ingredientId: string, value: number | null) => {
    const qty = Math.max(0, Number(value || 0));
    setItems((prev) =>
      prev.map((item) =>
        item.ingredient_id === ingredientId
          ? {
              ...item,
              actual_quantity: qty,
              is_purchased: qty > 0 ? true : item.is_purchased,
            }
          : item
      )
    );
  };

  const setMatchRequired = (ingredientId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.ingredient_id === ingredientId
          ? { ...item, actual_quantity: item.ordered_quantity, is_purchased: true }
          : item
      )
    );
  };

  const markAllAsPurchased = () => {
    setItems((prev) => prev.map((item) => ({ ...item, is_purchased: true, actual_quantity: item.ordered_quantity })));
  };

  const totals = useMemo(() => {
    const required = items.reduce((acc, item) => acc + item.ordered_quantity, 0);
    const actual = items.reduce((acc, item) => acc + (item.is_purchased ? item.actual_quantity : 0), 0);
    const matched = items.filter((item) => item.is_purchased && item.actual_quantity === item.ordered_quantity).length;
    const missing = items.filter((item) => item.is_purchased && item.actual_quantity < item.ordered_quantity).length;
    const over = items.filter((item) => item.is_purchased && item.actual_quantity > item.ordered_quantity).length;
    const selected = items.filter((item) => item.is_purchased).length;
    return { required, actual, matched, missing, over, selected };
  }, [items]);

  const confirmPurchase = async () => {
    if (!orderId || !user) return;

    setConfirming(true);
    try {
      const response = await fetch(`/api/stock/orders/${orderId}/purchase`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({
          purchased_by_id: user.id,
          items: items.map((item) => ({
            ingredient_id: item.ingredient_id,
            actual_quantity: item.is_purchased ? item.actual_quantity : 0,
            is_purchased: item.is_purchased,
          })),
        }),
      });

      if (!response.ok) throw new Error("ยืนยันการซื้อไม่สำเร็จ");
      messageApi.success("บันทึกผลการซื้อเรียบร้อย");
      setConfirmModalOpen(false);
      router.push("/stock/history");
    } catch {
      messageApi.error("ยืนยันการซื้อไม่สำเร็จ");
    } finally {
      setConfirming(false);
    }
  };

  if (!orderId) {
    return (
      <div style={{ minHeight: "100vh", background: "#f7f9fc" }}>
        <UIPageHeader
          title="ตรวจรับรายการซื้อ"
          subtitle="ไม่พบใบซื้อที่เลือก"
          icon={<CheckSquareOutlined />}
          onBack={() => router.push("/stock/items")}
        />
        <PageContainer>
          <PageSection>
            <PageState
              status="empty"
              title="กรุณาเลือกใบซื้อก่อน"
              action={
                <Button type="primary" onClick={() => router.push("/stock/items")}>
                  ไปหน้ารายการใบซื้อ
                </Button>
              }
            />
          </PageSection>
        </PageContainer>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f7f9fc", paddingBottom: 120 }}>
      <UIPageHeader
        title="ตรวจรับหลังซื้อ"
        subtitle={order ? `ใบซื้อ #${order.id.slice(0, 8).toUpperCase()}` : "กำลังโหลดข้อมูล"}
        icon={<CheckSquareOutlined />}
        onBack={() => router.push("/stock/items")}
        actions={
          <Space wrap>
            <Button icon={<ReloadOutlined />} onClick={() => void fetchOrder()} loading={loading}>
              รีเฟรช
            </Button>
            <Button icon={<CheckCircleOutlined />} onClick={markAllAsPurchased} disabled={items.length === 0}>
              ครบตามแผนทั้งหมด
            </Button>
          </Space>
        }
      />

      <PageContainer maxWidth={1300}>
        <PageStack gap={12}>
          {loading && !order ? (
            <PageSection>
              <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
                <Spin size="large" />
              </div>
            </PageSection>
          ) : !order ? (
            <PageSection>
              <PageState
                status="error"
                title="ไม่พบข้อมูลใบซื้อ"
                action={
                  <Button type="primary" onClick={() => router.push("/stock/items")} icon={<ArrowLeftOutlined />}>
                    กลับหน้ารายการ
                  </Button>
                }
              />
            </PageSection>
          ) : (
            <>
              <Row gutter={[12, 12]}>
                <Col xs={12} md={4}>
                  <Card size="small">
                    <Text type="secondary">ต้องซื้อ</Text>
                    <Title level={4} style={{ margin: "4px 0 0" }}>{totals.required.toLocaleString()}</Title>
                  </Card>
                </Col>
                <Col xs={12} md={4}>
                  <Card size="small">
                    <Text type="secondary">ซื้อจริง</Text>
                    <Title level={4} style={{ margin: "4px 0 0", color: "#1677ff" }}>{totals.actual.toLocaleString()}</Title>
                  </Card>
                </Col>
                <Col xs={12} md={4}>
                  <Card size="small">
                    <Text type="secondary">ตรงตามแผน</Text>
                    <Title level={4} style={{ margin: "4px 0 0", color: "#389e0d" }}>{totals.matched.toLocaleString()}</Title>
                  </Card>
                </Col>
                <Col xs={12} md={4}>
                  <Card size="small">
                    <Text type="secondary">ซื้อน้อยกว่า</Text>
                    <Title level={4} style={{ margin: "4px 0 0", color: "#d48806" }}>{totals.missing.toLocaleString()}</Title>
                  </Card>
                </Col>
                <Col xs={12} md={4}>
                  <Card size="small">
                    <Text type="secondary">ซื้อมากกว่า</Text>
                    <Title level={4} style={{ margin: "4px 0 0", color: "#531dab" }}>{totals.over.toLocaleString()}</Title>
                  </Card>
                </Col>
                <Col xs={12} md={4}>
                  <Card size="small">
                    <Text type="secondary">ยืนยันแล้ว</Text>
                    <Title level={4} style={{ margin: "4px 0 0" }}>{totals.selected.toLocaleString()}/{items.length.toLocaleString()}</Title>
                  </Card>
                </Col>
              </Row>

              <PageSection
                title="ตรวจรับรายสินค้า"
                extra={<Text strong>{items.length} รายการ</Text>}
              >
                <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
                  เปิดสวิตช์เมื่อมีการซื้อ และบันทึกจำนวนที่ซื้อจริง
                </Text>
                {items.length === 0 ? (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ไม่มีรายการในใบซื้อ" />
                ) : (
                  <Space direction="vertical" size={12} style={{ width: "100%" }}>
                    {items.map((item) => {
                      const diff = item.actual_quantity - item.ordered_quantity;
                      const diffTag = !item.is_purchased ? (
                        <Tag>ยังไม่ยืนยัน</Tag>
                      ) : diff === 0 ? (
                        <Tag color="success">ครบ</Tag>
                      ) : diff > 0 ? (
                        <Tag color="processing">เกิน {diff.toLocaleString()}</Tag>
                      ) : (
                        <Tag color="error">ขาด {Math.abs(diff).toLocaleString()}</Tag>
                      );

                      return (
                        <Card key={item.ingredient_id} size="small" style={{ borderRadius: 12 }}>
                          <Row gutter={[12, 12]} align="middle">
                            <Col xs={24} md={10}>
                              <Space>
                                <Avatar
                                  src={resolveImageSource(item.img_url) || undefined}
                                  shape="square"
                                  size={52}
                                  icon={<ShoppingCartOutlined />}
                                />
                                <Space direction="vertical" size={0}>
                                  <Text strong>{item.display_name}</Text>
                                  <Text type="secondary" style={{ fontSize: 12 }}>
                                    ต้องซื้อ {item.ordered_quantity.toLocaleString()} {item.unit_name}
                                  </Text>
                                </Space>
                              </Space>
                            </Col>
                            <Col xs={24} md={5}>
                              <Space>
                                <Switch
                                  checked={item.is_purchased}
                                  checkedChildren="ซื้อแล้ว"
                                  unCheckedChildren="ยังไม่ซื้อ"
                                  onChange={(checked) => setPurchased(item.ingredient_id, checked)}
                                />
                                {diffTag}
                              </Space>
                            </Col>
                            <Col xs={24} md={5}>
                              <InputNumber
                                min={0}
                                value={item.actual_quantity}
                                onChange={(value) => setActualQuantity(item.ingredient_id, value)}
                                disabled={!item.is_purchased}
                                style={{ width: "100%" }}
                                formatter={(value) => `${value}`.replace(/[^0-9.]/g, "")}
                                parser={(value) => value?.replace(/[^0-9.]/g, "") as unknown as number}
                                onKeyDown={(e) => {
                                  // Allow: backspace, delete, tab, escape, enter
                                  if (
                                    [8, 46, 9, 27, 13, 110, 190].indexOf(e.keyCode) !== -1 ||
                                    // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                                    (e.ctrlKey === true && [65, 67, 86, 88].indexOf(e.keyCode) !== -1) ||
                                    // Allow: home, end, left, right
                                    (e.keyCode >= 35 && e.keyCode <= 39)
                                  ) {
                                      // Special handling for decimal point (prevent multiple dots)
                                      if ((e.keyCode === 190 || e.keyCode === 110) && `${item.actual_quantity}`.includes('.')) {
                                          e.preventDefault();
                                      }
                                      return;
                                  }
                                  // Ensure that it is a number and stop the keypress
                                  if (
                                    (e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) &&
                                    (e.keyCode < 96 || e.keyCode > 105)
                                  ) {
                                    e.preventDefault();
                                  }
                                }}
                              />
                            </Col>
                            <Col xs={24} md={4}>
                              <Button block onClick={() => setMatchRequired(item.ingredient_id)}>
                                เท่าที่สั่ง
                              </Button>
                            </Col>
                          </Row>
                        </Card>
                      );
                    })}
                  </Space>
                )}
              </PageSection>

              <PageSection>
                <Alert
                  type="info"
                  showIcon
                  message="ก่อนยืนยันระบบจะบันทึกทุกรายการในใบซื้อ"
                  description="รายการที่ไม่เลือกซื้อจะถูกบันทึกเป็น ซื้อจริง = 0 และไม่ซื้อ"
                />
                <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    size="large"
                    onClick={() => setConfirmModalOpen(true)}
                    disabled={items.length === 0}
                  >
                    ยืนยันผลการซื้อ
                  </Button>
                </div>
              </PageSection>
            </>
          )}
        </PageStack>
      </PageContainer>

      <Modal
        open={confirmModalOpen}
        onCancel={() => setConfirmModalOpen(false)}
        onOk={() => void confirmPurchase()}
        confirmLoading={confirming}
        okText="ยืนยัน"
        cancelText="กลับไปแก้ไข"
        title="ยืนยันบันทึกผลการซื้อ"
      >
        <Space direction="vertical" size={8} style={{ width: "100%" }}>
          <Text>ระบบจะบันทึกข้อมูลต่อไปนี้:</Text>
          <Text>- จำนวนที่ต้องซื้อ: {totals.required.toLocaleString()} หน่วย</Text>
          <Text>- จำนวนที่ซื้อจริง: {totals.actual.toLocaleString()} หน่วย</Text>
          <Text>- รายการที่ยืนยันแล้ว: {totals.selected.toLocaleString()} / {items.length.toLocaleString()} รายการ</Text>
        </Space>
      </Modal>
    </div>
  );
}
