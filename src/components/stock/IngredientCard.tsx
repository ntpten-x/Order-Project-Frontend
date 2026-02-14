"use client";

import React, { useState } from "react";
import { Avatar, Button, Card, Space, Tag, Typography, message } from "antd";
import { CheckOutlined, PlusOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { Ingredients } from "../../types/api/stock/ingredients";
import { useCart } from "../../contexts/stock/CartContext";

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
      style={{ borderRadius: 16, height: "100%" }}
      styles={{ body: { display: "flex", flexDirection: "column", gap: 12 } }}
      cover={
        <div
          style={{
            height: 160,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          }}
        >
          <Avatar
            src={ingredient.img_url || undefined}
            shape="square"
            size={96}
            icon={<ShoppingCartOutlined />}
            style={{ borderRadius: 14 }}
          />
        </div>
      }
    >
      <Space size={8} wrap>
        <Tag color={ingredient.is_active ? "success" : "default"} style={{ margin: 0 }}>
          {ingredient.is_active ? "พร้อมสั่งซื้อ" : "ปิดใช้งาน"}
        </Tag>
        <Tag style={{ margin: 0 }}>{ingredient.unit?.display_name || "หน่วย"}</Tag>
      </Space>

      <div>
        <Title level={5} style={{ marginBottom: 4 }}>
          {ingredient.display_name}
        </Title>
        <Text type="secondary" style={{ fontSize: 12 }}>
          รหัส: {ingredient.ingredient_name}
        </Text>
      </div>

      <Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0, minHeight: 44 }}>
        {ingredient.description || "ไม่มีคำอธิบายเพิ่มเติม"}
      </Paragraph>

      <Button
        type={added ? "default" : "primary"}
        icon={added ? <CheckOutlined /> : <PlusOutlined />}
        block
        onClick={addItem}
        disabled={!ingredient.is_active}
      >
        {added ? "เพิ่มแล้ว" : "เพิ่มลงรายการซื้อ"}
      </Button>
    </Card>
  );
};

export default IngredientCard;
