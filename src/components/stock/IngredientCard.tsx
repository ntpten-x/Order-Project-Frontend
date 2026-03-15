"use client";

import React, { useMemo } from "react";
import { Button, Tag, Typography } from "antd";
import { MinusOutlined, PlusOutlined, ShopOutlined } from "@ant-design/icons";

import { useCart } from "../../contexts/stock/CartContext";
import { Ingredients } from "../../types/api/stock/ingredients";
import { posColors, posLayoutStyles } from "../pos/shared/style";
import Image from "../ui/image/SmartImage";
import { resolveImageSource } from "../../utils/image/source";

const { Text } = Typography;

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

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(ingredient);
  };
  const handleDecrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateQuantity(ingredient.id, quantity - 1);
  };
  const handleIncrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateQuantity(ingredient.id, quantity + 1);
  };

  return (
    <article
      className="pos-product-card pos-fade-in"
      style={posLayoutStyles.productCard}
      role="button"
      tabIndex={0}
      aria-label={`วัตถุดิบ ${ingredient.display_name}`}
    >
      <div style={posLayoutStyles.productImage} className="pos-product-image-mobile">
        {ingredient.img_url ? (
          <Image
            alt={ingredient.display_name}
            src={resolveImageSource(ingredient.img_url) || undefined}
            fill
            style={{ objectFit: "cover" }}
            sizes="(max-width: 768px) 50vw, 220px"
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: `linear-gradient(135deg, ${posColors.primaryLight} 0%, #DBEAFE 100%)`,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ShopOutlined style={{ fontSize: 48, color: posColors.primary, opacity: 0.4 }} />
          </div>
        )}
      </div>

      <div style={posLayoutStyles.productInfo} className="pos-product-info-mobile">
        <Text ellipsis style={posLayoutStyles.productName} className="pos-product-name-mobile">
          {ingredient.display_name}
        </Text>
        <Tag
          color="blue"
          style={{
            fontSize: 10,
            marginBottom: 0,
            borderRadius: 6,
            border: "none",
            background: posColors.primaryLight,
            color: posColors.primary,
          }}
        >
          {ingredient.category?.display_name || "ไม่มีหมวดหมู่"}
        </Tag>
        <div style={posLayoutStyles.productFooter} className="pos-product-footer-mobile">
          
          {quantity > 0 ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%" }}>
              <Button
                size="small"
                icon={<MinusOutlined />}
                onClick={handleDecrease}
                disabled={!orderingEnabled}
              />
              <Text strong style={{ minWidth: 16, textAlign: "center" }}>{quantity}</Text>
              <Button
                size="small"
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleIncrease}
                disabled={!orderingEnabled}
              />
            </div>
          ) : (
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              className="pos-add-button pos-add-button-mobile"
              style={posLayoutStyles.addButton}
              onClick={handleAdd}
              disabled={!orderingEnabled}
            >
              เพิ่ม
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
