import { paymentDetailsService } from "../../../../services/pos/paymentDetails.service";
import { NextRequest, NextResponse } from "next/server";
import { handleApiRouteError } from "../../_utils/route-error";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const paymentDetails = await paymentDetailsService.getAll(cookie);
        return NextResponse.json(paymentDetails);
    } catch (error: unknown) {
        console.error("API Error:", error);
        return handleApiRouteError(error);
    }
}
