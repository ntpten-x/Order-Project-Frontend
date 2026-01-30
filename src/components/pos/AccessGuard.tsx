"use client";

import React from "react";
import { Spin, Typography } from "antd";

const { Text } = Typography;

type AccessGuardProps = {
    message: string;
    tone?: "secondary" | "danger";
};

export const AccessGuardFallback = ({ message, tone = "secondary" }: AccessGuardProps) => (
    <div
        style={{
            display: "flex",
            height: "100vh",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            gap: 16,
        }}
    >
        <Spin size="large" />
        <Text type={tone}>{message}</Text>
    </div>
);
