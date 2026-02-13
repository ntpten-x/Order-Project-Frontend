import { ordersService } from "../../../../../services/stock/orders.service";
import { NextRequest, NextResponse } from "next/server";
import { handleApiRouteError } from "../../../_utils/route-error";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const cookie = request.headers.get("cookie") || "";
        const order = await ordersService.getOrderById(id, cookie);
        return NextResponse.json(order);
    } catch (error: unknown) {
        console.error("API Error:", error);
        return handleApiRouteError(error);
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";
        await ordersService.deleteOrder(id, cookie, csrfToken);
        return NextResponse.json({ message: "Order deleted successfully" });
    } catch (error: unknown) {
        console.error("API Error:", error);
        return handleApiRouteError(error);
    }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const body = await request.json();
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";
        // Assumes updateOrder takes items array in body.items
        const order = await ordersService.updateOrder(id, body.items, cookie, csrfToken);
        return NextResponse.json(order);
    } catch (error: unknown) {
        console.error("API Error:", error);
        return handleApiRouteError(error);
    }
}