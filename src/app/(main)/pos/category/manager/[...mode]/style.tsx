"use client";

import React from "react";
import { Typography } from "antd";
import { TagsOutlined } from "@ant-design/icons";
import {
    createManagePageStyles,
    ManagePageHeader,
    ManageActionButtons,
} from "@/theme/pos/manage.shared";

const { Text } = Typography;

const { pageStyles, ManagePageStyles } = createManagePageStyles({
    focusColor: "#722ed1",
    focusShadow: "rgba(114, 46, 209, 0.1)",
    switchGradient: "linear-gradient(135deg, #52c41a 0%, #389e0d 100%)",
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
        titleCreate="เพิ่มหมวดหมู่"
        titleEdit="แก้ไขหมวดหมู่"
    />
);

// ============ CATEGORY PREVIEW COMPONENT ============

interface CategoryPreviewProps {
    displayName?: string;
    categoryName?: string;
}

export const CategoryPreview = ({ displayName, categoryName }: CategoryPreviewProps) => (
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
            <TagsOutlined style={{ fontSize: 24, color: "#722ed1" }} />
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
