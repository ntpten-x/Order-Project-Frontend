"use client";

import React, { useMemo } from "react";
import { Button, Card, Space, Tag, Typography } from "antd";
import {
  MinusOutlined,
  PlusOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";

import { useCart } from "../../contexts/stock/CartContext";
import { Ingredients } from "../../types/api/stock/ingredients";
import StockImageThumb from "./StockImageThumb";

const { Paragraph, Title } = Typography;

interface IngredientCardProps {
  ingredient: Ingredients;
  orderingEnabled?: boolean;
}

export default function IngredientCard({
  ingredient,
  orderingEnabled = true,
}: IngredientCardProps) {
  const { items, addToCart, updateQuantity } = useCart();

  const cartItem = useMemo(
    () => items.find((item) => item.ingredient.id === ingredient.id),
    [ingredient.id, items]
  );
  const quantity = cartItem?.quantity || 0;

  const handleAdd = () => addToCart(ingredient);
  const handleDecrease = () => updateQuantity(ingredient.id, quantity - 1);
  const handleIncrease = () => updateQuantity(ingredient.id, quantity + 1);

  return (
    <Card
      hoverable
      className="stock-catalog-card"
      bordered={false}
      data-testid={`stock-catalog-card-${ingredient.id}`}
    >
      <div className="stock-catalog-card-cover">
        <StockImageThumb
          src={ingredient.img_url}
          alt={ingredient.display_name}
          size={92}
          borderRadius={18}
        />
      </div>

      <div className="stock-catalog-card-body">
        <Space size={6} wrap>
          <Tag color="success" className="stock-catalog-tag">
            พร้อมสั่ง
          </Tag>
          <Tag className="stock-catalog-tag stock-catalog-tag-muted">
            {ingredient.unit?.display_name || "หน่วย"}
          </Tag>
        </Space>

        <div>
          <Title level={5} className="stock-catalog-title">
            {ingredient.display_name}
          </Title>
        </div>

        <Paragraph ellipsis={{ rows: 2 }} className="stock-catalog-description">
          {ingredient.description || "ไม่มีคำอธิบายเพิ่มเติม"}
        </Paragraph>

        {quantity > 0 ? (
          <div className="stock-catalog-stepper">
            <Button
              icon={<MinusOutlined />}
              onClick={handleDecrease}
              disabled={!orderingEnabled}
            />
            <div className="stock-catalog-stepper-value">
              <span>{quantity.toLocaleString()}</span>
              <small>{ingredient.unit?.display_name || "หน่วย"}</small>
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleIncrease}
              disabled={!orderingEnabled}
            />
          </div>
        ) : (
          <Button
            type="primary"
            icon={<ShoppingCartOutlined />}
            className="stock-catalog-add-button"
            onClick={handleAdd}
            disabled={!orderingEnabled}
            block
            data-testid={`stock-catalog-add-${ingredient.id}`}
          >
            เพิ่มลงรายการซื้อ
          </Button>
        )}
      </div>
    </Card>
  );
}
