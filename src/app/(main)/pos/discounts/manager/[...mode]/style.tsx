"use client";

import React from "react";
import { Typography } from "antd";
import { PercentageOutlined, DollarOutlined } from "@ant-design/icons";
import { DiscountType } from "../../../../../../types/api/pos/discounts";
import {
    createManagePageStyles,
    ManagePageHeader,
    ManageActionButtons,
} from "@/theme/pos/manage.shared";

const { Text } = Typography;

const { pageStyles, ManagePageStyles } = createManagePageStyles({
    focusColor: "#fa8c16",
    focusShadow: "rgba(250, 140, 22, 0.1)",
    switchGradient: "linear-gradient(135deg, #fa8c16 0%, #d48806 100%)",
    extraCss: `
        .manage-page .ant-radio-button-wrapper {
            border-radius: 12px !important;
            border: 2px solid #f0f0f0 !important;
            margin-right: 8px;
            padding: 8px 16px;
            height: auto !important;
        }

        .manage-page .ant-radio-button-wrapper:first-child {
            border-radius: 12px !important;
        }

        .manage-page .ant-radio-button-wrapper:last-child {
            border-radius: 12px !important;
        }

        .manage-page .ant-radio-button-wrapper-checked {
            border-color: #fa8c16 !important;
            background: linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%) !important;
            color: #fa8c16 !important;
        }

        .manage-page .ant-radio-button-wrapper-checked::before {
            display: none !important;
        }
    `,
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
        titleCreate="เพิ่มส่วนลด"
        titleEdit="แก้ไขส่วนลด"
    />
);

// ============ DISCOUNT PREVIEW COMPONENT ============

interface DiscountPreviewProps {
    displayName?: string;
    discountType?: DiscountType;
    discountAmount?: number;
}

export const DiscountPreview = ({ displayName, discountType, discountAmount }: DiscountPreviewProps) => {
    const isFixed = discountType === DiscountType.Fixed;

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
                width: 80,
                height: 80,
                borderRadius: 14,
                border: "2px solid white",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                overflow: "hidden",
                position: "relative",
                flexShrink: 0,
                background: isFixed
                    ? "linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)"
                    : "linear-gradient(135deg, #f9f0ff 0%, #efdbff 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}>
                {isFixed ? (
                    <DollarOutlined style={{ fontSize: 32, color: "#1890ff", opacity: 0.8 }} />
                ) : (
                    <PercentageOutlined style={{ fontSize: 32, color: "#722ed1", opacity: 0.8 }} />
                )}
            </div>
            <div>
                <Text strong style={{ display: "block", marginBottom: 4, fontSize: 16 }}>
                    {displayName || "ตัวอย่างส่วนลด"}
                </Text>
                <Text type="secondary" style={{ fontSize: 14 }}>
                    {discountAmount
                        ? (isFixed ? `ลด ฿${discountAmount}` : `ลด ${discountAmount}%`)
                        : "กรุณาระบุมูลค่าส่วนลด"}
                </Text>
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
