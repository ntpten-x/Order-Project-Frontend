"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Divider,
  Empty,
  InputNumber,
  Modal,
  Progress,
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
  MinusOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useRouter, useSearchParams } from "next/navigation";

import { AccessGuardFallback } from "../../../../components/pos/AccessGuard";
import StockImageThumb from "../../../../components/stock/StockImageThumb";
import PageContainer from "../../../../components/ui/page/PageContainer";
import UIPageHeader from "../../../../components/ui/page/PageHeader";
import PageSection from "../../../../components/ui/page/PageSection";
import PageState from "../../../../components/ui/states/PageState";
import { useAuth } from "../../../../contexts/AuthContext";
import { useEffectivePermissions } from "../../../../hooks/useEffectivePermissions";
import { useSocket } from "../../../../hooks/useSocket";
import { authService } from "../../../../services/auth.service";
import { ordersService } from "../../../../services/stock/orders.service";
import { Order, OrderStatus } from "../../../../types/api/stock/orders";
import { LegacyRealtimeEvents, RealtimeEvents } from "../../../../utils/realtimeEvents";
import StockBuyingPageStyle from "./style";

const { Text, Title } = Typography;

interface PurchaseItemState {
  ingredient_id: string;
  display_name: string;
  unit_label: string;
  img_url?: string | null;
  ordered_quantity: number;
  actual_quantity: number;
  is_purchased: boolean;
}

function areItemsEqual(left: PurchaseItemState[], right: PurchaseItemState[]): boolean {
  if (left.length !== right.length) return false;

  return left.every((item, index) => {
    const other = right[index];
    return (
      other &&
      item.ingredient_id === other.ingredient_id &&
      item.ordered_quantity === other.ordered_quantity &&
      item.actual_quantity === other.actual_quantity &&
      item.is_purchased === other.is_purchased
    );
  });
}

function mergeDraftItems(
  serverItems: PurchaseItemState[],
  draftItems: PurchaseItemState[]
): PurchaseItemState[] {
  const draftByIngredient = new Map(
    draftItems.map((item) => [item.ingredient_id, item] as const)
  );

  return serverItems.map((serverItem) => {
    const draftItem = draftByIngredient.get(serverItem.ingredient_id);
    if (!draftItem) return serverItem;

    return {
      ...serverItem,
      actual_quantity: draftItem.actual_quantity,
      is_purchased: draftItem.is_purchased,
    };
  });
}

function getOrderCode(id?: string): string {
  return id ? `#${id.slice(0, 8).toUpperCase()}` : "-";
}

function buildItems(order: Order | null): PurchaseItemState[] {
  if (!order?.ordersItems) return [];

  return order.ordersItems.map((item) => ({
    ingredient_id: item.ingredient_id,
    display_name: item.ingredient?.display_name || "-",
    unit_label: item.ingredient?.unit?.display_name || "หน่วย",
    img_url: item.ingredient?.img_url,
    ordered_quantity: Number(item.quantity_ordered || 0),
    actual_quantity: Number(item.ordersDetail?.actual_quantity ?? item.quantity_ordered ?? 0),
    is_purchased: Boolean(item.ordersDetail?.is_purchased),
  }));
}

function getDiffMeta(item: PurchaseItemState): {
  label: string;
  color: string;
  background: string;
  borderColor: string;
} {
  if (!item.is_purchased) {
    return {
      label: "ยังไม่ยืนยัน",
      color: "#64748b",
      background: "#f8fafc",
      borderColor: "#e2e8f0",
    };
  }

  const diff = item.actual_quantity - item.ordered_quantity;
  if (diff === 0) {
    return {
      label: "ตรงตามแผน",
      color: "#15803d",
      background: "#f0fdf4",
      borderColor: "#bbf7d0",
    };
  }

  if (diff > 0) {
    return {
      label: `เกิน ${diff.toLocaleString()}`,
      color: "#1d4ed8",
      background: "#eff6ff",
      borderColor: "#bfdbfe",
    };
  }

  return {
    label: `ขาด ${Math.abs(diff).toLocaleString()}`,
    color: "#b91c1c",
    background: "#fef2f2",
    borderColor: "#fecaca",
  };
}

