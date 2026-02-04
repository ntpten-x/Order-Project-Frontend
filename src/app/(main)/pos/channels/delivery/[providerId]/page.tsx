"use client";

import React from "react";
import { Layout } from "antd";
import POSDelivery from "../../../../../../components/pos/POSDelivery";

interface Props {
  params: {
    providerId: string;
  };
  searchParams: {
    code: string;
  };
}

export default function DeliveryBuyingPage({ params, searchParams }: Props) {
    return (
        <Layout style={{ background: "transparent" }}>
            <Layout.Content style={{ background: "transparent" }}>
                <POSDelivery 
                    providerId={params.providerId} 
                    deliveryCode={searchParams.code} 
                />
            </Layout.Content>
        </Layout>
    );
}
