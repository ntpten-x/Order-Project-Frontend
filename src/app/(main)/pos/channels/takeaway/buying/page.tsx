"use client";

import React from "react";
import { Layout } from "antd";
import POSTakeAway from "../../../../../../components/pos/POSTakeAway";

export default function TakeawayBuyingPage() {
    return (
        <Layout style={{ background: "transparent" }}>
            <Layout.Content style={{ background: "transparent" }}>
                <POSTakeAway />
            </Layout.Content>
        </Layout>
    );
}
