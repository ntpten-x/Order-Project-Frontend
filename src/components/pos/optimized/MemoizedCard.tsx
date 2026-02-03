"use client";

import React, { memo, useCallback, CSSProperties, ReactNode } from 'react';
import { Button, Typography } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import Image from 'next/image';

const { Text } = Typography;

/**
 * Memoized Product Card Component
 * Redesigned for "Soft Modern Clarity" and Mobile friendliness
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

// Format price utility
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
  // Stable callbacks
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
      className={`product-card-container ${className || ''}`}
      style={{ ...style }}
      role="article"
      aria-label={`สินค้า: ${product.display_name}`}
    >
      <div className="product-card-inner">
        {/* Image Section */}
        <div className="product-image-wrapper">
          {product.img_url ? (
            <Image
              src={product.img_url}
              alt={product.display_name}
              fill
              style={{ objectFit: 'cover' }}
              sizes="80px"
              loading="lazy"
            />
          ) : (
            <div className="image-placeholder">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.2, color: '#1890ff' }}>
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
              </svg>
            </div>
          )}
          {!product.is_active && (
             <div className="status-overlay">
                <Text style={{ color: 'white', fontSize: 10, fontWeight: 600 }}>ไม่ใช้งาน</Text>
             </div>
          )}
        </div>

        {/* Content Section */}
        <div className="product-content">
          <div className="product-header">
            <Text
              className="product-title"
              ellipsis={{ tooltip: product.display_name }}
            >
              {product.display_name}
            </Text>
            {product.is_active ? (
               <div className="status-dot active" />
            ) : (
               <div className="status-dot inactive" />
            )}
          </div>
          
          <Text
            className="product-subtitle"
            ellipsis={{ tooltip: product.product_name }}
          >
            {product.product_name}
          </Text>

          <div className="product-tags">
             <div className="price-badge">
               {formatPrice(product.price)}
             </div>
             {product.category && (
               <div className="info-badge category">
                  {product.category.display_name}
               </div>
             )}
          </div>
        </div>

        {/* Actions Section */}
        <div className="product-actions">
          <button 
             className="action-btn edit-btn"
             onClick={handleEdit}
             aria-label={`แก้ไข ${product.display_name}`}
          >
             <EditOutlined />
          </button>
          <button 
             className="action-btn delete-btn"
             onClick={handleDelete}
             aria-label={`ลบ ${product.display_name}`}
          >
             <DeleteOutlined />
          </button>
        </div>
      </div>

      <style jsx>{`
        .product-card-container {
           background: white;
           border-radius: 20px;
           margin-bottom: 16px;
           box-shadow: 0 4px 20px rgba(0,0,0,0.03);
           border: 1px solid rgba(0,0,0,0.02);
           transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
           cursor: pointer;
           overflow: hidden;
           position: relative;
        }
        .product-card-container:hover {
           transform: translateY(-4px);
           box-shadow: 0 12px 28px rgba(0,0,0,0.08);
           border-color: rgba(0,0,0,0.05);
        }
        .product-card-inner {
           display: flex;
           align-items: center;
           padding: 12px;
           gap: 16px;
        }
        .product-image-wrapper {
           width: 72px;
           height: 72px;
           border-radius: 16px;
           overflow: hidden;
           position: relative;
           flex-shrink: 0;
           background: #f8fafc;
           box-shadow: inset 0 0 0 1px rgba(0,0,0,0.04);
        }
        .image-placeholder {
           width: 100%;
           height: 100%;
           display: flex;
           align-items: center;
           justify-content: center;
           background: linear-gradient(135deg, #f0f7ff 0%, #e6fffb 100%);
        }
        .status-overlay {
           position: absolute;
           bottom: 0;
           left: 0;
           right: 0;
           background: rgba(0,0,0,0.6);
           text-align: center;
           padding: 2px 0;
           backdrop-filter: blur(2px);
        }
        .product-content {
           flex: 1;
           min-width: 0;
           display: flex;
           flex-direction: column;
           gap: 4px;
        }
        .product-header {
           display: flex;
           align-items: center;
           justify-content: space-between;
           gap: 8px;
        }
        .product-title {
           font-size: 16px;
           font-weight: 700;
           color: #1e293b;
           line-height: 1.3;
        }
        .status-dot {
           width: 8px;
           height: 8px;
           border-radius: 50%;
           flex-shrink: 0;
        }
        .status-dot.active {
           background-color: #10b981;
           box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
        }
        .status-dot.inactive {
           background-color: #ef4444;
           box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
        }
        .product-subtitle {
           font-size: 13px;
           color: #64748b;
           margin-bottom: 2px;
        }
        .product-tags {
           display: flex;
           gap: 8px;
           align-items: center;
           flex-wrap: wrap;
        }
        .price-badge {
           background: #eff6ff;
           color: #2563eb;
           font-weight: 700;
           font-size: 13px;
           padding: 2px 10px;
           border-radius: 8px;
        }
        .info-badge {
           background: #f1f5f9;
           color: #64748b;
           font-size: 11px;
           padding: 2px 8px;
           border-radius: 6px;
        }
        .product-actions {
           display: flex;
           flex-direction: column;
           gap: 8px;
        }
        .action-btn {
           width: 40px;
           height: 40px;
           border-radius: 12px;
           border: none;
           display: flex;
           align-items: center;
           justify-content: center;
           cursor: pointer;
           transition: all 0.2s;
           font-size: 16px;
        }
        .edit-btn {
           background: #f0f9ff;
           color: #0ea5e9;
        }
        .edit-btn:hover {
           background: #e0f2fe;
           transform: scale(1.05);
        }
        .delete-btn {
           background: #fef2f2;
           color: #ef4444;
        }
        .delete-btn:hover {
           background: #fee2e2;
           transform: scale(1.05);
        }
        @media (max-width: 480px) {
           .product-image-wrapper {
              width: 64px;
              height: 64px;
           }
           .product-title {
              font-size: 15px;
           }
           .action-btn {
              width: 36px;
              height: 36px;
              font-size: 14px;
           }
           .product-card-inner {
              padding: 10px;
              gap: 12px;
           }
        }
      `}</style>
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

