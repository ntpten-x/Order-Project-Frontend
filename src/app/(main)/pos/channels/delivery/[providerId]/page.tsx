"use client";

import React from "react";
import { Layout } from "antd";

import POSDelivery from "../../../../../../components/pos/POSDelivery";
import POSOrderComposerGuard from "../../../../../../components/pos/channels/POSOrderComposerGuard";
import PageContainer from "../../../../../../components/ui/page/PageContainer";

interface Props {
    params: {
        providerId: string;
    };
    searchParams: {
        code?: string;
    };
}

export default function DeliveryBuyingPage({ params, searchParams }: Props) {
    const providerId = params.providerId;
    const deliveryCode = searchParams.code?.trim() || "";

    return (
        <POSOrderComposerGuard
            backPath="/pos/channels/delivery"
            invalidMessage={!providerId || !deliveryCode ? "กรุณาเลือกผู้ให้บริการและระบุรหัสออเดอร์ก่อนเริ่มรายการ" : null}
        >
            <PageContainer maxWidth={99999} style={{ padding: 0 }}>
                <Layout style={{ background: "transparent" }}>
                    <Layout.Content style={{ background: "transparent" }}>
                        <POSDelivery providerId={providerId} deliveryCode={deliveryCode} />
                    </Layout.Content>
                </Layout>
            </PageContainer>
        </POSOrderComposerGuard>
    );
}
