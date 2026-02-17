"use client";

import React from "react";
import { PlusOutlined, ShopOutlined } from "@ant-design/icons";
import { Button, Modal, Tag, Typography } from "antd";
import Image from "../../ui/image/SmartImage";
import { Products } from "../../../types/api/pos/products";
import { resolveImageSource } from "../../../utils/image/source";
import { formatPrice, getProductCategoryName, hasProductImage } from "../../../utils/products/productDisplay.utils";
import { posColors, posComponentStyles } from "./style";

const { Title, Text } = Typography;

type POSProductDetailModalProps = {
  open: boolean;
  product: Products | null;
  onClose: () => void;
  onAddToCart: (product: Products) => void;
  getProductUnitPrice: (product: Products) => number;
};

export function POSProductDetailModal({
  open,
  product,
  onClose,
  onAddToCart,
  getProductUnitPrice,
}: POSProductDetailModalProps) {
  return (
    <Modal
      title={
        <div style={posComponentStyles.modalTitleRow}>
          <div style={{ ...posComponentStyles.modalIconBase, background: posColors.primaryLight }}>
            <ShopOutlined style={{ color: posColors.primary, fontSize: 16 }} />
          </div>
          <span style={{ fontWeight: 700 }}>{product?.display_name}</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      centered
      width={560}
      footer={[
        <Button key="close" onClick={onClose} style={posComponentStyles.modalButtonLarge}>
          ปิด
        </Button>,
        <Button
          key="add"
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            if (!product) return;
            onAddToCart(product);
            onClose();
          }}
          style={{
            ...posComponentStyles.modalButtonLarge,
            background: `linear-gradient(135deg, ${posColors.success} 0%, #059669 100%)`,
            border: "none",
            fontWeight: 700,
          }}
        >
          เพิ่มลงตะกร้า
        </Button>,
      ]}
    >
      {product && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            style={{
              position: "relative",
              width: "100%",
              height: 240,
              borderRadius: 16,
              overflow: "hidden",
              border: `1px solid ${posColors.borderLight}`,
              background: `linear-gradient(135deg, ${posColors.primaryLight} 0%, #DBEAFE 100%)`,
            }}
          >
            {hasProductImage(product) ? (
              <Image
                alt={product.product_name}
                src={resolveImageSource(product.img_url) || undefined}
                fill
                style={{ objectFit: "cover" }}
                sizes="(max-width: 768px) 90vw, 560px"
              />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ShopOutlined style={{ fontSize: 56, color: posColors.primary, opacity: 0.4 }} />
              </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Tag
                style={{
                  border: "none",
                  background: posColors.primaryLight,
                  color: posColors.primary,
                  fontSize: 12,
                  padding: "2px 10px",
                  borderRadius: 999,
                  margin: 0,
                }}
              >
                {getProductCategoryName(product)}
              </Tag>
              <Title level={4} style={{ margin: "10px 0 0", color: posColors.text, lineHeight: 1.2 }}>
                {product.display_name}
              </Title>
            </div>
            <div style={{ textAlign: "right" }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                ราคา
              </Text>
              <div style={{ fontSize: 24, fontWeight: 800, color: posColors.primary, lineHeight: 1.1 }}>
                {formatPrice(getProductUnitPrice(product))}
              </div>
            </div>
          </div>

          <div style={{ background: "#fff", borderRadius: 14, padding: 14, border: `1px solid ${posColors.borderLight}` }}>
            <Text style={{ display: "block", marginBottom: 6, fontWeight: 700, color: posColors.textSecondary }}>
              รายละเอียดสินค้า
            </Text>
            <Text style={{ color: posColors.textSecondary, fontSize: 14, lineHeight: 1.6 }}>
              {product.description?.trim() ? product.description : "ไม่มีรายละเอียดสินค้า"}
            </Text>
          </div>
        </div>
      )}
    </Modal>
  );
}
