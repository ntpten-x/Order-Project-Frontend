"use client";

import React from "react";
import Image from "next/image";
import { Typography } from "antd";
import { ShopOutlined } from "@ant-design/icons";
import {
    createManagePageStyles,
    ManagePageHeader,
    ManageActionButtons,
} from "../../../../../../theme/pos/manage.shared";

const { Text } = Typography;

const { pageStyles, ManagePageStyles } = createManagePageStyles({
    focusColor: "#4F46E5",
    focusShadow: "rgba(79, 70, 229, 0.1)",
    switchGradient: "linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)",
});

export { pageStyles, ManagePageStyles };

// ============ HEADER COMPONENT ============

interface HeaderProps {
    isEdit: boolean;
    onBack: () => void;
    onDelete?: () => void;
}

export const PageHeader = ({ isEdit, onBack, onDelete }: HeaderProps) => (
    <ManagePageHeader
        pageStyles={pageStyles}
        isEdit={isEdit}
        onBack={onBack}
        onDelete={onDelete}
        titleCreate="เพิ่มสินค้าใหม่"
        titleEdit="แก้ไขข้อมูลสินค้า"
    />
);

// ============ PRODUCT PREVIEW COMPONENT ============

interface ProductPreviewProps {
    name?: string;
    productName?: string;
    description?: string;
    imageUrl?: string;
    price?: number;
    priceDelivery?: number;
    category?: string;
    unit?: string;
}

import { Tag } from "antd";
import { CheckCircleFilled } from "@ant-design/icons";

export const ProductPreview = ({ name, productName, imageUrl, price, priceDelivery, category, unit }: ProductPreviewProps) => (
    <div style={{
        marginTop: 24,
        marginBottom: 24,
        padding: 20,
        background: "#F8FAFC", // Soft neutral background
        borderRadius: 20,
        border: "1px dashed #E2E8F0"
    }}>
         <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 13, textAlign: 'center' }}>
            ตัวอย่างการแสดงผล (Live Preview)
        </Text>
        
        <div style={{
            width: "100%",
            maxWidth: 280,
            margin: "0 auto",
            background: "white",
            borderRadius: 20,
            overflow: "hidden",
            boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
            border: "1px solid #F1F5F9",
            transition: "all 0.3s ease"
        }}>
             {/* Card Inner */}
            <div style={{
                 padding: 12,
                 display: 'flex',
                 gap: 12,
                 alignItems: 'center' // List view style like in main page but simplified
            }}>
                 {/* Image */}
                <div style={{
                    width: 72,
                    height: 72,
                    borderRadius: 16,
                    border: '1px solid #F1F5F9',
                    overflow: 'hidden',
                    position: 'relative',
                    background: '#F8FAFC',
                    flexShrink: 0
                }}>
                    {imageUrl && imageUrl.match(/^https?:\/\/.+/) ? (
                        <Image
                            src={imageUrl}
                            alt="Preview"
                            fill
                            style={{ objectFit: "cover" }}
                            sizes="72px"
                            onError={(e) => {
                                // Fallback logic is tricky in SSR/Icon, mostly just show icon if fail
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    ) : (
                         <div style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)"
                        }}>
                             <ShopOutlined style={{ fontSize: 24, color: "#6366F1", opacity: 0.8 }} />
                        </div>
                    )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                         <Text strong style={{ fontSize: 16, color: '#1E293B', flex: 1 }} ellipsis>
                            {name || "ชื่อสินค้า (ไทย)"}
                        </Text>
                         <CheckCircleFilled style={{ color: '#10B981', fontSize: 14 }} />
                    </div>
                     <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 6, color: '#64748B' }} ellipsis>
                        {productName || "Product Name (EN)"}
                    </Text>
                    
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                         <Tag style={{ borderRadius: 6, margin: 0, fontSize: 11, fontWeight: 700, color: '#059669', background: '#ECFDF5', border: 'none', padding: '0 8px' }}>
                            ฿{(price || 0).toLocaleString()}
                        </Tag>
                        <Tag style={{ borderRadius: 6, margin: 0, fontSize: 11, fontWeight: 700, color: '#db2777', background: '#fdf2f8', border: 'none', padding: '0 8px' }}>
                            Delivery ฿{(priceDelivery ?? price || 0).toLocaleString()}
                        </Tag>
                        {category && <Tag style={{ borderRadius: 6, margin: 0, fontSize: 10, color: '#4F46E5', background: '#EEF2FF', border: 'none' }}>{category}</Tag>}
                        {unit && <Tag style={{ borderRadius: 6, margin: 0, fontSize: 10, color: '#0891B2', background: '#CFFAFE', border: 'none' }}>{unit}</Tag>}
                    </div>
                </div>
            </div>
        </div>
    </div>
);

// ============ ACTION BUTTONS COMPONENT ============

interface ActionButtonsProps {
    isEdit: boolean;
    loading: boolean;
    onCancel: () => void;
}

export const ActionButtons = ({ isEdit, loading, onCancel }: ActionButtonsProps) => (
    <ManageActionButtons
        pageStyles={pageStyles}
        isEdit={isEdit}
        loading={loading}
        onCancel={onCancel}
    />
);
