"use client";

import React, { memo, useCallback, CSSProperties, ReactNode } from 'react';
import { Button, Tag, Typography } from 'antd';
import { EditOutlined, DeleteOutlined, CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';
import Image from 'next/image';

const { Text } = Typography;

/**
 * Memoized Product Card Component
 * Following vercel-react-best-practices:
 * - rerender-memo: Extract expensive work into memoized components
 * - rerender-functional-setstate: Use callbacks for stable references
 * 
 * Following ui-ux-pro-max:
 * - cursor-pointer: Add cursor-pointer to clickable elements
 * - hover feedback: Visual feedback on interaction
 * - touch-target-size: Minimum 44x44px touch targets
 */

interface ProductCardData {
  id: string;
  product_name: string;
  display_name: string;
  price: string | number;
  img_url?: string | null;
  is_active: boolean;
  category?: { display_name: string } | null;
  unit?: { display_name: string } | null;
}

interface ProductCardProps {
  product: ProductCardData;
  onEdit: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  style?: CSSProperties;
  className?: string;
}

// Extracted static styles - following rendering-hoist-jsx
const cardStyles: Record<string, CSSProperties> = {
  container: {
    background: 'white',
    borderRadius: 16,
    padding: '16px',
    marginBottom: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    transition: 'box-shadow 0.2s ease, transform 0.2s ease',
    cursor: 'pointer',
  },
  containerHover: {
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
  },
  inner: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  imageContainer: {
    width: 64,
    height: 64,
    borderRadius: 14,
    border: '2px solid #f0f0f0',
    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
    flexShrink: 0,
    overflow: 'hidden',
    position: 'relative' as const,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  tags: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap' as const,
  },
  actions: {
    display: 'flex',
    gap: 8,
  },
  editButton: {
    borderRadius: 10,
    color: '#1890ff',
    background: '#e6f7ff',
    minWidth: 44,
    minHeight: 44,
  },
  deleteButton: {
    borderRadius: 10,
    background: '#fff2f0',
    minWidth: 44,
    minHeight: 44,
  },
  tag: {
    borderRadius: 8,
    margin: 0,
    fontSize: 11,
  },
};

// Format price utility - hoisted outside component
const formatPrice = (price: number | string): string => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return `฿${numPrice.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

export const ProductCard = memo(function ProductCard({
  product,
  onEdit,
  onDelete,
  style,
  className,
}: ProductCardProps) {
  // Stable callbacks - following rerender-functional-setstate
  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(product.id);
  }, [onEdit, product.id]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(product.id, product.display_name);
  }, [onDelete, product.id, product.display_name]);

  return (
    <div
      className={`product-card ${className || ''}`}
      style={{ ...cardStyles.container, ...style }}
      role="article"
      aria-label={`สินค้า: ${product.display_name}`}
    >
      <div style={cardStyles.inner}>
        {/* Image */}
        <div style={cardStyles.imageContainer}>
          {product.img_url ? (
            <Image
              src={product.img_url}
              alt={product.display_name}
              fill
              style={{ objectFit: 'cover' }}
              sizes="64px"
              loading="lazy"
            />
          ) : (
            <div style={cardStyles.imagePlaceholder}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#1890ff" opacity={0.5}>
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
              </svg>
            </div>
          )}
        </div>

        {/* Info */}
        <div style={cardStyles.content}>
          <div style={cardStyles.header}>
            <Text
              strong
              style={{ fontSize: 16, color: '#1a1a2e' }}
              ellipsis={{ tooltip: product.display_name }}
            >
              {product.display_name}
            </Text>
            {product.is_active ? (
              <CheckCircleFilled 
                style={{ color: '#52c41a', fontSize: 14 }} 
                aria-label="สถานะ: ใช้งาน"
              />
            ) : (
              <CloseCircleFilled 
                style={{ color: '#ff4d4f', fontSize: 14 }} 
                aria-label="สถานะ: ไม่ใช้งาน"
              />
            )}
          </div>
          <Text
            type="secondary"
            style={{ fontSize: 13, display: 'block', marginBottom: 6 }}
            ellipsis={{ tooltip: product.product_name }}
          >
            {product.product_name}
          </Text>
          <div style={cardStyles.tags}>
            <Tag color="green" style={cardStyles.tag}>
              {formatPrice(product.price)}
            </Tag>
            <Tag color="blue" style={cardStyles.tag}>
              {product.category?.display_name || '-'}
            </Tag>
            <Tag color="cyan" style={cardStyles.tag}>
              {product.unit?.display_name || '-'}
            </Tag>
          </div>
        </div>

        {/* Actions */}
        <div style={cardStyles.actions}>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={handleEdit}
            style={cardStyles.editButton}
            aria-label={`แก้ไข ${product.display_name}`}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={handleDelete}
            style={cardStyles.deleteButton}
            aria-label={`ลบ ${product.display_name}`}
          />
        </div>
      </div>
    </div>
  );
});

/**
 * Memoized Stats Card Component
 */
interface StatsCardProps {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
}

const statsCardStyles: Record<string, CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    background: 'white',
    margin: '0 16px 20px',
    padding: '20px',
    borderRadius: 20,
    boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
  },
  divider: {
    width: 1,
    height: 40,
    background: '#f0f0f0',
  },
  item: {
    textAlign: 'center' as const,
    flex: 1,
  },
  number: {
    fontSize: 28,
    fontWeight: 700,
    display: 'block',
    marginBottom: 4,
    lineHeight: 1.2,
  },
  label: {
    fontSize: 13,
    color: '#8c8c8c',
  },
};

export const StatsCard = memo(function StatsCard({
  totalProducts,
  activeProducts,
  inactiveProducts,
}: StatsCardProps) {
  return (
    <div 
      style={statsCardStyles.container}
      role="region"
      aria-label="สถิติสินค้า"
    >
      <div style={statsCardStyles.item}>
        <span style={{ ...statsCardStyles.number, color: '#1890ff' }}>
          {totalProducts}
        </span>
        <Text style={statsCardStyles.label}>ทั้งหมด</Text>
      </div>
      <div style={statsCardStyles.divider} aria-hidden="true" />
      <div style={statsCardStyles.item}>
        <span style={{ ...statsCardStyles.number, color: '#52c41a' }}>
          {activeProducts}
        </span>
        <Text style={statsCardStyles.label}>ใช้งาน</Text>
      </div>
      <div style={statsCardStyles.divider} aria-hidden="true" />
      <div style={statsCardStyles.item}>
        <span style={{ ...statsCardStyles.number, color: '#ff4d4f' }}>
          {inactiveProducts}
        </span>
        <Text style={statsCardStyles.label}>ไม่ใช้งาน</Text>
      </div>
    </div>
  );
});

/**
 * Memoized Empty State Component
 */
interface EmptyStateProps {
  onAdd: () => void;
  showAdd?: boolean;
  title?: string;
  description?: string;
  icon?: ReactNode;
}

export const EmptyState = memo(function EmptyState({
  onAdd,
  showAdd = true,
  title = 'ยังไม่มีข้อมูล',
  description = 'เริ่มต้นเพิ่มข้อมูลแรกของคุณ',
}: EmptyStateProps) {
  return (
    <div
      style={{
        padding: '60px 20px',
        background: 'white',
        borderRadius: 20,
        margin: '0 16px',
        textAlign: 'center',
      }}
      role="status"
      aria-live="polite"
    >
      <div style={{ marginBottom: 16 }}>
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" opacity={0.3}>
          <rect x="8" y="8" width="48" height="48" rx="8" stroke="#8c8c8c" strokeWidth="2" strokeDasharray="4 4"/>
          <path d="M32 24v16M24 32h16" stroke="#8c8c8c" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      <Text type="secondary" style={{ fontSize: 15, display: 'block', marginBottom: 4 }}>
        {title}
      </Text>
      <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: showAdd ? 16 : 0 }}>
        {description}
      </Text>
      {showAdd && (
        <Button 
          type="primary" 
          onClick={onAdd}
          style={{ borderRadius: 8, fontWeight: 500 }}
          aria-label="เพิ่มข้อมูลใหม่"
        >
          เพิ่มข้อมูล
        </Button>
      )}
    </div>
  );
});

export default ProductCard;
