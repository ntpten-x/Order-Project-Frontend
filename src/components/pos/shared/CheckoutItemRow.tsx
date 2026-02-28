"use client";

import React from "react";
import { Typography } from "antd";
import { ShopOutlined } from "@ant-design/icons";
import type { GroupedOrderItem } from "../../../utils/orderGrouping";
import type { CartItem, CartDetail } from "../../../contexts/pos/CartContext";
import type { Products } from "../../../types/api/pos/products";
import { resolveImageSource } from "../../../utils/image/source";
import { formatPrice } from "../../../utils/products/productDisplay.utils";
import { posColors, posComponentStyles } from "./style";

const { Text } = Typography;

export type CheckoutItemRowProps = {
  item: GroupedOrderItem<CartItem>;
  getProductUnitPrice: (product: Products) => number;
};

export const CheckoutItemRow = React.memo(function CheckoutItemRow({
  item,
  getProductUnitPrice,
}: CheckoutItemRowProps) {
  const unitPrice = getProductUnitPrice(item.product);
  const detailsTotal = (item.details || []).reduce(
    (sum: number, d: CartDetail) => sum + Number(d.extra_price || 0),
    0
  );
  const lineTotal = (unitPrice + detailsTotal) * item.quantity;

  return (
    <div key={item.id} style={posComponentStyles.checkoutItemRow}>
      <div style={posComponentStyles.checkoutItemImage}>
        {item.product.img_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={resolveImageSource(item.product.img_url) || undefined}
            alt={item.product.display_name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div style={posComponentStyles.checkoutItemImagePlaceholder}>
            <ShopOutlined style={{ fontSize: 16, color: posColors.primary, opacity: 0.5 }} />
          </div>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Row 1: Name and Line Total */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%" }}>
            <Text strong style={{ fontSize: 14, flex: 1, minWidth: 0, paddingRight: 8 }}>
              {item.product.display_name}
            </Text>
            <Text strong style={{ fontSize: 15, color: posColors.primary }}>
              {formatPrice(lineTotal)}
            </Text>
          </div>

          {/* Row 2: Unit Price */}
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
            <Text type="secondary" style={{ fontSize: 12 }}>ราคาอาหาร</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>{formatPrice(unitPrice)}</Text>
          </div>

          {/* Details (Modifiers/Extras) */}
          {item.details &&
            item.details.map((d: { detail_name: string; extra_price: number }, idx: number) => (
              <div key={idx} style={{ marginTop: 0 }}>
                <Text style={{ fontSize: 12, color: posColors.success, lineHeight: 1.4 }}>
                  + {d.detail_name} (+{formatPrice(Number(d.extra_price))})
                </Text>
              </div>
            ))}

          {/* Quantity */}
          <div style={{ marginTop: 4 }}>
            <Text style={{ fontSize: 12, fontWeight: 700, color: "#B45309" }}>จำนวน : {item.quantity}</Text>
          </div>

          {/* Notes */}
          {item.notes && (
            <div
              style={{
                marginTop: 8,
                padding: "6px 10px",
                background: "#fef2f2",
                borderRadius: 8,
                borderLeft: "3px solid #ef4444",
              }}
            >
              <Text italic style={{ fontSize: 12, color: "#ef4444" }}>โน้ต: {item.notes}</Text>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
