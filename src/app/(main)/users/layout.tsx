"use client";

import React from "react";
import { Layout } from "antd";
import UsersBottomNavigation from "../../../components/users/UsersBottomNavigation";

export default function UsersLayout({
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
      <UsersBottomNavigation />
    </Layout>
    </>
  );
}
