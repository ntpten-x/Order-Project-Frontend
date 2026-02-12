import { NextRequest, NextResponse } from "next/server";
import { ordersService } from "../../../../../services/pos/orders.service";
import { handleApiRouteError } from "../../../_utils/route-error";

export async function GET(request: NextRequest) {
    const status = request.nextUrl.searchParams.get("status") || undefined;
    const cookie = request.headers.get("cookie") || "";

    try {
        const items = await ordersService.getItems(status, cookie);
        return NextResponse.json(items);
    } catch (error) {
        return handleApiRouteError(error);
    }
}
