"use client";

import React from "react";
import Image from "next/image";
import { Typography } from "antd";
import { CarOutlined } from "@ant-design/icons";
import {
    createManagePageStyles,
    ManagePageHeader,
    ManageActionButtons,
} from "../../../../../../theme/pos/manage.shared";

const { Text } = Typography;

const { pageStyles, ManagePageStyles } = createManagePageStyles({
    focusColor: "#13c2c2",
    focusShadow: "rgba(19, 194, 194, 0.1)",
    switchGradient: "linear-gradient(135deg, #13c2c2 0%, #08979c 100%)",
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
        titleCreate="เพิ่มบริการส่ง"
        titleEdit="แก้ไขบริการส่ง"
    />
);

// ============ DELIVERY PREVIEW COMPONENT ============

interface DeliveryPreviewProps {
    name?: string;
    logo?: string;
}

export const DeliveryPreview = ({ name, logo }: DeliveryPreviewProps) => (
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
            background: "linear-gradient(135deg, #e6fffb 0%, #b5f5ec 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
        }}>
            {logo ? (
                <Image
                    src={logo}
                    alt={name || "Delivery Logo"}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    style={{
                        objectFit: "contain",
                        background: "white",
                    }}
                />
            ) : (
                <CarOutlined style={{ fontSize: 28, color: "#13c2c2", opacity: 0.7 }} />
            )}
        </div>
        <div>
            <Text strong style={{ display: "block", marginBottom: 4 }}>
                {name || "ตัวอย่างบริการส่ง"}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
                บริการส่งอาหาร
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
