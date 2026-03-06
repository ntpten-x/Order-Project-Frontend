"use client";

import React from "react";
import { Layout } from "antd";

import { CartProvider } from "../../contexts/stock/CartContext";
import { useRoleGuard } from "../../utils/pos/accessControl";
import { AccessGuardFallback } from "../../components/pos/AccessGuard";

function MainPermissionGate({ children }: { children: React.ReactNode }) {
  const { isChecking, isAuthorized } = useRoleGuard({
    requiredRole: undefined,
    unauthorizedMessage: "You do not have permission to access this page.",
  });

  if (isChecking) {
    return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์..." />;
  }

  if (!isAuthorized) {
    return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้" tone="danger" />;
  }

  return <>{children}</>;
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <Layout style={{ minHeight: "100%", background: "transparent" }}>
        <Layout.Content style={{ background: "transparent" }}>
          <MainPermissionGate>{children}</MainPermissionGate>
        </Layout.Content>
      </Layout>
    </CartProvider>
  );
}
