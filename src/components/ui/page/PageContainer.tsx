"use client";

import React from "react";
import { Grid } from "antd";

import { UI_TOKENS } from "../tokens";

type PageContainerProps = {
  children: React.ReactNode;
  maxWidth?: number;
  style?: React.CSSProperties;
};

export default function PageContainer({
  children,
  maxWidth = UI_TOKENS.pageMaxWidth,
  style,
}: PageContainerProps) {
  const screens = Grid.useBreakpoint();
  const paddingX = screens.md ? UI_TOKENS.pagePaddingXDesktop : UI_TOKENS.pagePaddingXMobile;

  return (
    <div
      style={{
        width: "100%",
        maxWidth,
        margin: "0 auto",
        padding: `${UI_TOKENS.pagePaddingY}px ${paddingX}px`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

