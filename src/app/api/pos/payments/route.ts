import { paymentsService } from "../../../../services/pos/payments.service";
import { NextRequest, NextResponse } from "next/server";
import { handleApiRouteError } from "../../_utils/route-error";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const payments = await paymentsService.getAll(cookie);
        return NextResponse.json(payments);
    } catch (error: unknown) {
        console.error("API Error (GET):", error);
        return handleApiRouteError(error);
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
        return handleApiRouteError(error);
    }
}
