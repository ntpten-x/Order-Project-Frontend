import { NextRequest, NextResponse } from "next/server";
import { ordersService } from "../../../../../../../services/pos/orders.service";
import { handleApiRouteError } from "../../../../../_utils/route-error";

interface Params {
    params: {
        itemId: string;
    };
}

// PATCH: Update item status (Serve, Cancel, etc.)
export async function PATCH(request: NextRequest, { params }: Params) {
    try {
        const body = await request.json();
        const { status } = body;
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";

        await ordersService.updateItemStatus(params.itemId, status, cookie, csrfToken);
        return NextResponse.json({ success: true });
    } catch (error) {
        return handleApiRouteError(error);
    }
}