"use client";

import React from "react";
import { Button, Empty, Typography } from "antd";
import { ShopOutlined } from "@ant-design/icons";
import { posColors } from "./style";

const { Title, Text } = Typography;

type POSProductsEmptyStateProps = {
  query: string;
  onClearSearch: () => void;
  onGoManageProducts: () => void;
};

export function POSProductsEmptyState({ query, onClearSearch, onGoManageProducts }: POSProductsEmptyStateProps) {
  const hasQuery = query.trim().length > 0;

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 24,
        padding: "80px 24px",
        textAlign: "center",
        boxShadow: "0 4px 24px rgba(0,0,0,0.04)",
      }}
    >
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        imageStyle={{ height: 120 }}
        description={
          <div style={{ marginTop: 20 }}>
            <Title level={4} style={{ marginBottom: 8, color: posColors.text }}>
              {hasQuery ? "ไม่พบสินค้า" : "ยังไม่มีข้อมูลสินค้า"}
            </Title>
            <Text type="secondary" style={{ fontSize: 15 }}>
              {hasQuery
                ? `ไม่พบสินค้า${hasQuery ? ` สำหรับ "${query}"` : ""} ลองเปลี่ยนคำค้นหา หรือเลือกหมวดอื่น`
                : "กรุณาเพิ่มสินค้าก่อนใช้งาน"}
            </Text>
          </div>
        }
      >
        {hasQuery ? (
          <Button
            size="large"
            onClick={onClearSearch}
            style={{
              height: 52,
              padding: "0 40px",
              borderRadius: 16,
              fontSize: 16,
              fontWeight: 700,
              marginTop: 20,
              background: "#fff",
              border: `1px solid ${posColors.border}`,
              color: posColors.text,
            }}
          >
            ล้างคำค้นหา
          </Button>
        ) : (
          <Button
            type="primary"
            size="large"
            icon={<ShopOutlined />}
            style={{
              height: 52,
              padding: "0 40px",
              borderRadius: 16,
              fontSize: 16,
              fontWeight: 600,
              marginTop: 20,
              background: `linear-gradient(135deg, ${posColors.primary} 0%, ${posColors.primaryDark} 100%)`,
              border: "none",
              boxShadow: "0 8px 20px rgb(var(--color-primary-rgb) / 0.25)",
            }}
            onClick={onGoManageProducts}
          >
            ไปหน้าจัดการสินค้า
          </Button>
        )}
      </Empty>
    </div>
  );
}
