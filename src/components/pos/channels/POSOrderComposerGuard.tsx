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
    const canViewChannels = can("orders.channels.feature", "view");
    const canCreateOrder = can("orders.channel_create.feature", "create");

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
                            title="Missing input"
                            subTitle={invalidMessage}
                            extra={
                                <Button type="primary" onClick={() => router.push(backPath)}>
                                    Back
                                </Button>
                            }
                        />
                    </Layout.Content>
                </Layout>
            </PageContainer>
        );
    }

    if (!canViewChannels) {
        return (
            <PageContainer maxWidth={99999} style={{ padding: 0 }}>
                <Layout style={{ background: "transparent" }}>
                    <Layout.Content style={{ background: "transparent" }}>
                        <Result
                            status="403"
                            title="403"
                            subTitle="You do not have access to this sales-channel workspace."
                            extra={
                                <Button type="primary" onClick={() => router.push(backPath)}>
                                    Back
                                </Button>
                            }
                        />
                    </Layout.Content>
                </Layout>
            </PageContainer>
        );
    }

    if (!canCreateOrder) {
        return (
            <PageContainer maxWidth={99999} style={{ padding: 0 }}>
                <Layout style={{ background: "transparent" }}>
                    <Layout.Content style={{ background: "transparent" }}>
                        <Result
                            status="403"
                            title="403"
                            subTitle="You do not have permission to create orders from this workspace."
                            extra={
                                <Button type="primary" onClick={() => router.push(backPath)}>
                                    Back
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
