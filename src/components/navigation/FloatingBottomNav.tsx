"use client";

import React from "react";
import { Badge, Button, Card, Grid, Typography, theme } from "antd";

import { FLOATING_BOTTOM_NAV_BOTTOM_OFFSET_PX } from "./constants";

export interface FloatingBottomNavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  badgeDot?: boolean;
  badgeCount?: number;
  ariaLabel?: string;
}

interface FloatingBottomNavProps {
  items: FloatingBottomNavItem[];
  maxWidth?: number;
  bottomOffset?: number;
}

const { Text } = Typography;

export default function FloatingBottomNav({
  items,
  maxWidth = 440,
  bottomOffset = FLOATING_BOTTOM_NAV_BOTTOM_OFFSET_PX,
}: FloatingBottomNavProps) {
  const { token } = theme.useToken();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  const containerStyle: React.CSSProperties = {
    position: "fixed",
    left: "50%",
    transform: "translateX(-50%)",
    bottom: `calc(${bottomOffset}px + env(safe-area-inset-bottom))`,
    width: "calc(100% - 24px)",
    maxWidth,
    zIndex: 900,
  };

  return (
    <div style={containerStyle} aria-label="Bottom navigation">
      <Card
        size="small"
        variant="outlined"
        bodyStyle={{
          padding: 8,
          display: "grid",
          gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
          gap: 4,
        }}
        style={{
          borderRadius: isMobile ? 18 : 22,
          borderColor: token.colorBorderSecondary,
          background: "rgba(255, 255, 255, 0.92)",
          backdropFilter: "blur(12px)",
          boxShadow: token.boxShadowSecondary,
        }}
      >
        {items.map((item) => {
          const isActive = !!item.active;
          const iconColor = isActive ? token.colorPrimary : token.colorTextSecondary;
          const textColor = isActive ? token.colorPrimary : token.colorTextSecondary;

          const iconNode = (
            <span style={{ fontSize: 22, lineHeight: 1, color: iconColor }}>
              {item.icon}
            </span>
          );

          const iconWithBadge =
            item.badgeDot || (item.badgeCount ?? 0) > 0 ? (
              <Badge dot={item.badgeDot} count={item.badgeCount} size="small">
                {iconNode}
              </Badge>
            ) : (
              iconNode
            );

          return (
            <Button
              key={item.key}
              type="text"
              disabled={item.disabled}
              aria-label={item.ariaLabel ?? item.label}
              aria-current={isActive ? "page" : undefined}
              onClick={item.onClick}
              style={{
                height: isMobile ? 64 : 68,
                paddingInline: 0,
                borderRadius: 16,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                background: isActive ? token.colorPrimaryBg : "transparent",
              }}
            >
              {iconWithBadge}
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: isActive ? 600 : 500,
                  color: textColor,
                  lineHeight: 1,
                }}
              >
                {item.label}
              </Text>
            </Button>
          );
        })}
      </Card>
    </div>
  );
}
