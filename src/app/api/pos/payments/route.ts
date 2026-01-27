import { paymentsService } from "../../../../services/pos/payments.service";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const payments = await paymentsService.getAll(cookie);
        return NextResponse.json(payments);
    } catch (error: unknown) {
        console.error("API Error (GET):", error);
        return NextResponse.json({ error: (error as Error).message || "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";
        const payment = await paymentsService.create(body, cookie, csrfToken);
        return NextResponse.json(payment);
    } catch (error: unknown) {
        console.error("API Error (POST):", error);
        return NextResponse.json({ error: (error as Error).message || "Internal Server Error" }, { status: 500 });
    }
}
