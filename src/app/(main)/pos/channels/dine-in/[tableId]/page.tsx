"use client";

import React from "react";
import { Layout } from "antd";
import { useParams } from "next/navigation";

import POSDineIn from "../../../../../../components/pos/POSDineIn";
import POSOrderComposerGuard from "../../../../../../components/pos/channels/POSOrderComposerGuard";
import PageContainer from "../../../../../../components/ui/page/PageContainer";

export default function DineInPOSPage() {
    const params = useParams();
    const tableId = typeof params.tableId === "string" ? params.tableId : "";

    return (
        <POSOrderComposerGuard
            backPath="/pos/channels/dine-in"
            invalidMessage={!tableId ? "ไม่พบรหัสโต๊ะที่ต้องการเปิดออเดอร์" : null}
        >
            <PageContainer maxWidth={99999} style={{ padding: 0 }}>
                <Layout style={{ background: "transparent" }}>
                    <Layout.Content style={{ background: "transparent" }}>
                        <POSDineIn tableId={tableId} />
                    </Layout.Content>
                </Layout>
            </PageContainer>
        </POSOrderComposerGuard>
    );
}
