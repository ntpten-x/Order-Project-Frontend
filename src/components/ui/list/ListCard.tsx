"use client";

import React from "react";
import { Card } from "antd";

import { UI_TOKENS } from "@/components/ui/tokens";

type ListCardProps = {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  style?: React.CSSProperties;
};

export default function ListCard({ children, onClick, disabled, style }: ListCardProps) {
  return (
    <Card
      hoverable={!!onClick && !disabled}
      onClick={disabled ? undefined : onClick}
      size="small"
      variant="outlined"
      style={{
        borderRadius: UI_TOKENS.cardRadiusLG,
        cursor: onClick && !disabled ? "pointer" : "default",
        opacity: disabled ? 0.6 : 1,
        ...style,
      }}
      bodyStyle={{ padding: 16 }}
    >
      {children}
    </Card>
  );
}

