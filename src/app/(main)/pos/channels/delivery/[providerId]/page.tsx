"use client";

import React from "react";
import { useParams, useSearchParams } from "next/navigation";
import POSDelivery from "../../../../../../components/pos/POSDelivery";

export default function DeliveryPOSPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    
    const providerId = params.providerId as string;
    const deliveryCode = searchParams.get('code') || "";

    return (
        <POSDelivery providerId={providerId} deliveryCode={deliveryCode} />
    );
}
