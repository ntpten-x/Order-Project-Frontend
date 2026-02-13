import { paymentDetailsService } from "../../../../../services/pos/paymentDetails.service";
import { NextRequest, NextResponse } from "next/server";
import { handleApiRouteError } from "../../../_utils/route-error";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";
        const paymentDetail = await paymentDetailsService.create(body, cookie, csrfToken);
        return NextResponse.json(paymentDetail);
    } catch (error: unknown) {
        console.error("API Error:", error);
        return handleApiRouteError(error);
    }
}
