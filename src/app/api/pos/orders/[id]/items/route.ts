import { NextRequest, NextResponse } from "next/server";
import { ordersService } from "@/services/pos/orders.service";

interface Params {
    params: {
        id: string;
    };
}

// POST: Add new item to order
export async function POST(request: NextRequest, { params }: Params) {
    try {
        const body = await request.json();
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";

        const updatedOrder = await ordersService.addItem(params.id, body, cookie, csrfToken);
        return NextResponse.json(updatedOrder);
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to add item" },
            { status: 500 }
        );
    }
}
