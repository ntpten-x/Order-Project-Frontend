"use client";

import React from "react";
import Image from "../../../../../../components/ui/image/SmartImage";
import { Tag, Typography } from "antd";
import { CheckCircleFilled, ShoppingOutlined } from "@ant-design/icons";
import {
    createManagePageStyles,
} from "../../../../../../theme/pos/manage.shared";
import { isSupportedImageSource } from "../../../../../../utils/image/source";

const { Text } = Typography;

const { pageStyles, ManagePageStyles } = createManagePageStyles({
    focusColor: "#0E7490", // Cyan 700
    focusShadow: "rgba(14, 116, 144, 0.1)",
    switchGradient: "linear-gradient(135deg, #0E7490 0%, #0891B2 100%)",
});

export { pageStyles, ManagePageStyles };

interface IngredientPreviewProps {
    name?: string;
    imageUrl?: string;
    category?: string;
    unit?: string;
    isActive?: boolean;
}

export const IngredientPreview = ({ name, imageUrl, category, unit, isActive = true }: IngredientPreviewProps) => (
    <div
        style={{
            marginTop: 24,
            marginBottom: 24,
            padding: 20,
            background: "#F8FAFC",
            borderRadius: 20,
            border: "1px dashed #E2E8F0",
        }}
    >
        <Text type="secondary" style={{ display: "block", marginBottom: 12, fontSize: 13, textAlign: "center" }}>
            ตัวอย่างการแสดงผล
        </Text>

        <div
            style={{
                width: "100%",
                maxWidth: 280,
                margin: "0 auto",
                background: "white",
                borderRadius: 20,
                overflow: "hidden",
                boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
                border: "1px solid #F1F5F9",
            }}
        >
            <div
                style={{
                    padding: 12,
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                }}
            >
                <div
                    style={{
                        width: 72,
                        height: 72,
                        borderRadius: 16,
                        border: "1px solid #F1F5F9",
                        overflow: "hidden",
                        position: "relative",
                        background: "#F8FAFC",
                        flexShrink: 0,
                    }}
                >
                    {isSupportedImageSource(imageUrl) ? (
                        <Image
                            src={imageUrl}
                            alt="Preview"
                            fill
                            style={{ objectFit: "cover" }}
                            sizes="72px"
                            onError={(event) => {
                                (event.target as HTMLImageElement).style.display = "none";
                            }}
                        />
                    ) : (
                        <div
                            style={{
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "linear-gradient(135deg, #E0F2FE 0%, #CFFAFE 100%)",
                            }}
                        >
                            <ShoppingOutlined style={{ fontSize: 24, color: "#0E7490", opacity: 0.8 }} />
                        </div>
                    )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Text strong style={{ fontSize: 16, color: "#1E293B", flex: 1 }} ellipsis>
                            {name || "ชื่อวัตถุดิบ"}
                        </Text>
                        {isActive ? <CheckCircleFilled style={{ color: "#10B981", fontSize: 14 }} /> : null}
                    </div>

                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                        {category ? <Tag style={{ borderRadius: 6, margin: 0, fontSize: 10, color: "#0E7490", background: "#E0F2FE", border: "none" }}>{category}</Tag> : <Tag style={{ borderRadius: 6, margin: 0, fontSize: 10, color: "#64748B", background: "#F1F5F9", border: "none" }}>ยังไม่เลือกหมวดหมู่</Tag>}
                        {unit ? <Tag style={{ borderRadius: 6, margin: 0, fontSize: 10, color: "#0891B2", background: "#CFFAFE", border: "none" }}>{unit}</Tag> : null}
                    </div>
                </div>
            </div>
        </div>
    </div>
);
