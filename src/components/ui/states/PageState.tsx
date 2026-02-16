"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button, Flex, Spin, Typography, Result, Space, message } from "antd";
import { UI_TOKENS } from "../tokens";
import { t } from "../../../utils/i18n";
import { resolveHttpErrorMessage, resolveHttpStatus } from "../../../utils/ui/httpError";

const { Text } = Typography;

type PageStateProps = {
  status: "loading" | "error" | "empty";
  title?: string;
  description?: string;
  onRetry?: () => void;
  onRequestAccess?: () => void;
  onLogin?: () => void;
  error?: unknown;
  errorStatus?: number;
  action?: React.ReactNode;
  style?: React.CSSProperties;
};

export default function PageState({
  status,
  title,
  description,
  onRetry,
  onRequestAccess,
  onLogin,
  error,
  errorStatus,
  action,
  style,
}: PageStateProps) {
  const router = useRouter();
  const resolvedStatus = errorStatus ?? resolveHttpStatus(error);
  const backendMessage = resolveHttpErrorMessage(error);

  const fallbackTitle =
    resolvedStatus === 401
      ? "เน€เธเธชเธเธฑเธเธซเธกเธ”เธญเธฒเธขเธธ (401)"
      : resolvedStatus === 403
        ? "เนเธกเนเธกเธตเธชเธดเธ—เธเธดเนเน€เธเนเธฒเธ–เธถเธ (403)"
        : resolvedStatus === 409
          ? "เธเนเธญเธกเธนเธฅเธเธฑเธ”เนเธขเนเธ (409)"
          : t("page.error");

  const fallbackDescription =
    resolvedStatus === 401
      ? "เธเธฃเธธเธ“เธฒเน€เธเนเธฒเธชเธนเนเธฃเธฐเธเธเนเธซเธกเน เนเธฅเนเธงเธฅเธญเธเธญเธตเธเธเธฃเธฑเนเธ"
      : resolvedStatus === 403
        ? "เธเธธเธ“เนเธกเนเธกเธตเธชเธดเธ—เธเธดเนเธชเธณเธซเธฃเธฑเธเธเธฒเธฃเธเธฃเธฐเธ—เธณเธเธตเน เธชเธฒเธกเธฒเธฃเธ–เธเธ”เธเธญเธชเธดเธ—เธเธดเนเนเธเนเธเธฒเธเนเธ”เน"
        : resolvedStatus === 409
          ? "เธเนเธญเธกเธนเธฅเธ–เธนเธเน€เธเธฅเธตเนเธขเธเนเธเธฅเธเธฃเธฐเธซเธงเนเธฒเธเธ—เธณเธฃเธฒเธขเธเธฒเธฃ เธเธฃเธธเธ“เธฒเธฃเธตเน€เธเธฃเธเนเธฅเธฐเธฅเธญเธเธญเธตเธเธเธฃเธฑเนเธ"
          : undefined;

  const resolvedTitle = title || (status === "error" ? fallbackTitle : undefined);
  const resolvedDescription =
    description || backendMessage || (status === "error" ? fallbackDescription : undefined);

  const handleRequestAccess = async () => {
    if (onRequestAccess) {
      onRequestAccess();
      return;
    }

    const path = typeof window !== "undefined" ? window.location.pathname : "";
    const requestText = `Request access\nPath: ${path}\nReason: 403 forbidden\nTime: ${new Date().toISOString()}`;

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(requestText);
        message.success("เธเธฑเธ”เธฅเธญเธเธเนเธญเธเธงเธฒเธกเธเธญเธชเธดเธ—เธเธดเนเนเธฅเนเธง เธชเนเธเนเธซเนเธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธเนเธ”เนเธ—เธฑเธเธ—เธต");
        return;
      } catch {
        // Continue to fallback message below.
      }
    }

    message.info("เธเธฃเธธเธ“เธฒเธ•เธดเธ”เธ•เนเธญเธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธเน€เธเธทเนเธญเธเธญเธชเธดเธ—เธเธดเนเนเธเนเธเธฒเธ");
  };

  const handleLogin = () => {
    if (onLogin) {
      onLogin();
      return;
    }
    router.push("/login");
  };

  const handleConflictRefresh = () => {
    if (onRetry) {
      onRetry();
      return;
    }
    router.refresh();
  };

  let defaultAction: React.ReactNode | undefined;
  if (status === "error") {
    if (resolvedStatus === 401) {
      defaultAction = (
        <Space size={8}>
          {onRetry ? (
            <Button onClick={onRetry}>{t("page.retry")}</Button>
          ) : null}
          <Button type="primary" onClick={handleLogin}>
            เน€เธเนเธฒเธชเธนเนเธฃเธฐเธเธเนเธซเธกเน
          </Button>
        </Space>
      );
    } else if (resolvedStatus === 403) {
      defaultAction = (
        <Space size={8}>
          {onRetry ? (
            <Button onClick={onRetry}>{t("page.retry")}</Button>
          ) : null}
          <Button type="primary" onClick={handleRequestAccess}>
            เธเธญเธชเธดเธ—เธเธดเนเนเธเนเธเธฒเธ
          </Button>
        </Space>
      );
    } else if (resolvedStatus === 409) {
      defaultAction = (
        <Button type="primary" onClick={handleConflictRefresh}>
          เธฃเธตเน€เธเธฃเธเธเนเธญเธกเธนเธฅเนเธฅเธฐเธฅเธญเธเธญเธตเธเธเธฃเธฑเนเธ
        </Button>
      );
    } else if (onRetry) {
      defaultAction = (
        <Button type="primary" onClick={onRetry}>
          {t("page.retry")}
        </Button>
      );
    }
  }

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
        title={resolvedTitle}
        subTitle={resolvedDescription}
        extra={action || defaultAction}
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
