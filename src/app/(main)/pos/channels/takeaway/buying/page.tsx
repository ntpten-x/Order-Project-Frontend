"use client";

import React from "react";
import { Layout } from "antd";
import POSTakeAway from "../../../../../../components/pos/POSTakeAway";
import PageContainer from "../../../../../../components/ui/page/PageContainer";

export default function TakeawayBuyingPage() {
    return (
        <PageContainer maxWidth={99999} style={{ padding: 0 }}>
            <Layout style={{ background: "transparent" }}>
                <Layout.Content style={{ background: "transparent" }}>
                    <POSTakeAway />
                </Layout.Content>
            </Layout>
        </PageContainer>
    );
}
