"use client";

import React from "react";
import { useParams } from "next/navigation";
import POSDineIn from "../../../../../../components/pos/POSDineIn";

export default function DineInPOSPage() {
    const params = useParams();
    const tableId = params.tableId as string;

    return (
        <POSDineIn tableId={tableId} />
    );
}
