"use client";

import React from "react";
import { Typography, Tag } from "antd";
import { TableOutlined } from "@ant-design/icons";
import {
    createManagePageStyles,
    ManagePageHeader,
    ManageActionButtons,
} from "../../../../../../theme/pos/manage.shared";

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
    status?: string | number;
}

export const TablePreview = ({ name, status }: TablePreviewProps) => {
    const isAvailable = String(status) === 'Available';
    
    return (
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
                background: isAvailable 
                    ? "linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)"
                    : "linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                border: '1px solid #f0f0f0'
            }}>
                <TableOutlined style={{ fontSize: 24, color: isAvailable ? "#52c41a" : "#fa8c16" }} />
            </div>
            <div>
                <Text strong style={{ display: "block", marginBottom: 2 }}>
                    {name || "ตัวอย่างโต๊ะ"}
                </Text>
                <div style={{ display: 'flex', gap: 6 }}>
                    <Tag 
                        color={isAvailable ? 'success' : 'warning'}
                        style={{ borderRadius: 6, margin: 0, fontSize: 10 }}
                    >
                        {isAvailable ? 'ว่าง' : 'ไม่ว่าง'}
                    </Tag>
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
