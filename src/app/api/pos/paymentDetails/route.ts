import { paymentDetailsService } from "../../../../services/pos/paymentDetails.service";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const paymentDetails = await paymentDetailsService.getAll(cookie);
        return NextResponse.json(paymentDetails);
    } catch (error: unknown) {
        console.error("API Error:", error);
        return NextResponse.json({ error: (error as Error).message || "Internal Server Error" }, { status: 500 });
    }
}
