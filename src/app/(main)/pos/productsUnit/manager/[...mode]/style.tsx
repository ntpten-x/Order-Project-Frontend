"use client";

import React from "react";
import { Typography } from "antd";
import { AppstoreOutlined } from "@ant-design/icons";
import {
    createManagePageStyles,
    ManagePageHeader,
    ManageActionButtons,
} from "@/theme/pos/manage.shared";

const { Text } = Typography;

const { pageStyles, ManagePageStyles } = createManagePageStyles({
    focusColor: "#722ed1",
    focusShadow: "rgba(114, 46, 209, 0.1)",
    switchGradient: "linear-gradient(135deg, #722ed1 0%, #531dab 100%)",
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
        titleCreate="เพิ่มหน่วยสินค้า"
        titleEdit="แก้ไขหน่วยสินค้า"
    />
);

// ============ PRODUCT UNIT PREVIEW COMPONENT ============

interface ProductsUnitPreviewProps {
    displayName?: string;
    unitName?: string;
}

export const ProductsUnitPreview = ({ displayName, unitName }: ProductsUnitPreviewProps) => (
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
            width: 60,
            height: 60,
            borderRadius: 14,
            background: "linear-gradient(135deg, #f9f0ff 0%, #efdbff 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
        }}>
            <AppstoreOutlined style={{ fontSize: 24, color: "#722ed1" }} />
        </div>
        <div>
            <Text strong style={{ display: "block", marginBottom: 4 }}>
                {displayName || unitName || "ตัวอย่างหน่วยสินค้า"}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
                {unitName || "หน่วยนับของสินค้า"}
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
