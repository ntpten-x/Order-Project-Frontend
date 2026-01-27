import { NextRequest, NextResponse } from "next/server";
import { ordersService } from "@/services/pos/orders.service";

interface Params {
    params: {
        id: string;
    };
}

// GET: Fetch single order by ID
export async function GET(request: NextRequest, { params }: Params) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const order = await ordersService.getById(params.id, cookie);
        return NextResponse.json(order);
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to fetch order" },
            { status: 500 }
        );
    }
}

// PUT: Update order details
export async function PUT(request: NextRequest, { params }: Params) {
    try {
        const body = await request.json();
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";

        const updatedOrder = await ordersService.update(params.id, body, cookie, csrfToken);
        return NextResponse.json(updatedOrder);
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to update order" },
            { status: 500 }
        );
    }
}

// DELETE: Delete order
export async function DELETE(request: NextRequest, { params }: Params) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";

        await ordersService.delete(params.id, cookie, csrfToken);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to delete order" },
            { status: 500 }
        );
    }
}
