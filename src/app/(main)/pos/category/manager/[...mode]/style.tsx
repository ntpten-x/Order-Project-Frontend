"use client";

import React from "react";
import { Typography } from "antd";
import { TagsOutlined } from "@ant-design/icons";
import {
    createManagePageStyles,
    ManagePageHeader,
    ManageActionButtons,
} from "../../../../../../theme/pos/manage.shared";

const { Text } = Typography;

const { pageStyles, ManagePageStyles } = createManagePageStyles({
    focusColor: "#0f766e",
    focusShadow: "rgba(15, 118, 110, 0.12)",
    switchGradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
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
        titleCreate="เพิ่มหมวดหมู่"
        titleEdit="แก้ไขหมวดหมู่"
    />
);

interface CategoryPreviewProps {
    displayName?: string;
    categoryName?: string;
}

export const CategoryPreview = ({ displayName, categoryName }: CategoryPreviewProps) => (
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
                background: "linear-gradient(135deg, #ccfbf1 0%, #99f6e4 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
            }}
        >
            <TagsOutlined style={{ fontSize: 24, color: "#0f766e" }} />
        </div>
        <div>
            <Text strong style={{ display: "block", marginBottom: 4 }}>
                {displayName || "ชื่อที่แสดง"}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
                {categoryName || "ชื่อหมวดหมู่ (EN)"}
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
