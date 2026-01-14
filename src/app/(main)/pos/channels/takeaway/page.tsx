"use client";

import React, { useMemo } from "react";
import POSTakeAway from "../../../../../components/pos/POSTakeAway";

export default function TakeawayPOSPage() {
    // Generate a simple queue number client-side for now
    const queueNumber = useMemo(() => `Q-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`, []);

    return (
        <POSTakeAway queueNumber={queueNumber} />
    );
}
