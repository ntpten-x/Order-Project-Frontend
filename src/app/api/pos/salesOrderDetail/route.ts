import { salesOrderDetailService } from "../../../../services/pos/salesOrderDetail.service";
import { NextRequest, NextResponse } from "next/server";
import { handleApiRouteError } from "../../_utils/route-error";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const details = await salesOrderDetailService.getAll(cookie);
        return NextResponse.json(details);
    } catch (error: unknown) {
        console.error("API Error:", error);
        return handleApiRouteError(error);
    }
}
