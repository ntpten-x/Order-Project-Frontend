"use client";

import React from "react";
import { Layout, Result, Button, Spin } from "antd";
import { useRouter } from "next/navigation";
import POSDelivery from "../../../../../../components/pos/POSDelivery";
import PageContainer from "../../../../../../components/ui/page/PageContainer";
import { useAuth } from "../../../../../../contexts/AuthContext";
import { useEffectivePermissions } from "../../../../../../hooks/useEffectivePermissions";

interface Props {
  params: {
    providerId: string;
  };
  searchParams: {
    code: string;
  };
}

export default function DeliveryBuyingPage({ params, searchParams }: Props) {
    const router = useRouter();
    const { user } = useAuth();
    const { can, loading } = useEffectivePermissions({ enabled: Boolean(user?.id) });

    if (!user) return null;
    if (loading && user.role !== "Admin") {
        return (
            <PageContainer maxWidth={99999} style={{ padding: 0 }}>
                <Layout style={{ background: "transparent", minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Spin size="large" />
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
                            subTitle="คุณไม่มีสิทธิ์สร้างออเดอร์ (ต้องมีสิทธิ์ orders.page:create)"
                            extra={
                                <Button type="primary" onClick={() => router.push("/pos/channels/delivery")}>
                                    กลับไปหน้าช่องทาง
                                </Button>
                            }
                        />
                    </Layout.Content>
                </Layout>
            </PageContainer>
        );
    }

    return (
        <PageContainer maxWidth={99999} style={{ padding: 0 }}>
            <Layout style={{ background: "transparent" }}>
                <Layout.Content style={{ background: "transparent" }}>
                    <POSDelivery
                        providerId={params.providerId}
                        deliveryCode={searchParams.code}
                    />
                </Layout.Content>
            </Layout>
        </PageContainer>
    );
}
