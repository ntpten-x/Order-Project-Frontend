import { salesOrderItemService } from "../../../../services/pos/salesOrderItem.service";
import { NextRequest, NextResponse } from "next/server";
import { handleApiRouteError } from "../../_utils/route-error";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const items = await salesOrderItemService.getAll(cookie);
        return NextResponse.json(items);
    } catch (error: unknown) {
        console.error("API Error:", error);
        return handleApiRouteError(error);
    }
}
