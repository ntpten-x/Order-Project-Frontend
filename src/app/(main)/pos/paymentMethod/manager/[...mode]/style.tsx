"use client";

import React from "react";
import { Typography } from "antd";
import { CreditCardOutlined } from "@ant-design/icons";
import {
    createManagePageStyles,
    ManagePageHeader,
    ManageActionButtons,
} from "../../../../../../theme/pos/manage.shared";

const { Text } = Typography;

const { pageStyles, ManagePageStyles } = createManagePageStyles({
    focusColor: "#10b981",
    focusShadow: "rgba(16, 185, 129, 0.1)",
    switchGradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
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
        titleCreate="เพิ่มวิธีชำระเงิน"
        titleEdit="แก้ไขวิธีชำระเงิน"
    />
);

// ============ PAYMENT METHOD PREVIEW COMPONENT ============

interface PaymentMethodPreviewProps {
    name?: string;
    displayName?: string;
}

export const PaymentMethodPreview = ({ name, displayName }: PaymentMethodPreviewProps) => {
    // Determine background based on payment method name
    let background = "linear-gradient(135deg, #10b981 0%, #059669 100%)";
    const lower = (name || "").toLowerCase();
    
    if (lower.includes('cash') || lower.includes('เงินสด')) {
        background = "linear-gradient(135deg, #65a30d 0%, #4d7c0f 100%)";
    } else if (lower.includes('promptpay') || lower.includes('พร้อมเพย์')) {
        background = "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)";
    } else if (lower.includes('delivery')) {
        background = "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";
    }

    return (
        <div>
            <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 13, textAlign: 'center' }}>
                ตัวอย่างการแสดงผล (Preview)
            </Typography.Text>
            
            <div style={{
                background: background,
                borderRadius: 20,
                padding: 24,
                boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                color: "white",
                position: "relative",
                overflow: "hidden",
                minHeight: 180,
                display: "flex",
                flexDirection: "column",
                maxWidth: 340,
                margin: "0 auto"
            }}>
                {/* Decorative circles */}
                <div style={{
                    position: "absolute",
                    top: -20,
                    right: -20,
                    width: 120,
                    height: 120,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.1)",
                    zIndex: 1
                }} />
                <div style={{
                    position: "absolute",
                    bottom: -30,
                    left: -30,
                    width: 100,
                    height: 100,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.08)",
                    zIndex: 1
                }} />

                {/* Content */}
                <div style={{ position: "relative", zIndex: 2, flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <CreditCardOutlined style={{ fontSize: 32, opacity: 0.9 }} />
                        <div style={{ 
                            fontSize: 16, 
                            fontWeight: 700, 
                            opacity: 0.9, 
                            letterSpacing: '1px',
                            textTransform: 'uppercase'
                        }}>
                             PAYMENT
                        </div>
                    </div>

                    <div style={{ marginTop: 40 }}>
                        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>
                            Payment Method
                        </div>
                        <div style={{ 
                            fontSize: 24, 
                            fontWeight: 700, 
                            letterSpacing: '0.5px',
                            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                            {displayName || "Display Name"}
                        </div>
                    </div>

                    <div style={{ marginTop: 'auto', paddingTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
                        <div style={{ 
                            fontSize: 14, 
                            opacity: 0.8, 
                            background: 'rgba(255,255,255,0.2)',
                            padding: '4px 12px',
                            borderRadius: 12,
                            fontWeight: 500
                        }}>
                            {name || "CODE"}
                        </div>
                    </div>
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
