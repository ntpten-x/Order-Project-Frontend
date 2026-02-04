"use client";

import React from "react";
import { Card, Empty, Typography } from "antd";

import { UI_TOKENS } from "../tokens";

type EmptyStateProps = {
  title?: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  image?: React.ReactNode;
};

export default function EmptyState({
  title = "ไม่มีข้อมูล",
  description,
  action,
  image,
}: EmptyStateProps) {
  return (
    <Card
      size="small"
      variant="outlined"
      style={{ borderRadius: UI_TOKENS.cardRadiusLG }}
      bodyStyle={{ padding: 20 }}
    >
      <Empty
        image={image}
        description={
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Typography.Text strong>{title}</Typography.Text>
            {description ? (
              <Typography.Text type="secondary">{description}</Typography.Text>
            ) : null}
          </div>
        }
      >
        {action}
      </Empty>
    </Card>
  );
}
