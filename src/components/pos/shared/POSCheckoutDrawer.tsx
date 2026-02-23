"use client";

import React from "react";
import { CloseOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { Button, Drawer, List, Typography } from "antd";
import { CartItem } from "../../../contexts/pos/CartContext";
import type { GroupedOrderItem } from "../../../utils/orderGrouping";
import { formatPrice } from "../../../utils/products/productDisplay.utils";
import { Products } from "../../../types/api/pos/products";
import { CheckoutItemRow } from "./CheckoutItemRow";
import { posColors, posComponentStyles } from "./style";

const { Title, Text } = Typography;

type POSCheckoutDrawerProps = {
  open: boolean;
  onClose: () => void;
  isProcessing: boolean;
  onConfirm: () => void;
  groupedCartItems: GroupedOrderItem<CartItem>[];
  categorySummary: Array<{ name: string; count: number }>;
  totalItems: number;
  discountAmount: number;
  finalPrice: number;
  getProductUnitPrice: (product: Products) => number;
  rootClassName?: string;
};

export function POSCheckoutDrawer({
  open,
  onClose,
  isProcessing,
  onConfirm,
  groupedCartItems,
  categorySummary,
  totalItems,
  discountAmount,
  finalPrice,
  getProductUnitPrice,
  rootClassName,
}: POSCheckoutDrawerProps) {
  return (
    <Drawer
      rootClassName={rootClassName}
      title={
        <div style={{ ...posComponentStyles.modalTitleRow, color: "#fff" }}>
          <ShoppingCartOutlined style={{ fontSize: 20 }} />
          <span style={{ fontWeight: 700, fontSize: 18 }}>สรุปรายการออเดอร์</span>
        </div>
      }
      width={420}
      open={open}
      onClose={onClose}
      closeIcon={<CloseOutlined style={{ color: "#fff" }} />}
      styles={{
        wrapper: { maxWidth: "100vw" },
        header: { background: `linear-gradient(145deg, ${posColors.primary} 0%, ${posColors.primaryDark} 100%)`, padding: "20px 24px" },
        body: { padding: "0 24px" },
        footer: { padding: "16px 24px" },
      }}
      footer={
        <div style={{ padding: "8px 0" }}>
          <Button
            type="primary"
            block
            size="large"
            loading={isProcessing}
            onClick={onConfirm}
            style={{
              background: `linear-gradient(135deg, ${posColors.success} 0%, #059669 100%)`,
              border: "none",
              height: 56,
              fontWeight: 700,
              fontSize: 18,
              borderRadius: 14,
              boxShadow: `0 8px 20px ${posColors.success}40`,
            }}
          >
            ยืนยันการสั่งออเดอร์
          </Button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 24, padding: "24px 0" }}>
        <section>
          <Title level={5} style={{ marginBottom: 16, color: posColors.text }}>
            รายการที่สั่ง
          </Title>
          <List
            itemLayout="horizontal"
            dataSource={groupedCartItems}
            renderItem={(item: GroupedOrderItem<CartItem>) => (
              <CheckoutItemRow item={item} getProductUnitPrice={getProductUnitPrice} />
            )}
          />
        </section>

        <section style={{ background: "#F8FAFC", padding: 16, borderRadius: 14, border: "1px solid #E2E8F0" }}>
          <Text strong style={{ fontSize: 14, marginBottom: 12, display: "block", color: posColors.textSecondary }}>
            สรุปตามหมวดหมู่
          </Text>
          {categorySummary.map(({ name, count }) => (
            <div key={name} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <Text type="secondary" style={{ fontSize: 13 }}>
                {name}
              </Text>
              <Text strong style={{ fontSize: 13 }}>
                {count} รายการ
              </Text>
            </div>
          ))}
        </section>

        <section style={{ background: "#fff", padding: "20px", borderTop: "2px solid #E2E8F0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
            <Text type="secondary" style={{ fontSize: 15 }}>
              รวมจำนวนทั้งหมด
            </Text>
            <Text strong style={{ fontSize: 15 }}>
              {totalItems} รายการ
            </Text>
          </div>
          {discountAmount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <Text type="secondary" style={{ fontSize: 15 }}>
                ส่วนลด
              </Text>
              <Text strong style={{ fontSize: 15, color: "#ef4444" }}>
                -{formatPrice(discountAmount)}
              </Text>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontSize: 20, fontWeight: 700, color: posColors.text }}>ยอดรวมสุทธิ</Text>
            <Text style={{ fontSize: 32, fontWeight: 800, color: posColors.primary }}>{formatPrice(finalPrice)}</Text>
          </div>
        </section>
      </div>
    </Drawer>
  );
}
