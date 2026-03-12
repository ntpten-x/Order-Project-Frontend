"use client";

import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  App,
  Button,
  Empty,
  Input,
  InputNumber,
  Modal,
  Progress,
  Space,
  Switch,
  Tag,
  Typography,
} from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CheckSquareOutlined,
  DownOutlined,
  MinusOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  UpOutlined,
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
  description?: string;
  unit_label: string;
  img_url?: string | null;
  ordered_quantity: number;
  actual_quantity: number;
  is_purchased: boolean;
}

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

function getOrderCode(id?: string): string {
  return id ? `#${id.slice(0, 8).toUpperCase()}` : "-";
}

function buildItems(order: Order | null): PurchaseItemState[] {
  if (!order?.ordersItems) return [];
  return order.ordersItems.map((item) => ({
    ingredient_id: item.ingredient_id,
    display_name: item.ingredient?.display_name || "-",
    description: item.ingredient?.description || "",
    unit_label: item.ingredient?.unit?.display_name || "หน่วย",
    img_url: item.ingredient?.img_url,
    ordered_quantity: Number(item.quantity_ordered || 0),
    actual_quantity: Number(item.ordersDetail?.actual_quantity ?? item.quantity_ordered ?? 0),
    is_purchased: Boolean(item.ordersDetail?.is_purchased),
  }));
}

function areItemStatesEqual(left: PurchaseItemState[], right: PurchaseItemState[]): boolean {
  if (left.length !== right.length) return false;
  return left.every((item, index) => {
    const compare = right[index];
    return (
      item.ingredient_id === compare?.ingredient_id &&
      item.actual_quantity === compare?.actual_quantity &&
      item.ordered_quantity === compare?.ordered_quantity &&
      item.is_purchased === compare?.is_purchased
    );
  });
}

