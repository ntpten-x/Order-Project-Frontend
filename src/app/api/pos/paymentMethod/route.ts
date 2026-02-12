import { paymentMethodService } from "../../../../services/pos/paymentMethod.service";
import { NextRequest, NextResponse } from "next/server";
import { handleApiRouteError } from "../../_utils/route-error";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const searchParams = new URLSearchParams(request.nextUrl.searchParams);
        const paymentMethods = await paymentMethodService.getAll(cookie, searchParams);
        return NextResponse.json(paymentMethods);
    } catch (error: unknown) {
        console.error("API Error:", error);
        return handleApiRouteError(error);
    }
}
