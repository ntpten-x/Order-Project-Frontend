"use client";

import React from "react";
import { Card, Flex, Typography, theme } from "antd";

import { UI_TOKENS } from "../tokens";

type PageSectionProps = {
  title?: React.ReactNode;
  extra?: React.ReactNode;
  children: React.ReactNode;
  style?: React.CSSProperties;
};

export default function PageSection({
  title,
  extra,
  children,
  style,
}: PageSectionProps) {
  const { token } = theme.useToken();

  return (
    <Card
      size="small"
      variant="outlined"
      style={{ borderRadius: UI_TOKENS.cardRadiusLG, ...style }}
      styles={{
        header: title
          ? { borderBottomColor: token.colorBorderSecondary }
          : { display: "none" },
      }}
      title={
        title ? (
          <Flex align="center" justify="space-between" gap={12}>
            <Typography.Text strong>{title}</Typography.Text>
            {extra}
          </Flex>
        ) : undefined
      }
    >
      {children}
    </Card>
  );
}