function matchesItem(item: PurchaseItemState, search: string): boolean {
  if (!search) return true;
  const haystacks = [item.display_name, item.description || "", item.unit_label];
  return haystacks.some((value) => value.toLowerCase().includes(search));
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
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [searchText, setSearchText] = useState("");
  const [statsExpanded, setStatsExpanded] = useState(true);

  const isEditable = canUpdateOrders && order?.status === OrderStatus.PENDING;

  const fetchOrder = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
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

        setOrder(payload);
        setItems(buildItems(payload));
        setLastSyncedAt(new Date());
        setRefreshError(null);
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
    [canViewOrders, orderId]
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
        void fetchOrder({ silent: true });
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
    setItems((prev) =>
      prev.map((item) =>
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
    setItems((prev) =>
      prev.map((item) =>
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
    setItems((prev) =>
      prev.map((item) =>
        item.ingredient_id === ingredientId
          ? { ...item, actual_quantity: item.ordered_quantity, is_purchased: true }
          : item
      )
    );
  };

  const markAllAsPurchased = () => {
    if (!isEditable) return;
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        is_purchased: true,
        actual_quantity: item.ordered_quantity,
      }))
    );
  };

  const totals = useMemo(() => {
    const required = items.reduce((acc, item) => acc + item.ordered_quantity, 0);
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
    return { required, actual, matched, missing, over, selected };
  }, [items]);

  const baselineItems = useMemo(() => buildItems(order), [order]);
  const hasChanges = useMemo(() => !areItemStatesEqual(items, baselineItems), [baselineItems, items]);

  const completionPercent = useMemo(() => {
    if (items.length === 0) return 0;
    return Math.round((totals.selected / items.length) * 100);
  }, [items.length, totals.selected]);

  const deferredSearchText = useDeferredValue(searchText.trim().toLowerCase());

  const visibleItems = useMemo(
    () => items.filter((item) => matchesItem(item, deferredSearchText)),
    [deferredSearchText, items]
  );

  const summaryCards = useMemo(
    () => [
      { label: "ทั้งหมด", value: items.length, color: "#6366f1" },
      { label: "ยืนยันแล้ว", value: totals.selected, color: "#2563eb" },
      { label: "ตรงแผน", value: totals.matched, color: "#16a34a" },
      { label: "ต่างจากแผน", value: totals.missing + totals.over, color: "#f59e0b" },
    ],
    [items.length, totals.matched, totals.missing, totals.over, totals.selected]
  );

  const confirmPurchase = async () => {
    if (!orderId || !isEditable) return;

    setConfirming(true);
    try {
      await ordersService.confirmPurchase(
        orderId,
        items.map((item) => ({
          ingredient_id: item.ingredient_id,
          actual_quantity: item.is_purchased ? item.actual_quantity : 0,
          is_purchased: item.is_purchased,
        })),
        undefined,
        csrfToken
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
            <div className="stock-buying-hero-top">
              <div className="stock-buying-title-wrap">
                <Button
                  type="text"
                  icon={<ArrowLeftOutlined />}
                  onClick={() => router.push("/stock/items")}
                  className="stock-buying-hero-icon-btn"
                />

                <div className="stock-buying-title-copy">
                  <div className="stock-buying-title-line">
                    <div className="stock-buying-title-icon">
                      <CheckSquareOutlined />
                    </div>
                    <div>
                      <Text className="stock-buying-eyebrow">ตรวจรับหลังซื้อ</Text>
                      <Title level={3} className="stock-buying-title">
                        {order ? getOrderCode(order.id) : "กำลังโหลดใบซื้อ"}
                      </Title>
                    </div>
                    <Tag
                      className={`stock-buying-mode-tag ${isEditable ? "editable" : "readonly"}`}
                    >
                      {isEditable ? "พร้อมตรวจรับ" : "โหมดอ่านอย่างเดียว"}
                    </Tag>
                  </div>
                  <Text className="stock-buying-subtitle">
                    {order
                      ? `สร้างเมื่อ ${formatDateTime(order.create_date)} และอัปเดตล่าสุด ${
                          lastSyncedAt ? formatDateTime(lastSyncedAt.toISOString()) : "-"
                        }`
                      : "ตรวจและยืนยันจำนวนจริงของวัตถุดิบในใบซื้อ"}
                  </Text>
                </div>
              </div>

              <div className="stock-buying-hero-actions">
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => void fetchOrder({ silent: true })}
                  loading={refreshing}
                  className="stock-buying-hero-btn"
                >
                  รีเฟรช
                </Button>
                <Button
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

            <button
              type="button"
              className="stock-buying-stats-toggle"
              onClick={() => setStatsExpanded((prev) => !prev)}
            >
              <div>
                <Text className="stock-buying-stats-toggle-label">ภาพรวมคำสั่งซื้อ</Text>
                <div className="stock-buying-stats-toggle-value">
                  ตรวจแล้ว {totals.selected.toLocaleString()}/{items.length.toLocaleString()} รายการ
                </div>
              </div>
              <span className="stock-buying-stats-toggle-icon">
                {statsExpanded ? <UpOutlined /> : <DownOutlined />}
              </span>
            </button>

            {statsExpanded ? (
              <div className="stock-buying-stats-row">
                {summaryCards.map((stat) => (
                  <div key={stat.label} className="stock-buying-stat-card">
                    <span className="stock-buying-stat-value" style={{ color: stat.color }}>
                      {stat.value.toLocaleString()}
                    </span>
                    <span className="stock-buying-stat-label">{stat.label}</span>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="stock-buying-hero-toolbar">
              <div className="stock-buying-search">
                <Input
                  allowClear
                  prefix={<SearchOutlined className="stock-buying-search-icon" />}
                  placeholder="ค้นหาวัตถุดิบ ชื่อ หรือคำอธิบาย"
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  className="stock-buying-search-input"
                />
              </div>

              <div className="stock-buying-hero-meta">
                <span>{completionPercent}% ตรวจแล้ว</span>
                <span>ซื้อจริง {totals.actual.toLocaleString()} / {totals.required.toLocaleString()}</span>
                {hasChanges ? <span>มีรายการยังไม่ยืนยัน</span> : <span>ข้อมูลตรงกับล่าสุด</span>}
              </div>
            </div>

            {order?.remark ? (
              <div className="stock-buying-note">
                <Text strong>หมายเหตุใบซื้อ</Text>
                <Text type="secondary">{order.remark}</Text>
              </div>
            ) : null}
          </div>
        </section>

        {loading && !order ? (
          <PageSection>
            <PageState status="loading" title="กำลังโหลดข้อมูลใบซื้อ" />
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
          <section className="stock-buying-layout">
            <div className="stock-buying-main">
              {refreshError ? (
                <Alert
                  type="warning"
                  showIcon
                  message="ซิงก์ข้อมูลล่าสุดไม่สำเร็จ"
                  description={refreshError}
                  style={{ marginBottom: 16 }}
                />
              ) : null}

              {!isEditable ? (
                <Alert
                  type="info"
                  showIcon
                  message="ใบซื้อนี้ไม่อยู่ในสถานะรอตรวจรับ"
                  description="ยังดูรายละเอียดได้ตามปกติ แต่ไม่สามารถแก้จำนวนหรือยืนยันผลการซื้อซ้ำได้"
                  style={{ marginBottom: 16 }}
                />
              ) : null}

              <section className="stock-buying-section-card">
                <div className="stock-buying-section-head">
                  <div>
                    <Title level={4} className="stock-buying-section-title">
                      รายการวัตถุดิบ
                    </Title>
                    <Text type="secondary">
                      {deferredSearchText
                        ? `แสดง ${visibleItems.length.toLocaleString()} จาก ${items.length.toLocaleString()} รายการ`
                        : `${items.length.toLocaleString()} รายการในใบซื้อ`}
                    </Text>
                  </div>
                  <div className="stock-buying-section-meta">
                    <Tag color="blue">{totals.selected.toLocaleString()} ยืนยันแล้ว</Tag>
                    <Tag color="gold">{(totals.missing + totals.over).toLocaleString()} ต่างจากแผน</Tag>
                  </div>
                </div>

                {items.length === 0 ? (
                  <div className="stock-buying-empty">
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="ไม่มีรายการวัตถุดิบในใบซื้อ"
                    />
                  </div>
                ) : visibleItems.length === 0 ? (
                  <div className="stock-buying-empty">
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="ไม่พบรายการที่ค้นหา"
                    />
                  </div>
                ) : (
                  <div className="stock-buying-list">
                    {visibleItems.map((item) => {
                      const diffMeta = getDiffMeta(item);

                      return (
                        <article
                          key={item.ingredient_id}
                          className="stock-buying-item-card"
                          data-testid={`stock-buying-item-${item.ingredient_id}`}
                        >
                          <div className="stock-buying-item-head">
                            <div className="stock-buying-item-identity">
                              <StockImageThumb
                                src={item.img_url}
                                alt={item.display_name}
                                size={68}
                                borderRadius={18}
                              />
                              <div className="stock-buying-item-copy">
                                <div className="stock-buying-item-title-row">
                                  <Text strong>{item.display_name}</Text>
                                  <span
                                    className="stock-buying-item-status"
                                    style={{
                                      color: diffMeta.color,
                                      background: diffMeta.background,
                                      borderColor: diffMeta.borderColor,
                                    }}
                                  >
                                    {diffMeta.label}
                                  </span>
                                </div>
                                <Text type="secondary">
                                  ต้องซื้อ {item.ordered_quantity.toLocaleString()} {item.unit_label}
                                </Text>
                                {item.description ? (
                                  <Text type="secondary" className="stock-buying-item-description">
                                    {item.description}
                                  </Text>
                                ) : null}
                              </div>
                            </div>

                            <div className="stock-buying-item-toggle">
                              <Switch
                                checked={item.is_purchased}
                                checkedChildren="ซื้อแล้ว"
                                unCheckedChildren="ยังไม่ซื้อ"
                                onChange={(checked) => setPurchased(item.ingredient_id, checked)}
                                disabled={!isEditable}
                              />
                            </div>
                          </div>

                          <div className="stock-buying-item-stats">
                            <span>สั่งซื้อ {item.ordered_quantity.toLocaleString()} {item.unit_label}</span>
                            <span>
                              ซื้อจริง {item.is_purchased ? item.actual_quantity.toLocaleString() : "0"}{" "}
                              {item.unit_label}
                            </span>
                          </div>

                          <div className="stock-buying-item-controls">
                            <div className="stock-buying-item-quick-actions">
                              <Button
                                onClick={() => setMatchRequired(item.ingredient_id)}
                                disabled={!isEditable}
                              >
                                เท่าที่สั่ง
                              </Button>
                              <Button
                                onClick={() => setActualQuantity(item.ingredient_id, 0)}
                                disabled={!isEditable}
                              >
                                ไม่ได้ซื้อ
                              </Button>
                            </div>

                            <div className="stock-buying-qty-box">
                              <Text type="secondary">จำนวนที่ซื้อจริง</Text>
                              <Space.Compact block>
                                <Button
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
                                  style={{ width: "100%" }}
                                />
                                <Button
                                  icon={<PlusOutlined />}
                                  onClick={() => nudgeQuantity(item.ingredient_id, 1)}
                                  disabled={!isEditable}
                                />
                              </Space.Compact>
                              <Text type="secondary">หน่วย: {item.unit_label}</Text>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            <aside className="stock-buying-aside">
              <div className="stock-buying-summary-card">
                <div className="stock-buying-summary-block">
                  <Text type="secondary">สรุปการตรวจรับ</Text>
                  <Title level={4} className="stock-buying-summary-code">
                    {getOrderCode(order.id)}
                  </Title>
                  <Text type="secondary">สร้างเมื่อ {formatDateTime(order.create_date)}</Text>
                </div>

                <div className="stock-buying-summary-block">
                  <div className="stock-buying-summary-row">
                    <Text>รายการที่ตรวจแล้ว</Text>
                    <Text strong>
                      {totals.selected.toLocaleString()}/{items.length.toLocaleString()}
                    </Text>
                  </div>
                  <Progress
                    percent={completionPercent}
                    showInfo={false}
                    strokeColor="#2563eb"
                    trailColor="#dbeafe"
                  />
                </div>

                <div className="stock-buying-summary-grid">
                  <div>
                    <Text type="secondary">ต้องซื้อ</Text>
                    <Title level={5}>{totals.required.toLocaleString()}</Title>
                  </div>
                  <div>
                    <Text type="secondary">ซื้อจริง</Text>
                    <Title level={5}>{totals.actual.toLocaleString()}</Title>
                  </div>
                  <div>
                    <Text type="secondary">ครบตามแผน</Text>
                    <Title level={5}>{totals.matched.toLocaleString()}</Title>
                  </div>
                  <div>
                    <Text type="secondary">ต้องทวนอีกครั้ง</Text>
                    <Title level={5}>{(totals.missing + totals.over).toLocaleString()}</Title>
                  </div>
                </div>

                <div className="stock-buying-pill-row">
                  <Tag color={totals.missing > 0 ? "warning" : "default"}>
                    ซื้อน้อยกว่า {totals.missing.toLocaleString()}
                  </Tag>
                  <Tag color={totals.over > 0 ? "processing" : "default"}>
                    ซื้อมากกว่า {totals.over.toLocaleString()}
                  </Tag>
                  <Tag color={hasChanges ? "blue" : "default"}>
                    {hasChanges ? "มีการแก้ไขยังไม่ยืนยัน" : "ข้อมูลตรงกับล่าสุด"}
                  </Tag>
                </div>

                <Alert
                  type="info"
                  showIcon
                  message="วิธีใช้งาน"
                  description="เปิดสวิตช์เมื่อซื้อแล้ว กด 'เท่าที่สั่ง' เพื่อกรอกเร็ว หรือปรับจำนวนจริงทีละรายการก่อนยืนยัน"
                />
              </div>
            </aside>
          </section>
        )}
      </PageContainer>

      {order && isEditable ? (
        <div className="stock-buying-footer">
          <div className="stock-buying-footer-card">
            <div>
              <Text type="secondary">พร้อมยืนยันผลการซื้อ</Text>
              <div className="stock-buying-footer-main">
                ซื้อจริง {totals.actual.toLocaleString()} จาก {totals.required.toLocaleString()} หน่วย
              </div>
            </div>
            <Button
              type="primary"
              size="large"
              icon={<CheckCircleOutlined />}
              onClick={() => setConfirmModalOpen(true)}
              disabled={items.length === 0}
              data-testid="stock-buying-confirm-open"
            >
              ยืนยันผลการซื้อ
            </Button>
          </div>
        </div>
      ) : null}

      <Modal
        open={confirmModalOpen}
        onCancel={() => setConfirmModalOpen(false)}
        onOk={() => void confirmPurchase()}
        confirmLoading={confirming}
        okText="ยืนยัน"
        cancelText="กลับไปแก้ไข"
        title="ยืนยันการบันทึกผลการซื้อ"
        destroyOnClose
        okButtonProps={{ "data-testid": "stock-buying-confirm-submit" }}
      >
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <Alert
            type="warning"
            showIcon
            message="เมื่อยืนยันแล้ว ใบซื้อจะถูกปิดงาน"
            description="ระบบจะบันทึกทุกบรรทัดที่ยังไม่เลือกเป็นไม่ได้ซื้อ และเปลี่ยนสถานะใบซื้อเป็นเสร็จสิ้น"
          />

          <div className="stock-buying-modal-summary">
            <div>
              <Text type="secondary">รายการทั้งหมด</Text>
              <div>{items.length.toLocaleString()} รายการ</div>
            </div>
            <div>
              <Text type="secondary">ยืนยันแล้ว</Text>
              <div>{totals.selected.toLocaleString()} รายการ</div>
            </div>
            <div>
              <Text type="secondary">ซื้อจริง</Text>
              <div>{totals.actual.toLocaleString()} หน่วย</div>
            </div>
          </div>

          <div className="stock-buying-modal-list">
            {items.slice(0, 6).map((item) => (
              <div key={item.ingredient_id} className="stock-buying-modal-item">
                <span>{item.display_name}</span>
                <strong>
                  {item.is_purchased ? item.actual_quantity.toLocaleString() : "0"} /{" "}
                  {item.ordered_quantity.toLocaleString()}
                </strong>
              </div>
            ))}
            {items.length > 6 ? (
              <Text type="secondary">และอีก {items.length - 6} รายการ</Text>
            ) : null}
          </div>
        </Space>
      </Modal>
    </div>
  );
}
