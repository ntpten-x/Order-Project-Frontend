"use client";

import React from "react";
import { ReloadOutlined, WifiOutlined } from "@ant-design/icons";
import { Button, Space, theme } from "antd";
import { useRouter } from "next/navigation";

import PageContainer from "../../components/ui/page/PageContainer";
import PageSection from "../../components/ui/page/PageSection";
import UIPageHeader from "../../components/ui/page/PageHeader";
import UIEmptyState from "../../components/ui/states/EmptyState";

export default function OfflinePage() {
  const router = useRouter();
  const { token } = theme.useToken();

  const handleRetry = () => {
    if (navigator.onLine) {
      router.refresh();
    } else {
      window.location.reload();
    }
  };

  return (
    <>
      <UIPageHeader
        title="ออฟไลน์"
        subtitle="ไม่มีการเชื่อมต่ออินเทอร์เน็ต"
      />
      <PageContainer
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
        }}
      >
        <PageSection style={{ width: "100%" }}>
          <UIEmptyState
          image={
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 999,
                display: "grid",
                placeItems: "center",
                margin: "0 auto",
                background: token.colorWarningBg,
                color: token.colorWarning,
                boxShadow: `0 8px 16px ${token.colorWarningBg}`,
              }}
            >
              <WifiOutlined style={{ fontSize: 36 }} />
            </div>
          }
          title="ขาดการเชื่อมต่อ"
          description={
            <>
              ดูเหมือนว่าคุณไม่ได้เชื่อมต่ออินเทอร์เน็ต
              <br />
              กรุณาตรวจสอบเครือข่าย แล้วลองใหม่อีกครั้ง
            </>
          }
          action={
            <Space size={12} wrap>
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                size="large"
                onClick={handleRetry}
                style={{
                  borderRadius: 14,
                  height: 48,
                  paddingInline: 24,
                }}
              >
                ลองอีกครั้ง
              </Button>
              <Button
                size="large"
                onClick={() => router.push("/")}
                style={{
                  borderRadius: 14,
                  height: 48,
                  paddingInline: 24,
                }}
              >
                กลับหน้าแรก
              </Button>
            </Space>
          }
          />
        </PageSection>
      </PageContainer>
    </>
  );
}
