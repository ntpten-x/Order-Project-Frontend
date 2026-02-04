"use client";

import React from "react";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button, Flex, Grid, Typography, theme } from "antd";

import { UI_TOKENS } from "../tokens";

type PageHeaderProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  onBack?: () => void;
  actions?: React.ReactNode;
  style?: React.CSSProperties;
};

export default function PageHeader({
  title,
  subtitle,
  icon,
  onBack,
  actions,
  style,
}: PageHeaderProps) {
  const { token } = theme.useToken();
  const screens = Grid.useBreakpoint();
  const paddingX = screens.md
    ? UI_TOKENS.pagePaddingXDesktop
    : UI_TOKENS.pagePaddingXMobile;

  return (
    <div
      style={{
        padding: `${UI_TOKENS.pagePaddingY}px ${paddingX}px`,
        background: token.colorBgContainer,
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        ...style,
      }}
    >
      <Flex
        align="center"
        justify="space-between"
        wrap="wrap"
        gap={12}
        style={{ maxWidth: UI_TOKENS.pageMaxWidth, margin: "0 auto" }}
      >
        <Flex align="center" gap={12} style={{ minWidth: 0 }}>
          {onBack && (
            <Button
              type="text"
              aria-label="ย้อนกลับ"
              icon={<ArrowLeftOutlined />}
              onClick={onBack}
              style={{ borderRadius: 12, width: 44, height: 44 }}
            />
          )}
          {icon && (
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                display: "grid",
                placeItems: "center",
                background: token.colorFillTertiary,
                color: token.colorText,
              }}
            >
              {icon}
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {title}
            </Typography.Title>
            {subtitle && <Typography.Text type="secondary">{subtitle}</Typography.Text>}
          </div>
        </Flex>

        {actions && <Flex gap={8} wrap="wrap">{actions}</Flex>}
      </Flex>
    </div>
  );
}
