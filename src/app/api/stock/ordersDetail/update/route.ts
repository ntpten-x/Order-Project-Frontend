import { ordersService } from "../../../../../services/stock/orders.service";
import { NextRequest, NextResponse } from "next/server";
import { handleApiRouteError } from "../../../_utils/route-error";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const detail = await ordersService.updatePurchaseDetail(body);
        return NextResponse.json(detail);
    } catch (error: unknown) {
        console.error("API Error:", error);
        return handleApiRouteError(error);
    }
}
