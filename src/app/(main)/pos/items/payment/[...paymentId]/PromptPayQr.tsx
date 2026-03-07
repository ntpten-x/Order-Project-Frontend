"use client";

import React from "react";
import { QRCodeSVG } from "qrcode.react";
import generatePayload from "promptpay-qr";

type PromptPayQrProps = {
    promptpayNumber: string;
    amount: number;
};

export default function PromptPayQr({ promptpayNumber, amount }: PromptPayQrProps) {
    return (
        <QRCodeSVG
            value={generatePayload(promptpayNumber, { amount })}
            size={200}
            level="L"
            includeMargin
        />
    );
}
