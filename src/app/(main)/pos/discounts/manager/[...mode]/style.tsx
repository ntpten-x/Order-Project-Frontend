"use client";

import React from "react";
import { Typography } from "antd";
import { PercentageOutlined, DollarOutlined } from "@ant-design/icons";
import { DiscountType } from "../../../../../../types/api/pos/discounts";
import {
    createManagePageStyles,
    ManagePageHeader,
    ManageActionButtons,
} from "../../../../../../theme/pos/manage.shared";

const { Text } = Typography;

const { pageStyles, ManagePageStyles } = createManagePageStyles({
    focusColor: "#F59E0B",
    focusShadow: "rgba(245, 158, 11, 0.15)",
    switchGradient: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
    extraCss: `
        .manage-page .ant-radio-button-wrapper {
            border-radius: 12px !important;
            border: 2px solid #f0f0f0 !important;
            margin-right: 8px;
            padding: 8px 16px;
            height: auto !important;
        }

        .manage-page .ant-radio-button-wrapper:first-child {
            border-radius: 12px !important;
        }

        .manage-page .ant-radio-button-wrapper:last-child {
            border-radius: 12px !important;
        }

        .manage-page .ant-radio-button-wrapper-checked {
            border-color: #F59E0B !important;
            background: linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%) !important;
            color: #F59E0B !important;
        }

        .manage-page .ant-radio-button-wrapper-checked::before {
            display: none !important;
        }
    `,
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
        titleCreate="สร้างส่วนลดใหม่"
        titleEdit="แก้ไขส่วนลด"
    />
);

// ============ DISCOUNT PREVIEW COMPONENT ============

interface DiscountPreviewProps {
    displayName?: string;
    discountType?: DiscountType;
    discountAmount?: number;
}

export const DiscountPreview = ({ displayName, discountType, discountAmount }: DiscountPreviewProps) => {
    const isFixed = discountType === DiscountType.Fixed;
    const value = discountAmount || 0;

    return (
        <div>
            <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 13, textAlign: 'center' }}>
                ตัวอย่างคูปอง (Preview)
            </Typography.Text>
            
            <div style={{
                background: 'white',
                borderRadius: 20,
                overflow: 'hidden',
                boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
                border: '1px solid #F1F5F9',
                maxWidth: 300,
                margin: '0 auto',
                position: 'relative'
            }}>
                {/* Top Section / Decoration */}
                <div style={{
                    height: 80,
                    background: isFixed 
                        ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' 
                        : 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                }}>
                    <div style={{
                        width: 48,
                        height: 48,
                        background: 'rgba(255,255,255,0.2)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(255,255,255,0.3)'
                    }}>
                        {isFixed ? (
                            <DollarOutlined style={{ fontSize: 24, color: 'white' }} />
                        ) : (
                            <PercentageOutlined style={{ fontSize: 24, color: 'white' }} />
                        )}
                    </div>
                    {/* Punch holes */}
                    <div style={{ position: 'absolute', bottom: -10, left: -10, width: 20, height: 20, borderRadius: '50%', background: '#F8FAFC' }} />
                    <div style={{ position: 'absolute', bottom: -10, right: -10, width: 20, height: 20, borderRadius: '50%', background: '#F8FAFC' }} />
                </div>

                {/* Content */}
                <div style={{ padding: '24px 20px', textAlign: 'center' }}>
                    <div style={{ 
                        fontSize: 32, 
                        fontWeight: 800, 
                        color: isFixed ? '#2563EB' : '#7C3AED',
                        lineHeight: 1,
                        marginBottom: 8
                    }}>
                         {isFixed ? '฿' : ''}{value.toLocaleString()}{!isFixed ? '%' : ''}
                    </div>
                    <div style={{ 
                        fontSize: 14, 
                        fontWeight: 600, 
                        color: '#94A3B8',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        marginBottom: 16
                    }}>
                        DISCOUNT
                    </div>
                    
                    <div style={{ height: 1, background: '#E2E8F0', marginBottom: 16, width: '100%' }} />
                    
                    <Typography.Text strong style={{ fontSize: 16, color: '#1E293B', display: 'block', marginBottom: 4 }}>
                        {displayName || "ชื่อส่วนลด"}
                    </Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        พร้อมใช้งานทันที
                    </Typography.Text>
                </div>
            </div>
        </div>
    );
};

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
