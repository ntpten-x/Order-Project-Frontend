"use client";

import React from "react";
import { Card, Flex, theme } from "antd";

import { UI_TOKENS } from "../tokens";

type ActionBarProps = {
  children: React.ReactNode;
  maxWidth?: number;
  bottomOffset?: number;
};

export default function ActionBar({
  children,
  maxWidth = UI_TOKENS.pageMaxWidth,
  bottomOffset = 16,
}: ActionBarProps) {
  const { token } = theme.useToken();

  return (
    <div
      style={{
        position: "fixed",
        left: "50%",
        transform: "translateX(-50%)",
        bottom: `calc(${bottomOffset}px + env(safe-area-inset-bottom))`,
        width: "calc(100% - 24px)",
        maxWidth,
        zIndex: 1200,
      }}
    >
      <Card
        size="small"
        variant="outlined"
        style={{
          borderRadius: UI_TOKENS.cardRadiusLG,
          borderColor: token.colorBorderSecondary,
          boxShadow: token.boxShadowSecondary,
          background: "rgba(255, 255, 255, 0.92)",
          backdropFilter: "blur(12px)",
        }}
        bodyStyle={{ padding: 12 }}
      >
        <Flex gap={8} justify="flex-end" wrap="wrap">
          {children}
        </Flex>
      </Card>
    </div>
  );
}

