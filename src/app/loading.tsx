import { Flex, Spin, Typography, theme } from "antd";

export default function Loading() {
  const { token } = theme.useToken();

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "grid",
        placeItems: "center",
        pointerEvents: "auto",
        background: "rgba(255, 255, 255, 0.6)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <div
        style={{
          padding: 24,
          borderRadius: 20,
          background: "rgba(255, 255, 255, 0.9)",
          border: `1px solid ${token.colorBorderSecondary}`,
          boxShadow: token.boxShadowSecondary,
        }}
      >
        <Flex vertical align="center" gap={12}>
          <Spin size="large" />
          <Typography.Text type="secondary">กำลังโหลด...</Typography.Text>
        </Flex>
      </div>
    </div>
  );
}
