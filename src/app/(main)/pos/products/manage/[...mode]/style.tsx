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
    focusColor: "#1890ff",
    focusShadow: "rgba(24, 144, 255, 0.1)",
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
        titleCreate="เพิ่มสินค้า"
        titleEdit="แก้ไขสินค้า"
    />
);

// ============ IMAGE PREVIEW COMPONENT ============

interface ImagePreviewProps {
    url?: string;
    name?: string;
}

export const ImagePreview = ({ url, name }: ImagePreviewProps) => (
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
        }}>
            {url ? (
                <Image
                    src={url}
                    alt={name || "Preview"}
                    fill
                    style={{ objectFit: "cover" }}
                    sizes="80px"
                />
            ) : (
                <div style={{
                    width: "100%",
                    height: "100%",
                    background: "linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}>
                    <ShopOutlined style={{ fontSize: 28, color: "#1890ff", opacity: 0.5 }} />
                </div>
            )}
        </div>
        <div>
            <Text strong style={{ display: "block", marginBottom: 4 }}>
                {name || "ตัวอย่างรูปภาพ"}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
                {url ? "แสดงตัวอย่างจาก URL" : "ยังไม่มีรูปภาพ"}
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
