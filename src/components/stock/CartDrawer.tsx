"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Drawer,
  Empty,
  Grid,
  Input,
  InputNumber,
  List,
  Modal,
  Space,
  Typography,
  message,
} from "antd";
import {
  CloseOutlined,
  DeleteOutlined,
  MinusOutlined,
  PlusOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import { useEffectivePermissions } from "../../hooks/useEffectivePermissions";
import { authService } from "../../services/auth.service";
import { ordersService } from "../../services/stock/orders.service";
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../contexts/stock/CartContext";
import StockImageThumb from "./StockImageThumb";
import { posColors, posComponentStyles } from "../pos/shared/style";

const { Text, Title } = Typography;

export default function CartDrawer() {
  const { user } = useAuth();
  const { can } = useEffectivePermissions({ enabled: Boolean(user?.id) });
  const canCreateOrders = can("stock.orders.page", "create");
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;


  const { items, clearCart, itemCount, updateQuantity } = useCart();

  const [open, setOpen] = useState(false);
  const [csrfToken, setCsrfToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [remark, setRemark] = useState("");


  const [isCheckout, setIsCheckout] = useState(false);

  useEffect(() => {
    if (!open) {
      setIsCheckout(false);
    }
  }, [open]);

  const categorySummary = useMemo(() => {
    const summary: Record<string, number> = {};
    items.forEach((item) => {
      const catName = item.ingredient.category?.display_name || "ไม่มีหมวดหมู่";
      summary[catName] = (summary[catName] || 0) + 1;
    });
    return Object.entries(summary).map(([name, count]) => ({ name, count }));
  }, [items]);

  useEffect(() => {
    if (!open) return;
    const run = async () => {
      try {
        const token = await authService.getCsrfToken();
        setCsrfToken(token);
      } catch {
        message.error("โหลดโทเคนความปลอดภัยไม่สำเร็จ");
      }
    };
    void run();
  }, [open]);

  const ensureCsrfToken = async (): Promise<string> => {
    if (csrfToken) return csrfToken;

    const token = await authService.getCsrfToken();
    if (token) {
      setCsrfToken(token);
    }

    return token;
  };

  const createOrder = async () => {
    if (!canCreateOrders) {
      message.error("คุณไม่มีสิทธิ์สร้างใบซื้อ");
      return;
    }
    if (!user) {
      message.warning("กรุณาเข้าสู่ระบบก่อนสร้างใบซื้อ");
      return;
    }
    if (items.length === 0) {
      message.warning("ยังไม่มีรายการที่ต้องซื้อ");
      return;
    }

    setSubmitting(true);
    try {
      const token = await ensureCsrfToken();
      if (!token) {
        throw new Error("Unable to load CSRF token");
      }

      await ordersService.createOrder(
        {
          items: items.map((item) => ({
            ingredient_id: item.ingredient.id,
            quantity_ordered: Number(item.quantity || 0),
          })),
          remark: remark.trim() || undefined,
        },
        undefined,
        token
      );

      message.success("สร้างใบซื้อเรียบร้อย");
      clearCart();
      setRemark("");
      setOpen(false);
    } catch (error: unknown) {
      message.error((error as Error)?.message || "สร้างใบซื้อไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };




































































  const confirmClearCart = () => {
    Modal.confirm({
      title: "ล้างรายการทั้งหมด",
      content: "ต้องการล้างรายการที่จดไว้ทั้งหมดหรือไม่",
      okText: "ล้างรายการ",
      okButtonProps: { danger: true },
      cancelText: "ยกเลิก",
      centered: true,
      onOk: clearCart,
    });
  };

  return (
    <>
      <style>{`
        .stock-cart-drawer .ant-input-number-input {
          text-align: center !important;
        }
      `}</style>
      <div className="stock-cart-fab-wrap">
        <Badge count={itemCount} size="small" overflowCount={99}>
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={<ShoppingCartOutlined />}
            className="stock-cart-fab"
            onClick={() => setOpen(true)}
            data-testid="stock-cart-open"
          />
        </Badge>
      </div>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        placement={isMobile ? "bottom" : "right"}
        width={isMobile ? undefined : 420}
        height={isMobile ? "100%" : undefined}
        rootClassName="stock-cart-drawer"
        title={
          isCheckout ? (
            <div style={{ ...posComponentStyles.modalTitleRow, color: "#fff" }}>
              <ShoppingCartOutlined style={{ fontSize: 20 }} />
              <span style={{ fontWeight: 700, fontSize: 18 }}>สรุปรายการสั่งซื้อ</span>
            </div>
          ) : (
            <div style={posComponentStyles.drawerTitleRow}>
              <div style={posComponentStyles.drawerTitleIcon}>
                <ShoppingCartOutlined style={{ fontSize: 20, color: "#10b981" }} />
              </div>
              <div>
                <Text style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", display: "block", lineHeight: 1.2 }}>
                  ตะกร้าวัตถุดิบ
                </Text>
              </div>
            </div>
          )
        }
        closeIcon={isCheckout ? <CloseOutlined style={{ color: "#fff" }} /> : undefined}
        styles={{
          wrapper: { maxWidth: "100vw" },
          header: {
            background: isCheckout ? `linear-gradient(145deg, ${posColors.primary} 0%, ${posColors.primaryDark} 100%)` : "white",
            padding: "20px",
            borderBottom: isCheckout ? "none" : "1px solid #f1f5f9"
          },
          body: {
            padding: isCheckout ? "0 24px" : "16px 20px",
            background: isCheckout ? "white" : "#f8fafc",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            overflowX: "hidden",
          },
          footer: {
             padding: "20px",
             borderTop: "1px solid #e2e8f0",
             background: "white"
          }
        }}
        footer={
          isCheckout ? (
            <div style={{ padding: "8px 0", display: "flex", flexDirection: "column", gap: 16 }}>
              <Input.TextArea
                rows={3}
                placeholder="หมายเหตุรวมของใบซื้อ..."
                value={remark}
                onChange={(event) => setRemark(event.target.value)}
                maxLength={600}
                style={{ borderRadius: 12 }}
                data-testid="stock-cart-remark"
              />
              <Button
                type="primary"
                block
                size="large"
                loading={submitting}
                disabled={items.length === 0 || !canCreateOrders}
                onClick={() => void createOrder()}
                style={{
                  background: `linear-gradient(135deg, ${posColors.success} 0%, #059669 100%)`,
                  border: "none",
                  height: 56,
                  fontWeight: 700,
                  fontSize: 18,
                  borderRadius: 14,
                }}
                data-testid="stock-cart-submit"
              >
                ยืนยันการสั่งซื้อ
              </Button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontSize: 15, fontWeight: 600, color: "#1e293b" }}>
                  รวมทั้งหมด
                </Text>
                <Text style={{ fontWeight: 700, fontSize: 16, color: "#1e293b" }}>
                  {itemCount} รายการ
                </Text>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}>
                <Button
                  size="large"
                  danger
                  onClick={confirmClearCart}
                  disabled={items.length === 0}
                  style={{ borderRadius: 12, height: 48, fontWeight: 600 }}
                >
                  ล้างตะกร้า
                </Button>
                <Button
                  type="primary"
                  size="large"
                  onClick={() => setIsCheckout(true)}
                  disabled={items.length === 0}
                  style={{ borderRadius: 12, height: 48, fontWeight: 700, background: "#10b981" }}
                >
                  ตรวจสอบใบสั่งซื้อ
                </Button>
              </div>
            </div>
          )
        }
      >
        <div data-testid="stock-cart-drawer-content" style={{ padding: "16px 0" }}>
          {items.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="ยังไม่มีรายการ กรุณาเลือกวัตถุดิบที่ต้องซื้อ"
              style={{ marginTop: 48 }}
            />
          ) : isCheckout ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <section>
                <Title level={5} style={{ marginBottom: 16 }}>รายการที่สั่ง</Title>
                <List
                  itemLayout="horizontal"
                  dataSource={items}
                  renderItem={(item) => (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px dashed #e2e8f0" }}>
                      <Space>
                        <StockImageThumb src={item.ingredient.img_url} alt={item.ingredient.display_name} size={40} />
                        <Text strong style={{ fontSize: 17 }}>{item.ingredient.display_name}</Text>
                      </Space>
                      <Text style={{ fontWeight: 600 }}>x{item.quantity} {item.ingredient.unit?.display_name}</Text>
                    </div>
                  )}
                />
              </section>

              <section style={{ background: "#F8FAFC", padding: 16, borderRadius: 14, border: "1px solid #E2E8F0" }}>
                <Text strong style={{ fontSize: 14, marginBottom: 12, display: "block" }}>สรุปตามหมวดหมู่</Text>
                {categorySummary.map(({ name, count }) => (
                  <div key={name} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <Text strong style={{ fontSize: 13 }}>{name}</Text>
                    <Text strong style={{ fontSize: 13 }}>{count} รายการ</Text>
                  </div>
                ))}
              </section>
            </div>
          ) : (
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              {items.map((item) => {
                const unitLabel = item.ingredient.unit?.display_name || "หน่วย";
                return (
                  <div key={item.ingredient.id} style={{ background: "white", padding: 14, borderRadius: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                    <div className="stock-cart-item-row" style={{ display: "flex", gap: 12 }}>
                      <StockImageThumb src={item.ingredient.img_url} alt={item.ingredient.display_name} size={56} borderRadius={10} />
                      <div className="stock-cart-item-content" style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <Text strong style={{ fontSize: 18, color: "#1e293b" }}>{item.ingredient.display_name}</Text>
                            <div style={{ fontSize: 12, color: "#64748b" }}>หน่วย: {unitLabel}</div>
                          </div>
                          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => updateQuantity(item.ingredient.id, 0)} />
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginTop: 12, paddingTop: 12, borderTop: "1px solid #f1f5f9" }}>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        width: "100%",
                        background: "#f1f5f9",
                        border: "1px solid #e2e8f0",
                        borderRadius: 12,
                        padding: 4,
                      }}>
                        <Button
                          type="text"
                          icon={<MinusOutlined style={{ color: "#64748b" }} />}
                          onClick={() => updateQuantity(item.ingredient.id, Math.max(0, item.quantity - 1))}
                          style={{ border: "none", background: "white", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}
                        />
                        <InputNumber
                          min={1}
                          value={item.quantity}
                          onChange={(value) => updateQuantity(item.ingredient.id, Number(value || 1))}
                          controls={false}
                          bordered={false}
                          style={{
                            flex: 1,
                            width: "100%",
                            textAlign: "center",
                            fontWeight: 700,
                            fontSize: 16,
                            background: "transparent",
                            boxShadow: "none"
                          }}
                        />
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={() => updateQuantity(item.ingredient.id, item.quantity + 1)}
                          style={{
                            background: "#10b981",
                            borderColor: "#10b981",
                            borderRadius: 8,
                            width: 32,
                            height: 32,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </Space>
          )}
        </div>
      </Drawer>
    </>
  );
}

