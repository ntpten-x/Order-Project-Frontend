"use client";

import React from "react";
import { Layout } from "antd";
import BranchBottomNavigation from "../../../components/branch/BranchBottomNavigation";

export default function BranchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
    <Layout style={{ minHeight: "100%", background: "transparent" }}>
      <Layout.Content style={{ background: "transparent" }}>
        {children}
      </Layout.Content>
      <BranchBottomNavigation />
    </Layout>
    </>
  );
}
