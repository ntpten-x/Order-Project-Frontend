"use client";

import React from "react";
import { Layout } from "antd";

import AuditBottomNavigation from "../../../components/audit/AuditBottomNavigation";

export default function AuditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Layout style={{ minHeight: "100%", background: "transparent" }}>
      <Layout.Content style={{ background: "transparent" }}>
        {children}
      </Layout.Content>
      <AuditBottomNavigation />
    </Layout>
  );
}