export default function StockBuyingPage() {
  const { message: messageApi } = App.useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const requestRef = useRef<AbortController | null>(null);
  const refreshTimerRef = useRef<number | null>(null);
  const hasLoadedRef = useRef(false);
  const itemsRef = useRef<PurchaseItemState[]>([]);
  const serverItemsRef = useRef<PurchaseItemState[]>([]);
  const hasDraftChangesRef = useRef(false);

  const { user, loading: authLoading } = useAuth();
  const { socket } = useSocket();
  const { can, loading: permissionLoading } = useEffectivePermissions({
    enabled: Boolean(user?.id),
  });
  const canViewOrders = can("stock.orders.page", "view");
  const canUpdateOrders = can("stock.orders.page", "update");

  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<PurchaseItemState[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [csrfToken, setCsrfToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [hasDraftChanges, setHasDraftChanges] = useState(false);

  const isEditable = canUpdateOrders && order?.status === OrderStatus.PENDING;

  const syncDraftState = useCallback((nextItems: PurchaseItemState[]) => {
    itemsRef.current = nextItems;
    const nextHasDraftChanges = !areItemsEqual(nextItems, serverItemsRef.current);
    hasDraftChangesRef.current = nextHasDraftChanges;
    setHasDraftChanges(nextHasDraftChanges);
    setItems(nextItems);
  }, []);

  const fetchOrder = useCallback(
    async ({
      silent = false,
      preserveDraft = false,
    }: { silent?: boolean; preserveDraft?: boolean } = {}) => {
      if (!orderId || !canViewOrders) return;

      requestRef.current?.abort();
      const controller = new AbortController();
      requestRef.current = controller;

      try {
        if (silent && hasLoadedRef.current) {
          setRefreshing(true);
        } else {
          setLoading(true);
          setError(null);
        }

        const payload = await ordersService.getOrderById(orderId, undefined, {
          signal: controller.signal,
        });

        if (requestRef.current !== controller) return;

        const nextServerItems = buildItems(payload);
        serverItemsRef.current = nextServerItems;
        setOrder(payload);
        if (preserveDraft && hasDraftChangesRef.current && payload.status === OrderStatus.PENDING) {
          syncDraftState(mergeDraftItems(nextServerItems, itemsRef.current));
          setRefreshError("ข้อมูลใบสั่งซื้อถูกอัปเดตจากระบบระหว่างที่กำลังแก้ไข ร่างที่กรอกไว้ยังถูกเก็บไว้ กรุณาตรวจสอบก่อนยืนยัน");
        } else {
          syncDraftState(nextServerItems);
          setRefreshError(null);
        }
        hasLoadedRef.current = true;
      } catch (caughtError) {
        if ((caughtError as Error)?.name === "AbortError") return;
        if (requestRef.current !== controller) return;

        const nextMessage =
          caughtError instanceof Error ? caughtError.message : "โหลดข้อมูลใบซื้อไม่สำเร็จ";
        if (silent && hasLoadedRef.current) {
          setRefreshError(nextMessage);
        } else {
          setError(nextMessage);
          setOrder(null);
          setItems([]);
        }
      } finally {
        if (requestRef.current === controller) {
          requestRef.current = null;
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [canViewOrders, orderId, syncDraftState]
  );

  useEffect(() => {
    if (!user?.id || !canUpdateOrders) return;
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
  }, [canUpdateOrders, messageApi, user?.id]);

  const ensureCsrfToken = useCallback(async (): Promise<string> => {
    if (csrfToken) return csrfToken;

    const token = await authService.getCsrfToken();
    if (token) {
      setCsrfToken(token);
    }

    return token;
  }, [csrfToken]);

  useEffect(() => {
    if (!orderId || !canViewOrders) return;
    void fetchOrder({ silent: hasLoadedRef.current });

    return () => {
      requestRef.current?.abort();
      if (refreshTimerRef.current) window.clearTimeout(refreshTimerRef.current);
    };
  }, [canViewOrders, fetchOrder, orderId]);

  useEffect(() => {
    if (!socket || !orderId || !canViewOrders) return;

    const queueRefresh = (payload?: { id?: string; orderId?: string }) => {
      if (payload?.id && payload.id !== orderId) return;
      if (payload?.orderId && payload.orderId !== orderId) return;

      if (refreshTimerRef.current) window.clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = window.setTimeout(() => {
        void fetchOrder({ silent: true, preserveDraft: true });
      }, 220);
    };

    socket.on(RealtimeEvents.stockOrders.update, queueRefresh);
    socket.on(RealtimeEvents.stockOrders.status, queueRefresh);
    socket.on(RealtimeEvents.stockOrders.detailUpdate, queueRefresh);
    socket.on(LegacyRealtimeEvents.stockOrdersUpdated, queueRefresh);

    return () => {
      socket.off(RealtimeEvents.stockOrders.update, queueRefresh);
      socket.off(RealtimeEvents.stockOrders.status, queueRefresh);
      socket.off(RealtimeEvents.stockOrders.detailUpdate, queueRefresh);
      socket.off(LegacyRealtimeEvents.stockOrdersUpdated, queueRefresh);
      if (refreshTimerRef.current) window.clearTimeout(refreshTimerRef.current);
    };
  }, [canViewOrders, fetchOrder, orderId, socket]);

  const setPurchased = (ingredientId: string, checked: boolean) => {
    if (!isEditable) return;

    syncDraftState(
      itemsRef.current.map((item) =>
        item.ingredient_id === ingredientId
          ? {
              ...item,
              is_purchased: checked,
              actual_quantity: checked ? Math.max(item.actual_quantity, item.ordered_quantity) : 0,
            }
          : item
      )
    );
  };

  const setActualQuantity = (ingredientId: string, value: number | null) => {
    if (!isEditable) return;

    const qty = Math.max(0, Math.trunc(Number(value || 0)));
    syncDraftState(
      itemsRef.current.map((item) =>
        item.ingredient_id === ingredientId
          ? {
              ...item,
              actual_quantity: qty,
              is_purchased: qty > 0,
            }
          : item
      )
    );
  };

  const nudgeQuantity = (ingredientId: string, diff: number) => {
    const current = items.find((item) => item.ingredient_id === ingredientId);
    if (!current) return;
    setActualQuantity(ingredientId, current.actual_quantity + diff);
  };

  const setMatchRequired = (ingredientId: string) => {
    if (!isEditable) return;

    syncDraftState(
      itemsRef.current.map((item) =>
        item.ingredient_id === ingredientId
          ? { ...item, actual_quantity: item.ordered_quantity, is_purchased: true }
          : item
      )
    );
  };

  const markAllAsPurchased = () => {
    if (!isEditable) return;

    syncDraftState(
      itemsRef.current.map((item) => ({
        ...item,
        is_purchased: true,
        actual_quantity: item.ordered_quantity,
      }))
    );
  };

  const totals = useMemo(() => {
    const actual = items.reduce((acc, item) => acc + (item.is_purchased ? item.actual_quantity : 0), 0);
    const matched = items.filter(
      (item) => item.is_purchased && item.actual_quantity === item.ordered_quantity
    ).length;
    const missing = items.filter(
      (item) => item.is_purchased && item.actual_quantity < item.ordered_quantity
    ).length;
    const over = items.filter(
      (item) => item.is_purchased && item.actual_quantity > item.ordered_quantity
    ).length;
    const selected = items.filter((item) => item.is_purchased).length;

    return { actual, matched, missing, over, selected };
  }, [items]);

  const completionPercent = useMemo(() => {
    if (items.length === 0) return 0;
    return Math.round((totals.selected / items.length) * 100);
  }, [items.length, totals.selected]);

  const confirmPurchase = async () => {
    if (!orderId || !isEditable) return;

    setConfirming(true);
    try {
      const token = await ensureCsrfToken();
      await ordersService.confirmPurchase(
        orderId,
        items.map((item) => ({
          ingredient_id: item.ingredient_id,
          actual_quantity: item.is_purchased ? item.actual_quantity : 0,
          is_purchased: item.is_purchased,
        })),
        undefined,
        token
      );

      messageApi.success("บันทึกผลการซื้อเรียบร้อย");
      setConfirmModalOpen(false);
      router.push("/stock/history");
    } catch (caughtError) {
      messageApi.error(
        caughtError instanceof Error ? caughtError.message : "ยืนยันผลการซื้อไม่สำเร็จ"
      );
    } finally {
      setConfirming(false);
    }
  };

  if (authLoading || permissionLoading) {
    return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์..." />;
  }

  if (!user || !canViewOrders) {
    return (
      <AccessGuardFallback
        message="คุณไม่มีสิทธิ์เข้าถึงหน้าตรวจรับรายการซื้อ"
        tone="danger"
      />
    );
  }

  if (!orderId) {
    return (
      <div className="stock-buying-shell">
        <StockBuyingPageStyle />
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
                  ไปหน้าคิวใบซื้อ
                </Button>
              }
            />
          </PageSection>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="stock-buying-shell" data-testid="stock-buying-page">
      <StockBuyingPageStyle />

      <PageContainer maxWidth={1440}>
        <section className="stock-buying-hero">
          <div className="stock-buying-hero-panel">
            <div className="stock-buying-hero-header">
              <div className="stock-buying-hero-header-left">
                <Button
                  type="text"
                  icon={<ArrowLeftOutlined />}
                  onClick={() => router.push("/stock/items")}
                  className="stock-buying-hero-icon-btn"
                />
                <div className="stock-buying-title-icon">
                  <CheckSquareOutlined />
                </div>
                <div className="stock-buying-title-group">
                  <Title level={4} className="stock-buying-title">
                    {order ? getOrderCode(order.id) : "กำลังโหลด..."}
                  </Title>
                  {order?.create_date ? (
                    <Text type="secondary" className="stock-buying-subtitle">
                      {new Date(order.create_date).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </Text>
                  ) : null}
                </div>
              </div>

              <div className="stock-buying-hero-header-right">
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => void fetchOrder({ silent: true, preserveDraft: false })}
                  loading={refreshing}
                  className="stock-buying-hero-btn"
                  data-testid="stock-buying-refresh"
                >
                  รีเฟรช
                </Button>

                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={markAllAsPurchased}
                  disabled={!isEditable || items.length === 0}
                  className="stock-buying-hero-btn"
                  data-testid="stock-buying-match-all"
                >
                  ตรงตามแผนทั้งหมด
                </Button>
              </div>
            </div>

            {order?.remark ? (
              <div className="stock-buying-note">
                <Text strong>หมายเหตุใบสั่งซื้อ</Text>
                <Text type="secondary">{order.remark}</Text>
              </div>
            ) : null}
          </div>
        </section>

        {loading && !order ? (
          <PageSection
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "120px 0",
              background: "transparent",
              border: "none",
            }}
          >
            <Spin size="large" />
          </PageSection>
        ) : error && !order ? (
          <PageSection>
            <PageState
              status="error"
              title={error}
              action={
                <Button
                  type="primary"
                  icon={<ArrowLeftOutlined />}
                  onClick={() => router.push("/stock/items")}
                >
                  กลับหน้าคิวใบซื้อ
                </Button>
              }
            />
          </PageSection>
        ) : !order ? (
          <PageSection>
            <PageState status="empty" title="ไม่พบข้อมูลใบซื้อ" />
          </PageSection>
        ) : (
          <Row gutter={[24, 24]} className="stock-buying-layout" style={{ marginTop: 16 }}>
            <Col xs={24} lg={16}>
              {refreshError ? (
                <Alert
                  type="warning"
                  showIcon
                  message="ซิงก์ข้อมูลล่าสุดไม่สำเร็จ"
                  description={refreshError}
                  style={{ marginBottom: 16, borderRadius: 16 }}
                  data-testid="stock-buying-refresh-alert"
                />
              ) : null}

              {!isEditable ? (
                <Alert
                  type="info"
                  showIcon
                  message="ใบซื้อนี้ไม่ได้อยู่ในสถานะรอตรวจรับ"
                  description="ยังดูรายละเอียดได้ตามปกติ แต่ไม่สามารถแก้จำนวนหรือยืนยันผลการซื้อซ้ำได้"
                  style={{ marginBottom: 16, borderRadius: 16 }}
                />
              ) : null}

              {hasDraftChanges && isEditable ? (
                <Alert
                  type="info"
                  showIcon
                  message="มีการแก้ไขค้างอยู่"
                  description="ระบบจะเก็บร่างที่กำลังกรอกไว้ระหว่างการอัปเดตแบบเรียลไทม์ ถ้าต้องการข้อมูลล่าสุดจากเซิร์ฟเวอร์ให้กดรีเฟรช"
                  style={{ marginBottom: 16, borderRadius: 16 }}
                  data-testid="stock-buying-draft-warning"
                />
              ) : null}

              <Card
                bordered={false}
                style={{ borderRadius: 24, boxShadow: "0 10px 30px rgba(0,0,0,0.02)" }}
                bodyStyle={{ padding: "20px" }}
              >
                <div
                  className="stock-buying-section-head"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 20,
                  }}
                >
                  <div>
                    <Title
                      level={4}
                      className="stock-buying-section-title"
                      style={{ margin: 0, color: "#1e293b" }}
                    >
                      รายการวัตถุดิบ
                    </Title>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      {items.length.toLocaleString()} รายการในใบซื้อ
                    </Text>
                  </div>
                  <div className="stock-buying-section-meta" style={{ display: "flex", gap: 8 }}>
                    <Tag color="cyan" style={{ borderRadius: 8, margin: 0 }}>
                      {totals.selected.toLocaleString()} ยืนยันแล้ว
                    </Tag>
                    <Tag color="warning" style={{ borderRadius: 8, margin: 0 }}>
                      {(totals.missing + totals.over).toLocaleString()} ต่างจากแผน
                    </Tag>
                  </div>
                </div>

                {items.length === 0 ? (
                  <div className="stock-buying-empty">
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="ไม่มีรายการวัตถุดิบในใบซื้อ"
                    />
                  </div>
                ) : (
                  <div className="stock-buying-list" style={{ display: "grid", gap: 16 }}>
                    {items.map((item) => {
                      const diffMeta = getDiffMeta(item);

                      return (
                        <article
                          key={item.ingredient_id}
                          className="stock-buying-item-card-v3"
                          data-testid={`stock-buying-item-${item.ingredient_id}`}
                        >
                          <div
                            className="stock-buying-item-status-bar"
                            style={{ background: diffMeta.color }}
                          />

                          <div className="item-v3-header">
                            <div className="item-v3-identity">
                              <StockImageThumb
                                src={item.img_url}
                                alt={item.display_name}
                                size={54}
                                borderRadius={16}
                              />
                              <div className="item-v3-copy">
                                <div className="item-v3-title-row">
                                  <Text strong style={{ fontSize: 16 }}>
                                    {item.display_name}
                                  </Text>
                                  <Tag
                                    style={{
                                      color: diffMeta.color,
                                      background: diffMeta.background,
                                      border: `1px solid ${diffMeta.borderColor}`,
                                      borderRadius: 8,
                                      margin: 0,
                                      fontSize: 11,
                                    }}
                                  >
                                    {diffMeta.label}
                                  </Tag>
                                </div>
                              </div>
                            </div>
                            <div className="item-v3-toggle">
                              <Switch
                                size="small"
                                checked={item.is_purchased}
                                onChange={(checked) => setPurchased(item.ingredient_id, checked)}
                                disabled={!isEditable}
                              />
                            </div>
                          </div>

                          <Divider dashed style={{ margin: "14px 0" }} />

                          <div className="item-v3-body">
                            <div className="item-v3-stats">
                              <div className="item-v3-stat-box">
                                <span className="item-v3-stat-label">สั่งซื้อ</span>
                                <span className="item-v3-stat-value">
                                  {item.ordered_quantity.toLocaleString()}{" "}
                                  <Text type="secondary" style={{ fontSize: 13 }}>
                                    {item.unit_label}
                                  </Text>
                                </span>
                              </div>
                              <div className={`item-v3-stat-box ${item.is_purchased ? "active" : ""}`}>
                                <span className="item-v3-stat-label">ซื้อจริง</span>
                                <span className="item-v3-stat-value">
                                  {item.is_purchased ? item.actual_quantity.toLocaleString() : "0"}{" "}
                                  <Text type="secondary" style={{ fontSize: 13 }}>
                                    {item.unit_label}
                                  </Text>
                                </span>
                              </div>
                            </div>

                            <div className="item-v3-quick-actions">
                              <Button
                                className="btn-match"
                                onClick={() => setMatchRequired(item.ingredient_id)}
                                disabled={!isEditable}
                              >
                                เท่าที่สั่ง
                              </Button>
                              <Button
                                className="btn-skip"
                                onClick={() => setActualQuantity(item.ingredient_id, 0)}
                                disabled={!isEditable}
                              >
                                ไม่ได้ซื้อ
                              </Button>
                            </div>
                          </div>

                          <div className="item-v3-footer">
                            <div className="item-v3-qty-box">
                              <Button
                                className="btn-minus"
                                icon={<MinusOutlined />}
                                onClick={() => nudgeQuantity(item.ingredient_id, -1)}
                                disabled={!isEditable}
                              />
                              <InputNumber
                                min={0}
                                value={item.actual_quantity}
                                onChange={(value) => setActualQuantity(item.ingredient_id, value)}
                                disabled={!isEditable}
                                controls={false}
                                bordered={false}
                                data-testid={`stock-buying-qty-${item.ingredient_id}`}
                              />
                              <Button
                                className="btn-plus"
                                icon={<PlusOutlined />}
                                onClick={() => nudgeQuantity(item.ingredient_id, 1)}
                                disabled={!isEditable}
                              />
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <div className="stock-buying-sidebar-sticky">
                <Card
                  style={{
                    borderRadius: 24,
                    boxShadow: "0 16px 40px rgba(15, 23, 42, 0.04)",
                    border: "1px solid rgba(226, 232, 240, 0.6)",
                  }}
                  bodyStyle={{ padding: "24px" }}
                >
                  <Title level={5} style={{ marginBottom: 20, color: "#334155" }}>
                    สรุปความคืบหน้า
                  </Title>

                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
                    <Progress
                      type="circle"
                      percent={completionPercent}
                      width={130}
                      strokeWidth={10}
                      strokeColor={{ "0%": "#10b981", "100%": "#2563eb" }}
                      format={(percent) => (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                          }}
                        >
                          <span style={{ fontSize: 22, fontWeight: 800, color: "#1e293b" }}>
                            {percent}%
                          </span>
                          <span style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>
                            ตรวจแล้ว
                          </span>
                        </div>
                      )}
                    />
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                      marginBottom: 24,
                    }}
                  >
                    <div
                      style={{
                        background: "#f8fafc",
                        padding: "14px 12px",
                        borderRadius: 16,
                        textAlign: "center",
                        border: "1px solid #f1f5f9",
                      }}
                    >
                      <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                        ทั้งหมด
                      </Text>
                      <Title level={4} style={{ margin: "4px 0 0", color: "#0f172a" }}>
                        {items.length}
                      </Title>
                    </div>
                    <div
                      style={{
                        background: "#ecfdf5",
                        padding: "14px 12px",
                        borderRadius: 16,
                        textAlign: "center",
                      }}
                    >
                      <Text type="success" style={{ fontSize: 13, fontWeight: 500 }}>
                        ยืนยันแล้ว
                      </Text>
                      <Title level={4} style={{ margin: "4px 0 0", color: "#047857" }}>
                        {totals.selected}
                      </Title>
                    </div>
                    <div
                      style={{
                        background: "#fffbeb",
                        padding: "14px 12px",
                        borderRadius: 16,
                        textAlign: "center",
                      }}
                    >
                      <Text style={{ fontSize: 13, color: "#d97706", fontWeight: 500 }}>
                        ตรงแผน
                      </Text>
                      <Title level={4} style={{ margin: "4px 0 0", color: "#b45309" }}>
                        {totals.matched}
                      </Title>
                    </div>
                    <div
                      style={{
                        background: "#fef2f2",
                        padding: "14px 12px",
                        borderRadius: 16,
                        textAlign: "center",
                      }}
                    >
                      <Text type="danger" style={{ fontSize: 13, fontWeight: 500 }}>
                        ต่างจากแผน
                      </Text>
                      <Title level={4} style={{ margin: "4px 0 0", color: "#dc2626" }}>
                        {totals.missing + totals.over}
                      </Title>
                    </div>
                  </div>

                  <div
                    style={{
                      background: "#f8fafc",
                      padding: 14,
                      borderRadius: 16,
                      marginBottom: 24,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "#64748b", fontSize: 13, fontWeight: 500 }}>
                      จำนวนที่ตรวจรับ
                    </Text>
                    <Title level={4} style={{ margin: 0, color: "#0f172a" }}>
                      {totals.actual.toLocaleString()}{" "}
                      <span style={{ fontSize: 13, fontWeight: 400, color: "#64748b" }}>
                        หน่วย
                      </span>
                    </Title>
                  </div>

                  <Divider style={{ margin: "16px 0" }} />

                  <Button
                    type="primary"
                    size="large"
                    block
                    icon={<CheckCircleOutlined style={{ fontSize: 17 }} />}
                    onClick={() => setConfirmModalOpen(true)}
                    disabled={!isEditable || items.length === 0}
                    data-testid="stock-buying-confirm-open"
                    style={{
                      height: 50,
                      borderRadius: 16,
                      fontWeight: 700,
                      fontSize: 15,
                      background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                      border: "none",
                      boxShadow: "0 8px 16px rgba(37, 99, 235, 0.15)",
                    }}
                  >
                    ยืนยันการตรวจรับ
                  </Button>
                </Card>
              </div>
            </Col>
          </Row>
        )}
      </PageContainer>

      <Modal
        open={confirmModalOpen}
        onCancel={() => setConfirmModalOpen(false)}
        onOk={() => void confirmPurchase()}
        confirmLoading={confirming}
        okText="ยืนยันการตรวจรับ"
        cancelText="กลับไปแก้ไข"
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircleOutlined style={{ color: "#2563eb" }} />
            <span>สรุปผลการตรวจรับใบซื้อ {order ? getOrderCode(order.id) : ""}</span>
          </div>
        }
        destroyOnClose
        width={680}
        okButtonProps={{
          "data-testid": "stock-buying-confirm-submit",
          style: { borderRadius: 12, height: 40, fontWeight: 600 },
        }}
        cancelButtonProps={{
          style: { borderRadius: 12, height: 40 },
        }}
      >
        <Space direction="vertical" size={16} style={{ width: "100%", marginTop: 12 }}>
          <div className="stock-buying-modal-summary">
            <div style={{ background: "#f8fafc", padding: 14, borderRadius: 16, textAlign: "center" }}>
              <Text type="secondary" style={{ fontSize: 13 }}>
                รายการทั้งหมด
              </Text>
              <Title level={4} style={{ margin: "4px 0 0" }}>
                {items.length.toLocaleString()} รายการ
              </Title>
            </div>
            <div style={{ background: "#ecfdf5", padding: 14, borderRadius: 16, textAlign: "center" }}>
              <Text type="success" style={{ fontSize: 13 }}>
                ซื้อสำเร็จ
              </Text>
              <Title level={4} style={{ margin: "4px 0 0", color: "#065f46" }}>
                {totals.selected.toLocaleString()} รายการ
              </Title>
            </div>
            <div style={{ background: "#eff6ff", padding: 14, borderRadius: 16, textAlign: "center" }}>
              <Text style={{ fontSize: 13, color: "#1d4ed8" }}>
                จำนวนซื้อจริง
              </Text>
              <Title level={4} style={{ margin: "4px 0 0", color: "#1e3a8a" }}>
                {totals.actual.toLocaleString()} หน่วย
              </Title>
            </div>
          </div>

          <div style={{ marginTop: 8 }}>
            <div style={{ paddingBottom: 12 }}>
              <Text strong style={{ fontSize: 15 }}>
                รายละเอียดวัตถุดิบ
              </Text>
            </div>

            <div
              className="stock-buying-modal-list"
              style={{
                maxHeight: 380,
                overflowY: "auto",
                border: "1px solid #e2e8f0",
                borderRadius: 18,
                padding: "12px 16px",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.5fr 0.8fr 0.8fr 0.9fr",
                  gap: 12,
                  paddingBottom: 10,
                  borderBottom: "1px solid #e2e8f0",
                  marginBottom: 8,
                  fontWeight: 700,
                  color: "#1e293b",
                  fontSize: 13,
                }}
              >
                <span>วัตถุดิบ</span>
                <span>สั่ง</span>
                <span>ซื้อจริง</span>
                <span>สถานะ</span>
              </div>

              {items.map((item) => {
                const diffMeta = getDiffMeta(item);

                return (
                  <div
                    key={item.ingredient_id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.5fr 0.8fr 0.8fr 0.9fr",
                      gap: 12,
                      alignItems: "center",
                      padding: "10px 0",
                      borderBottom: "1px solid #f1f5f9",
                    }}
                  >
                    <Text strong style={{ fontSize: 14, color: "#0f172a" }}>
                      {item.display_name}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 14 }}>
                      {item.ordered_quantity}
                    </Text>
                    <Text
                      strong={item.is_purchased}
                      style={{
                        fontSize: 14,
                        color: item.is_purchased ? "#0f172a" : "#94a3b8",
                      }}
                    >
                      {item.is_purchased ? item.actual_quantity : 0}
                    </Text>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <Tag
                        style={{
                          color: diffMeta.color,
                          background: diffMeta.background,
                          border: `1px solid ${diffMeta.borderColor}`,
                          borderRadius: 6,
                          margin: 0,
                        }}
                      >
                        {diffMeta.label}
                      </Tag>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Space>
      </Modal>
    </div>
  );
}
