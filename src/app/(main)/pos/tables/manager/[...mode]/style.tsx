"use client";

import React from "react";
import { Typography } from "antd";
import { TableOutlined } from "@ant-design/icons";
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
        titleCreate="เพิ่มโต๊ะ"
        titleEdit="แก้ไขโต๊ะ"
    />
);

// ============ TABLE PREVIEW COMPONENT ============

interface TablePreviewProps {
    name?: string;
}

export const TablePreview = ({ name }: TablePreviewProps) => (
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
            <TableOutlined style={{ fontSize: 24, color: "#722ed1" }} />
        </div>
        <div>
            <Text strong style={{ display: "block", marginBottom: 4 }}>
                {name || "ตัวอย่างโต๊ะ"}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
                โต๊ะที่ใช้งานในหน้าร้าน
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
