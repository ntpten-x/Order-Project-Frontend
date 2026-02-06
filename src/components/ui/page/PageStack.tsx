"use client";

import React from "react";
import { Flex } from "antd";

import { UI_TOKENS } from "../tokens";

type PageStackProps = {
  children: React.ReactNode;
  gap?: number;
  style?: React.CSSProperties;
};

export default function PageStack({
  children,
  gap = UI_TOKENS.sectionGap,
  style,
}: PageStackProps) {
  return (
    <Flex vertical gap={gap} style={style}>
      {children}
    </Flex>
  );
}

