"use client";

import React, { useState } from "react";
import { Avatar, Button, Card, Space, Tag, Typography, message } from "antd";
import { CheckOutlined, PlusOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { Ingredients } from "../../types/api/stock/ingredients";
import { useCart } from "../../contexts/stock/CartContext";
import { resolveImageSource } from "../../utils/image/source";

const { Paragraph, Text, Title } = Typography;

interface IngredientCardProps {
  ingredient: Ingredients;
}

const IngredientCard: React.FC<IngredientCardProps> = ({ ingredient }) => {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  const addItem = () => {
    addToCart(ingredient);
    setAdded(true);
    message.success(`เพิ่ม ${ingredient.display_name} ลงรายการที่ต้องซื้อแล้ว`);
    window.setTimeout(() => setAdded(false), 1200);
  };

  return (
    <Card
      hoverable
      style={{ borderRadius: 14, height: "100%", borderColor: "#e5e7eb" }}
      styles={{
        body: {
          display: "flex",
          flexDirection: "column",
          gap: 10,
          padding: 14,
        },
      }}
      cover={
        <div
          style={{
            height: 148,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)",
            borderTopLeftRadius: 14,
            borderTopRightRadius: 14,
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <Avatar
            src={resolveImageSource(ingredient.img_url) || undefined}
            shape="square"
            size={88}
            icon={<ShoppingCartOutlined />}
            style={{ borderRadius: 12 }}
          />
        </div>
      }
    >
      <Space size={6} wrap>
        <Tag color={ingredient.is_active ? "success" : "default"} style={{ margin: 0 }}>
          {ingredient.is_active ? "พร้อมสั่งซื้อ" : "ปิดใช้งาน"}
        </Tag>
        <Tag style={{ margin: 0 }}>{ingredient.unit?.display_name || "หน่วย"}</Tag>
      </Space>

      <div>
        <Title level={5} style={{ margin: 0, lineHeight: 1.35 }}>
          {ingredient.display_name}
        </Title>
        <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 2 }}>
          รหัส: {ingredient.ingredient_name}
        </Text>
      </div>

      <Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0, minHeight: 42, color: "#4b5563" }}>
        {ingredient.description || "ไม่มีคำอธิบายเพิ่มเติม"}
      </Paragraph>

      <Button
        type={added ? "default" : "primary"}
        icon={added ? <CheckOutlined /> : <PlusOutlined />}
        block
        size="large"
        onClick={addItem}
        disabled={!ingredient.is_active}
        style={{
          marginTop: "auto",
          borderRadius: 10,
          fontWeight: 600,
          height: 42,
        }}
      >
        {added ? "เพิ่มแล้ว" : "เพิ่มลงรายการซื้อ"}
      </Button>
    </Card>
  );
};

export default IngredientCard;
