"use client";

import React from "react";
import { Layout } from "antd";
import { AccessGuardFallback } from "../../components/pos/AccessGuard";
import { useRoleGuard } from "../../utils/pos/accessControl";

function MainPermissionGate({ children }: { children: React.ReactNode }) {
    const { isChecking, isAuthorized } = useRoleGuard({
        requiredRole: undefined,
        unauthorizedMessage: "คุณไม่มีสิทธิ์เข้าถึงหน้านี้",
    });

    if (isChecking) {
        return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์..." />;
    }

    if (!isAuthorized) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้" tone="danger" />;
    }

    return <>{children}</>;
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <Layout style={{ minHeight: "100%", background: "transparent" }}>
            <Layout.Content style={{ background: "transparent" }}>
                <MainPermissionGate>{children}</MainPermissionGate>
            </Layout.Content>
        </Layout>
    );
}
