"use client";

import React from "react";
import { Button, List, Tag, Typography } from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  MinusOutlined,
  PlusOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import SmartImage from "../../ui/image/SmartImage";
import { CartDetail, makeSelectCartItem, useCartStore } from "../../../store/useCartStore";
import { resolveImageSource } from "../../../utils/image/source";
import { formatPrice } from "../../../utils/products/productDisplay.utils";
import { posComponentStyles } from "./style";

const { Text } = Typography;

export type CartItemRowProps = {
  cartItemId: string;
  onOpenNote: (id: string, name: string, note: string) => void;
  onOpenDetail: (
    id: string,
    name: string,
    details?: { detail_name: string; extra_price: number; topping_id?: string }[]
  ) => void;
};

export const CartItemRow = React.memo(function CartItemRow({
  cartItemId,
  onOpenNote,
  onOpenDetail,
}: CartItemRowProps) {
  const itemSelector = React.useMemo(() => makeSelectCartItem(cartItemId), [cartItemId]);
  const item = useCartStore(itemSelector);
  const orderMode = useCartStore((state) => state.orderMode);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeFromCart = useCartStore((state) => state.removeFromCart);

  if (!item) {
    return null;
  }

  // Subscribe to a single cart row so changes in one item do not rerender the full list.
  const unitPrice =
    orderMode === "DELIVERY"
      ? Number(item.product.price_delivery ?? item.product.price)
      : Number(item.product.price);
  const detailsTotal = (item.details || []).reduce(
    (sum: number, detail: CartDetail) => sum + Number(detail.extra_price || 0),
    0
  );
  const itemDiscountAmount = Number(item.discount || 0);
  const lineTotal = Math.max(0, (unitPrice + detailsTotal) * item.quantity - itemDiscountAmount);
  const productName = item.product.display_name || "สินค้า";
  const categoryName = item.product.category?.display_name || "ทั่วไป";

  return (
    <List.Item key={item.cart_item_id} style={posComponentStyles.cartItemContainer} className="cart-item-hover">
      <div style={posComponentStyles.cartItemRow}>
        <div style={{ flexShrink: 0 }}>
          {item.product.img_url ? (
            <div style={{ ...posComponentStyles.cartItemImage, position: "relative" }}>
              <SmartImage
                src={resolveImageSource(item.product.img_url) || undefined}
                alt={productName}
                fill
                style={{ objectFit: "cover" }}
                sizes="72px"
              />
            </div>
          ) : (
            <div style={posComponentStyles.cartItemImagePlaceholder}>
              <ShopOutlined style={{ fontSize: 24, color: "#94a3b8" }} />
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <Text
                style={{
                  fontWeight: 600,
                  fontSize: 15,
                  color: "#1e293b",
                  display: "block",
                  lineHeight: 1.2,
                  marginBottom: 4,
                }}
              >
                {productName}
              </Text>
              <Tag style={posComponentStyles.cartItemTag}>{categoryName}</Tag>
            </div>
            <Text
              style={{
                fontWeight: 700,
                fontSize: 16,
                color: "#10b981",
                whiteSpace: "nowrap",
                marginLeft: 8,
              }}
            >
              {formatPrice(lineTotal)}
            </Text>
          </div>

          {item.details && item.details.length > 0 && (
            <div style={{ marginTop: 2, display: "flex", flexDirection: "column", gap: 0 }}>
              {item.details.map((detail: CartDetail, index: number) => (
                <Text key={index} style={{ fontSize: 13, color: "#10B981", lineHeight: 1.4 }}>
                  + {detail.detail_name} (+{formatPrice(Number(detail.extra_price || 0))})
                </Text>
              ))}
            </div>
          )}

          {item.notes && (
            <div style={posComponentStyles.cartItemNote}>
              <Text style={{ fontSize: 11, color: "#ef4444" }}>โน้ต: {item.notes}</Text>
            </div>
          )}

          <div
            className="pos-cart-item-controls"
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}
          >
            <div className="pos-cart-qty-control" style={posComponentStyles.cartItemQtyControl}>
              <Button
                type="text"
                size="small"
                icon={<MinusOutlined style={{ fontSize: 10 }} />}
                className="pos-cart-icon-btn pos-cart-qty-btn"
                aria-label="ลดจำนวน"
                onClick={() => updateQuantity(item.cart_item_id, item.quantity - 1)}
                style={{ borderRadius: 10, background: "white", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
              />
              <Text style={{ margin: "0 8px", fontWeight: 600, minWidth: 16, textAlign: "center", fontSize: 13 }}>
                {item.quantity}
              </Text>
              <Button
                type="text"
                size="small"
                icon={<PlusOutlined style={{ fontSize: 10 }} />}
                className="pos-cart-icon-btn pos-cart-qty-btn"
                aria-label="เพิ่มจำนวน"
                onClick={() => updateQuantity(item.cart_item_id, item.quantity + 1)}
                style={{ borderRadius: 10, background: "#10b981", color: "white" }}
              />
            </div>

            <div className="pos-cart-action-row" style={{ display: "flex", gap: 6 }}>
              <Button
                type="text"
                icon={<EditOutlined />}
                size="small"
                className="pos-cart-icon-btn pos-cart-action-btn"
                aria-label="แก้ไขโน้ต"
                onClick={() => onOpenNote(item.cart_item_id, productName, item.notes || "")}
                style={{ color: "#64748b", background: "#f1f5f9", borderRadius: 10 }}
              />
              <Button
                type="text"
                icon={<PlusOutlined />}
                size="small"
                className="pos-cart-icon-btn pos-cart-action-btn"
                aria-label="เพิ่มรายละเอียด"
                onClick={() => onOpenDetail(item.cart_item_id, productName, item.details)}
                style={{ color: "#10b981", background: "#ecfdf5", borderRadius: 10 }}
              />
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                size="small"
                className="pos-cart-icon-btn pos-cart-action-btn"
                aria-label="ลบออกจากตะกร้า"
                onClick={() => removeFromCart(item.cart_item_id)}
                style={{ background: "#fef2f2", borderRadius: 10 }}
              />
            </div>
          </div>
        </div>
      </div>
    </List.Item>
  );
});
