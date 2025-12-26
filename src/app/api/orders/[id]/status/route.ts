import { ordersService } from "@/services/orders.service";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const body = await request.json();
        const cookie = request.headers.get("cookie") || "";
        const order = await ordersService.updateStatus(id, body.status, cookie);
        return NextResponse.json(order);
    } catch (error: any) {
        console.error("API Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
