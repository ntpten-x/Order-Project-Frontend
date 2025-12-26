import { NextRequest, NextResponse } from "next/server";
import { ordersService } from "@/services/orders.service";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const body = await request.json();
        const { items, purchased_by_id } = body;
        const cookie = request.headers.get("cookie") || "";
        const order = await ordersService.confirmPurchase(id, items, purchased_by_id, cookie);
        return NextResponse.json(order);
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: (error as Error).message || "Internal Server Error" }, { status: 500 });
    }
}
