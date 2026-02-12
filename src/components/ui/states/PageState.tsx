"use client";

import React from "react";
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
  const resolvedStatus = errorStatus ?? resolveHttpStatus(error);
  const backendMessage = resolveHttpErrorMessage(error);

  const fallbackTitle =
    resolvedStatus === 401
      ? "เซสชันหมดอายุ (401)"
      : resolvedStatus === 403
        ? "ไม่มีสิทธิ์เข้าถึง (403)"
        : resolvedStatus === 409
          ? "ข้อมูลขัดแย้ง (409)"
          : t("page.error");

  const fallbackDescription =
    resolvedStatus === 401
      ? "กรุณาเข้าสู่ระบบใหม่ แล้วลองอีกครั้ง"
      : resolvedStatus === 403
        ? "คุณไม่มีสิทธิ์สำหรับการกระทำนี้ สามารถกดขอสิทธิ์ใช้งานได้"
        : resolvedStatus === 409
          ? "ข้อมูลถูกเปลี่ยนแปลงระหว่างทำรายการ กรุณารีเฟรชและลองอีกครั้ง"
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
        message.success("คัดลอกข้อความขอสิทธิ์แล้ว ส่งให้ผู้ดูแลระบบได้ทันที");
        return;
      } catch {
        // Continue to fallback message below.
      }
    }

    message.info("กรุณาติดต่อผู้ดูแลระบบเพื่อขอสิทธิ์ใช้งาน");
  };

  const handleLogin = () => {
    if (onLogin) {
      onLogin();
      return;
    }
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  };

  const handleConflictRefresh = () => {
    if (onRetry) {
      onRetry();
      return;
    }
    if (typeof window !== "undefined") {
      window.location.reload();
    }
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
            เข้าสู่ระบบใหม่
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
            ขอสิทธิ์ใช้งาน
          </Button>
        </Space>
      );
    } else if (resolvedStatus === 409) {
      defaultAction = (
        <Button type="primary" onClick={handleConflictRefresh}>
          รีเฟรชข้อมูลและลองอีกครั้ง
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
