"use client";

import React, { useEffect } from "react";
import { Button, Result, Space, Typography } from "antd";
import { useRouter } from "next/navigation";

import PageContainer from "../components/ui/page/PageContainer";
import PageSection from "../components/ui/page/PageSection";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("Unhandled application error:", error);
    }
  }, [error]);

  return (
    <PageContainer
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: 640, margin: "0 auto" }}>
        <PageSection>
          <Result
            status="500"
            title="เกิดข้อผิดพลาด"
            subTitle={
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Typography.Text type="secondary">
                  ขออภัย ระบบไม่สามารถดำเนินการตามคำขอของคุณได้ในขณะนี้
                </Typography.Text>
                <Typography.Text code style={{ maxWidth: "100%" }}>
                  {error.message || "Unknown error"}
                </Typography.Text>
              </div>
            }
            extra={
              <Space size={12} wrap>
                <Button
                  type="primary"
                  size="large"
                  onClick={reset}
                  style={{ borderRadius: 14, height: 48, paddingInline: 24 }}
                >
                  ลองใหม่อีกครั้ง
                </Button>
                <Button
                  size="large"
                  onClick={() => router.push("/")}
                  style={{ borderRadius: 14, height: 48, paddingInline: 24 }}
                >
                  กลับหน้าแรก
                </Button>
              </Space>
            }
          />
        </PageSection>
      </div>
    </PageContainer>
  );
}
