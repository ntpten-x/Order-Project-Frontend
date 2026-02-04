"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Flex, Spin, Typography, theme } from "antd";

type RedirectPageProps = {
  to: string;
  label?: string;
};

export default function RedirectPage({ to, label }: RedirectPageProps) {
  const router = useRouter();
  const { token } = theme.useToken();

  useEffect(() => {
    router.replace(to);
  }, [router, to]);

  return (
    <Flex
      align="center"
      justify="center"
      style={{
        minHeight: "100vh",
        padding: 24,
        background: token.colorBgLayout,
      }}
    >
      <Flex vertical align="center" gap={12}>
        <Spin size="large" />
        <Typography.Text type="secondary">
          {label ?? "กำลังนำทาง..."}
        </Typography.Text>
      </Flex>
    </Flex>
  );
}

