"use client";

import React from "react";
import { Button, Tag, Typography } from "antd";
import { PlusOutlined, ShopOutlined } from "@ant-design/icons";
import Image from "../../ui/image/SmartImage";
import { Products } from "../../../types/api/pos/products";
import { posColors, posLayoutStyles } from "./style";
import { resolveImageSource } from "../../../utils/image/source";
import { formatPrice, getProductCategoryName, hasProductImage } from "../../../utils/products/productDisplay.utils";

const { Text } = Typography;

type POSProductCardProps = {
  index: number;
  product: Products;
  onOpenProductModal: (product: Products) => void;
  onAddToCart: (product: Products) => void;
  getProductUnitPrice: (product: Products) => number;
};

export function POSProductCard({
  index,
  product,
  onOpenProductModal,
  onAddToCart,
  getProductUnitPrice,
}: POSProductCardProps) {
  return (
    <article
      key={product.id}
      className={`pos-product-card pos-fade-in pos-delay-${(index % 4) + 1}`}
      style={posLayoutStyles.productCard}
      onClick={() => onOpenProductModal(product)}
      role="button"
      tabIndex={0}
      aria-label={`ดูรายละเอียด ${product.display_name}`}
      aria-haspopup="dialog"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenProductModal(product);
        }
      }}
    >
      <div style={posLayoutStyles.productImage} className="pos-product-image-mobile">
        {hasProductImage(product) ? (
          <Image
            alt={product.product_name}
            src={resolveImageSource(product.img_url) || undefined}
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
          {product.display_name}
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
          {getProductCategoryName(product)}
        </Tag>
        <div style={posLayoutStyles.productFooter} className="pos-product-footer-mobile">
          <Text style={posLayoutStyles.productPrice} className="pos-product-price-mobile">
            {formatPrice(getProductUnitPrice(product))}
          </Text>
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            className="pos-add-button pos-add-button-mobile"
            style={posLayoutStyles.addButton}
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
          >
            เพิ่ม
          </Button>
        </div>
      </div>
    </article>
  );
}