export const StatsCard = memo(function StatsCard({
  totalProducts,
  activeProducts,
  inactiveProducts,
}: StatsCardProps) {
  return (
    <div className="stats-card-container" role="region" aria-label="สถิติสินค้า">
      <div className="stat-item total">
        <span className="stat-value">{totalProducts}</span>
        <span className="stat-label">ทั้งหมด</span>
      </div>
      <div className="divider" />
      <div className="stat-item active">
        <span className="stat-value">{activeProducts}</span>
        <span className="stat-label">ใช้งาน</span>
      </div>
      <div className="divider" />
      <div className="stat-item inactive">
        <span className="stat-value">{inactiveProducts}</span>
        <span className="stat-label">ไม่ใช้งาน</span>
      </div>

      <style jsx>{`
         .stats-card-container {
            display: flex;
            justify-content: space-around;
            align-items: center;
            background: linear-gradient(145deg, #ffffff, #f8fafc);
            margin: 0 0 24px 0;
            padding: 24px;
            border-radius: 24px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.04);
            border: 1px solid rgba(0,0,0,0.03);
         }
         .stat-item {
            text-align: center;
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
         }
         .stat-value {
            font-size: 32px;
            font-weight: 800;
            line-height: 1;
            letter-spacing: -1px;
         }
         .stat-item.total .stat-value { color: #3b82f6; }
         .stat-item.active .stat-value { color: #10b981; }
         .stat-item.inactive .stat-value { color: #ef4444; }
         
         .stat-label {
            font-size: 13px;
            color: #64748b;
            font-weight: 500;
         }
         .divider {
            width: 1px;
            height: 48px;
            background: #e2e8f0;
         }
         @media (max-width: 480px) {
            .stats-card-container {
               padding: 16px;
               margin-bottom: 20px;
            }
            .stat-value {
               font-size: 24px;
            }
            .divider {
               height: 32px;
            }
         }
      `}</style>
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
    <div className="empty-state-container">
      <div className="empty-icon">
         <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#cbd5e1' }}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
         </svg>
      </div>
      <h3 className="empty-title">{title}</h3>
      <p className="empty-desc">{description}</p>
      {showAdd && (
        <Button 
          type="primary" 
          onClick={onAdd}
          size="large"
          className="add-button"
        >
          เพิ่มข้อมูลใหม่
        </Button>
      )}

      <style jsx>{`
         .empty-state-container {
            padding: 80px 24px;
            background: white;
            border-radius: 24px;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            border: 2px dashed #e2e8f0;
         }
         .empty-icon {
            margin-bottom: 24px;
            background: #f8fafc;
            width: 96px;
            height: 96px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
         }
         .empty-title {
            font-size: 18px;
            font-weight: 700;
            color: #1e293b;
            margin: 0 0 8px 0;
         }
         .empty-desc {
            font-size: 15px;
            color: #64748b;
            margin: 0 0 32px 0;
         }
         :global(.add-button) {
            height: 48px;
            border-radius: 12px;
            padding: 0 32px;
            font-weight: 600;
            background: #3b82f6;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
            border: none;
         }
         :global(.add-button:hover) {
            background: #2563eb !important;
            transform: translateY(-2px);
         }
      `}</style>
    </div>
  );
});

export default ProductCard;
