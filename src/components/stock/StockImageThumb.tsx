"use client";

import React from "react";
import { ShoppingOutlined } from "@ant-design/icons";
import SmartAvatar from "../ui/image/SmartAvatar";

interface StockImageThumbProps {
    src?: string | null;
    alt: string;
    size?: number;
    borderRadius?: number;
}

export default function StockImageThumb({
    src,
    alt,
    size = 56,
    borderRadius = 10,
}: StockImageThumbProps) {
    return (
        <SmartAvatar
            src={src}
            alt={alt}
            shape="square"
            size={size}
            icon={<ShoppingOutlined />}
            borderRadius={borderRadius}
            imageStyle={{
                objectFit: "cover",
            }}
            style={{
                flexShrink: 0,
            }}
        />
    );
}
