"use client";

import React from "react";
import { Card, Skeleton } from "antd";

import { UI_TOKENS } from "../tokens";

type PageSkeletonProps = {
  rows?: number;
};

export default function PageSkeleton({ rows = 6 }: PageSkeletonProps) {
  return (
    <Card
      size="small"
      variant="outlined"
      style={{ borderRadius: UI_TOKENS.cardRadiusLG }}
      bodyStyle={{ padding: 20 }}
    >
      <Skeleton active title paragraph={{ rows }} />
    </Card>
  );
}

