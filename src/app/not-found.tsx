"use client";

import React from "react";
import { HomeOutlined } from "@ant-design/icons";
import { Button, Result } from "antd";
import { useRouter } from "next/navigation";

import PageContainer from "../components/ui/page/PageContainer";
import PageSection from "../components/ui/page/PageSection";

export default function NotFound() {
  const router = useRouter();

  return (
    <PageContainer
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: 560, margin: "0 auto" }}>
        <PageSection>
          <Result
            status="404"
            title="ไม่พบหน้านี้"
            subTitle="หน้าที่คุณพยายามเข้าถึงอาจถูกย้าย หรือไม่มีอยู่ในระบบ"
            extra={
              <Button
                type="primary"
                icon={<HomeOutlined />}
                size="large"
                onClick={() => router.push("/")}
                style={{ borderRadius: 14, height: 48, paddingInline: 24 }}
              >
                กลับหน้าแรก
              </Button>
            }
          />
        </PageSection>
      </div>
    </PageContainer>
  );
}
