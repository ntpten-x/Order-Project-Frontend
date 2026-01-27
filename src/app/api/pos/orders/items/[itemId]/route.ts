import { NextRequest, NextResponse } from "next/server";
import { ordersService } from "@/services/pos/orders.service";

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
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to update item" },
            { status: 500 }
        );
    }
}

// DELETE: Remove item from order
export async function DELETE(request: NextRequest, { params }: Params) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";

        await ordersService.deleteItem(params.itemId, cookie, csrfToken);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to delete item" },
            { status: 500 }
        );
    }
}
