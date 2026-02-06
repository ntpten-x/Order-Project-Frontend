"use client";

import React from "react";
import { Button, Flex, Spin, Typography, Result } from "antd";
import { UI_TOKENS } from "../tokens";
import { t } from "../../../utils/i18n";

const { Text } = Typography;

type PageStateProps = {
  status: "loading" | "error" | "empty";
  title?: string;
  description?: string;
  onRetry?: () => void;
  action?: React.ReactNode;
  style?: React.CSSProperties;
};

export default function PageState({
  status,
  title,
  description,
  onRetry,
  action,
  style,
}: PageStateProps) {
  if (status === "loading") {
    return (
      <Flex align="center" justify="center" style={{ minHeight: 200, ...style, gap: 12 }}>
        <Spin size="large" />
        <Text type="secondary">{title || t("network.loading")}</Text>
      </Flex>
    );
  }

  if (status === "error") {
    return (
      <Result
        status="error"
        title={title || t("page.error")}
        subTitle={description}
        extra={
          action ||
          (onRetry ? (
            <Button type="primary" onClick={onRetry}>
              {t("page.retry")}
            </Button>
          ) : undefined)
        }
        style={{ padding: UI_TOKENS.pagePaddingY, ...style }}
      />
    );
  }

  return (
    <Result
      status="info"
      title={title || t("page.empty")}
      subTitle={description}
      extra={action}
      style={{ padding: UI_TOKENS.pagePaddingY, ...style }}
    />
  );
}
