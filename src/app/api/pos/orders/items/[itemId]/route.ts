import { NextRequest, NextResponse } from "next/server";
import { ordersService } from "../../../../../../services/pos/orders.service";
import { handleApiRouteError } from "../../../../_utils/route-error";

interface Params {
    params: {
        itemId: string;
    };
}

// PUT: Update item details (quantity, notes)
export async function PUT(request: NextRequest, { params }: Params) {
    try {
        const body = await request.json();
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";

        const updatedOrder = await ordersService.updateItem(params.itemId, body, cookie, csrfToken);
        return NextResponse.json(updatedOrder);
    } catch (error) {
        return handleApiRouteError(error);
    }
}

// DELETE: Soft-cancel item from order (backend keeps item history)
export async function DELETE(request: NextRequest, { params }: Params) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";

        await ordersService.deleteItem(params.itemId, cookie, csrfToken);
        return NextResponse.json({ success: true });
    } catch (error) {
        return handleApiRouteError(error);
    }
}
