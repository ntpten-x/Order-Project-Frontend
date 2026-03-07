"use client";

import React from "react";
import { Button, Layout, Result, Spin } from "antd";
import { useRouter } from "next/navigation";

import PageContainer from "../../ui/page/PageContainer";
import RequireOpenShift from "../shared/RequireOpenShift";
import { useAuth } from "../../../contexts/AuthContext";
import { useEffectivePermissions } from "../../../hooks/useEffectivePermissions";

type POSOrderComposerGuardProps = {
    backPath: string;
    invalidMessage?: string | null;
    children: React.ReactNode;
};

export default function POSOrderComposerGuard({
    backPath,
    invalidMessage,
    children,
}: POSOrderComposerGuardProps) {
    const router = useRouter();
    const { user } = useAuth();
    const { can, loading } = useEffectivePermissions({ enabled: Boolean(user?.id) });

    if (!user) return null;

    if (loading) {
        return (
            <PageContainer maxWidth={99999} style={{ padding: 0 }}>
                <Layout
                    style={{
                        background: "transparent",
                        minHeight: "60vh",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Spin size="large" />
                </Layout>
            </PageContainer>
        );
    }

    if (invalidMessage) {
        return (
            <PageContainer maxWidth={99999} style={{ padding: 0 }}>
                <Layout style={{ background: "transparent" }}>
                    <Layout.Content style={{ background: "transparent" }}>
                        <Result
                            status="warning"
                            title="ข้อมูลไม่ครบ"
                            subTitle={invalidMessage}
                            extra={
                                <Button type="primary" onClick={() => router.push(backPath)}>
                                    กลับ
                                </Button>
                            }
                        />
                    </Layout.Content>
                </Layout>
            </PageContainer>
        );
    }

    if (!can("orders.page", "create")) {
        return (
            <PageContainer maxWidth={99999} style={{ padding: 0 }}>
                <Layout style={{ background: "transparent" }}>
                    <Layout.Content style={{ background: "transparent" }}>
                        <Result
                            status="403"
                            title="403"
                            subTitle="คุณไม่มีสิทธิ์สร้างออเดอร์"
                            extra={
                                <Button type="primary" onClick={() => router.push(backPath)}>
                                    กลับ
                                </Button>
                            }
                        />
                    </Layout.Content>
                </Layout>
            </PageContainer>
        );
    }

    return <RequireOpenShift>{children}</RequireOpenShift>;
}
