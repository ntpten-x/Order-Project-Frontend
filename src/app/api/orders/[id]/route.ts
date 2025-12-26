import { ordersService } from "@/services/orders.service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const cookie = request.headers.get("cookie") || "";
        const order = await ordersService.getOrderById(id, cookie);
        return NextResponse.json(order);
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: (error as Error).message || "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const cookie = request.headers.get("cookie") || "";
        await ordersService.deleteOrder(id, cookie);
        return NextResponse.json({ message: "Order deleted successfully" });
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: (error as Error).message || "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const body = await request.json();
        const cookie = request.headers.get("cookie") || "";
        // Assumes updateOrder takes items array in body.items
        const order = await ordersService.updateOrder(id, body.items, cookie);
        return NextResponse.json(order);
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: (error as Error).message || "Internal Server Error" }, { status: 500 });
    }
}
