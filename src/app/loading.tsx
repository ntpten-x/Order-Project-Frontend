"use client";

import { Flex, Spin, Typography, theme } from "antd";

export default function Loading() {
  const { token } = theme.useToken();

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "auto",
        background: "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
            padding: "24px",
            background: "rgba(255, 255, 255, 0.9)",
            borderRadius: "20px",
            border: "1px solid #f1f5f9",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)"
          }}
        >
          <Spin size="large" />
          <Typography.Text type="secondary" style={{ fontSize: "14px" }}>
            กำลังโหลด...
          </Typography.Text>
        </div>
    </div>
  );
}
