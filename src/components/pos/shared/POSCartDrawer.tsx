"use client";

import React from "react";
import { DeleteOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { Button, Drawer, List, Modal, Typography } from "antd";
import { CartItem } from "../../../contexts/pos/CartContext";
import { formatPrice } from "../../../utils/products/productDisplay.utils";
import { posComponentStyles } from "./style";

const { Text, Title } = Typography;

type POSCartDrawerProps = {
  open: boolean;
  onClose: () => void;
  totalItems: number;
  subtotal: number;
  discountAmount: number;
  finalPrice: number;
  cartItems: CartItem[];
  onClearCart: () => void;
  onCheckout: () => void;
  renderCartItem: (item: CartItem) => React.ReactNode;
};

export function POSCartDrawer({
  open,
  onClose,
  totalItems,
  subtotal,
  discountAmount,
  finalPrice,
  cartItems,
  onClearCart,
  onCheckout,
  renderCartItem,
}: POSCartDrawerProps) {
  return (
    <Drawer
      title={
        <div style={posComponentStyles.drawerTitleRow}>
          <div style={posComponentStyles.drawerTitleIcon}>
            <ShoppingCartOutlined style={{ fontSize: 20, color: "#10b981" }} />
          </div>
          <div>
            <Text style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", display: "block", lineHeight: 1.2 }}>
              ตะกร้าสินค้า
            </Text>
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>
              {totalItems} รายการ
            </Text>
          </div>
        </div>
      }
      placement="right"
      onClose={onClose}
      open={open}
      width={420}
      styles={{
        wrapper: { maxWidth: "100vw" },
        body: { padding: "16px 20px", background: "#f8fafc" },
        header: { padding: "20px", borderBottom: "1px solid #f1f5f9" },
        footer: { padding: "20px", borderTop: "1px solid #e2e8f0", background: "white" },
      }}
      footer={
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Text type="secondary" style={{ fontSize: 15 }}>
              ยอดรวม ({totalItems} รายการ)
            </Text>
            <Text style={{ fontWeight: 600, fontSize: 16 }}>{formatPrice(subtotal)}</Text>
          </div>

          {discountAmount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Text type="secondary" style={{ fontSize: 15 }}>
                ส่วนลด
              </Text>
              <Text style={{ fontWeight: 600, fontSize: 16, color: "#ef4444" }}>-{formatPrice(discountAmount)}</Text>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <Text style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>ยอดสุทธิ</Text>
            <div style={{ textAlign: "right" }}>
              <Title level={2} style={{ margin: 0, color: "#10b981", lineHeight: 1 }}>
                {formatPrice(finalPrice)}
              </Title>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}>
            <Button
              size="large"
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                Modal.confirm({
                  title: "ล้างตะกร้าสินค้า?",
                  content: "รายการทั้งหมดจะถูกลบ และไม่สามารถย้อนกลับได้",
                  okText: "ล้างตะกร้า",
                  okType: "danger",
                  cancelText: "ยกเลิก",
                  centered: true,
                  onOk: onClearCart,
                });
              }}
              disabled={cartItems.length === 0}
              style={{
                borderRadius: 12,
                height: 48,
                fontWeight: 600,
                border: "none",
                background: "#fef2f2",
                color: "#ef4444",
              }}
            >
              ล้างตะกร้า
            </Button>
            <Button
              type="primary"
              size="large"
              onClick={onCheckout}
              disabled={cartItems.length === 0}
              style={{
                borderRadius: 12,
                height: 48,
                fontWeight: 700,
                background: "#10b981",
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.4)",
              }}
            >
              เพิ่มออเดอร์
            </Button>
          </div>
        </div>
      }
    >
      {cartItems.length > 0 ? (
        <List dataSource={cartItems} renderItem={renderCartItem} split={false} />
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            opacity: 0.5,
          }}
        >
          <ShoppingCartOutlined style={{ fontSize: 64, color: "#cbd5e1", marginBottom: 16 }} />
          <Text style={{ color: "#64748b", fontSize: 16 }}>ไม่มีสินค้าในตะกร้า</Text>
          <Text style={{ color: "#94a3b8", fontSize: 14 }}>เลือกสินค้าจากเมนูเพื่อเพิ่มลงตะกร้า</Text>
        </div>
      )}
    </Drawer>
  );
}
