"use client";

import React from "react";
import Image from "../../../../../../components/ui/image/SmartImage";
import { Tag, Typography, Button } from "antd";
import { CheckCircleFilled, SaveOutlined, ShopOutlined } from "@ant-design/icons";
import {
    createManagePageStyles,
    ManageActionButtons,
    ManagePageHeader,
} from "../../../../../../theme/pos/manage.shared";
import { isSupportedImageSource, normalizeImageSource } from "../../../../../../utils/image/source";
import { Category } from "../../../../../../types/api/pos/category";

const { Text } = Typography;

const { pageStyles, ManagePageStyles } = createManagePageStyles({
    focusColor: "#4F46E5",
    focusShadow: "rgba(79, 70, 229, 0.1)",
    switchGradient: "linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)",
});

export { pageStyles, ManagePageStyles };



interface ToppingPreviewProps {
    name?: string;
    imageUrl?: string;
    price?: number;
    priceDelivery?: number;
    categories?: Category[];
    isActive?: boolean;
}

export const ToppingPreview = ({ name, imageUrl, price, priceDelivery, categories, isActive = true }: ToppingPreviewProps) => (
    <div
        style={{
            marginTop: 24,
            marginBottom: 24,
            padding: 20,
            background: "#F8FAFC",
            borderRadius: 24,
            border: "1px dashed #E2E8F0",
        }}
    >
        <Text type="secondary" style={{ display: "block", marginBottom: 12, fontSize: 13, textAlign: "center" }}>
            ตัวอย่างการแสดงผล
        </Text>

        <div
            style={{
                width: "100%",
                maxWidth: 300,
                margin: "0 auto",
                background: "white",
                borderRadius: 22,
                overflow: "hidden",
                boxShadow: "0 12px 40px rgba(0,0,0,0.06)",
                border: "1px solid #F1F5F9",
                opacity: isActive ? 1 : 0.7,
            }}
        >
            <div
                style={{
                    padding: 14,
                    display: "flex",
                    gap: 14,
                    alignItems: "center",
                }}
            >
                <div
                    style={{
                        width: 76,
                        height: 76,
                        borderRadius: 18,
                        border: "1px solid #F1F5F9",
                        overflow: "hidden",
                        position: "relative",
                        background: "#F8FAFC",
                        flexShrink: 0,
                    }}
                >
                    {isSupportedImageSource(normalizeImageSource(imageUrl)) ? (
                        <Image
                            src={normalizeImageSource(imageUrl)!}
                            alt="Preview"
                            fill
                            style={{ objectFit: "cover" }}
                            sizes="76px"
                        />
                    ) : (
                        <div
                            style={{
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)",
                            }}
                        >
                            <ShopOutlined style={{ fontSize: 26, color: "#6366F1", opacity: 0.8 }} />
                        </div>
                    )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Text strong style={{ fontSize: 16, color: "#1E293B", flex: 1 }} ellipsis>
                            {name || "ชื่อท็อปปิ้ง"}
                        </Text>
                        <CheckCircleFilled style={{ color: isActive ? "#10B981" : "#94A3B8", fontSize: 14 }} />
                    </div>
                    
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4, marginBottom: 8 }}>
                        <Tag style={{ borderRadius: 8, margin: 0, fontSize: 12, fontWeight: 700, color: "#059669", background: "#ECFDF5", border: "none", padding: "0 10px" }}>
                            ฿{(price || 0).toLocaleString()}
                        </Tag>
                        {Number(priceDelivery ?? price ?? 0) !== Number(price ?? 0) && (
                            <Tag style={{ borderRadius: 8, margin: 0, fontSize: 11, fontWeight: 700, color: "#db2777", background: "#fdf2f8", border: "none", padding: "0 8px" }}>
                                Delivery ฿{(priceDelivery || 0).toLocaleString()}
                            </Tag>
                        )}
                    </div>

                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {categories && categories.length > 0 ? (
                            categories.map(cat => (
                                <Tag key={cat.id} style={{ borderRadius: 6, margin: 0, fontSize: 10, color: "#4F46E5", background: "#EEF2FF", border: "none" }}>
                                    {cat.display_name}
                                </Tag>
                            ))
                        ) : (
                            <Text type="secondary" style={{ fontSize: 11 }}>ยังไม่ได้เลือกหมวดหมู่</Text>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
);

interface ActionButtonsProps {
    isEdit: boolean;
    loading: boolean;
    onCancel: () => void;
}

export const ActionButtons = ({ isEdit, loading, onCancel }: ActionButtonsProps) => (
    <div style={pageStyles.actionButtons}>
        <Button
            size="large"
            onClick={onCancel}
            style={{
                flex: 1,
                borderRadius: 14,
                height: 48,
            }}
        >
            ยกเลิก
        </Button>
        <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={loading}
            icon={<SaveOutlined />}
            style={{
                flex: 2,
                borderRadius: 14,
                height: 48,
                background: "linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)",
                border: "none",
                fontWeight: 600,
                boxShadow: "0 4px 12px rgba(79, 70, 229, 0.4)",
            }}
        >
            บันทึกข้อมูล
        </Button>
    </div>
);
