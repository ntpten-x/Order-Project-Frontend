"use client";

import React from "react";
import { useParams } from "next/navigation";
import { Layout } from "antd";
import POSDineIn from "../../../../../../components/pos/POSDineIn";
import PageContainer from "../../../../../../components/ui/page/PageContainer";

export default function DineInPOSPage() {
    const params = useParams();
    const tableId = params.tableId as string;

    return (
        <PageContainer maxWidth={99999} style={{ padding: 0 }}>
            <Layout style={{ background: "transparent" }}>
                <Layout.Content style={{ background: "transparent" }}>
                    <POSDineIn tableId={tableId} />
                </Layout.Content>
            </Layout>
        </PageContainer>
    );
}
