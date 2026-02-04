"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Flex, Spin, Typography } from "antd";

import PageContainer from "@/components/ui/page/PageContainer";
import PageSection from "@/components/ui/page/PageSection";
import UIPageHeader from "@/components/ui/page/PageHeader";

type RedirectPageProps = {
  to: string;
  label?: string;
  title?: string;
};

export default function RedirectPage({ to, label, title }: RedirectPageProps) {
  const router = useRouter();

  useEffect(() => {
    router.replace(to);
  }, [router, to]);

  const subtitle = label ?? "กำลังนำทาง...";

  return (
    <>
      <UIPageHeader title={title ?? "กำลังนำทาง"} subtitle={subtitle} />
      <PageContainer
        style={{
          minHeight: "70vh",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div style={{ width: "100%", maxWidth: 520, margin: "0 auto" }}>
          <PageSection>
            <Flex vertical align="center" gap={12} style={{ padding: 8 }}>
              <Spin size="large" />
              <Typography.Text type="secondary">{subtitle}</Typography.Text>
            </Flex>
          </PageSection>
        </div>
      </PageContainer>
    </>
  );
}
