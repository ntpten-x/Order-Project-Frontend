"use client";

import React from "react";
import { Typography } from "antd";
import { AppstoreOutlined } from "@ant-design/icons";
import {
    createManagePageStyles,
    ManagePageHeader,
    ManageActionButtons,
} from "../../../../../../theme/pos/manage.shared";

const { Text } = Typography;

const { pageStyles, ManagePageStyles } = createManagePageStyles({
    focusColor: "#0e7490",
    focusShadow: "rgba(14, 116, 144, 0.12)",
    switchGradient: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
});

export { pageStyles, ManagePageStyles };

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

interface ProductsUnitPreviewProps {
    displayName?: string;
    unitName?: string;
}

export const ProductsUnitPreview = ({ displayName, unitName }: ProductsUnitPreviewProps) => (
    <div
        style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: 16,
            background: "#f8fafc",
            borderRadius: 16,
            marginTop: 12,
        }}
    >
        <div
            style={{
                width: 60,
                height: 60,
                borderRadius: 14,
                background: "linear-gradient(135deg, #cffafe 0%, #a5f3fc 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
            }}
        >
            <AppstoreOutlined style={{ fontSize: 24, color: "#0e7490" }} />
        </div>
        <div>
            <Text strong style={{ display: "block", marginBottom: 4 }}>
                {displayName || unitName || "ตัวอย่างหน่วยสินค้า"}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
                {unitName || "ชื่อหน่วยสินค้า (EN)"}
            </Text>
        </div>
    </div>
);

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
