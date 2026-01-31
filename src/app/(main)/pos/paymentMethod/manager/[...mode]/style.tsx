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

export const PaymentMethodPreview = ({ name, displayName }: PaymentMethodPreviewProps) => (
    <div style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: 16,
        background: "#fafafa",
        borderRadius: 16,
        marginTop: 12,
    }}>
        <div style={{
            width: 80,
            height: 80,
            borderRadius: 14,
            border: "2px solid white",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            overflow: "hidden",
            position: "relative",
            flexShrink: 0,
            background: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
        }}>
            <CreditCardOutlined style={{ fontSize: 32, color: "#10b981", opacity: 0.8 }} />
        </div>
        <div>
            <Text strong style={{ display: "block", marginBottom: 4, fontSize: 16 }}>
                {displayName || name || "ตัวอย่างวิธีชำระเงิน"}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
                {name || "รหัสวิธีชำระเงิน"}
            </Text>
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
