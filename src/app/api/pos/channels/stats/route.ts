import { NextRequest, NextResponse } from "next/server";
import { ordersService } from "@/services/pos/orders.service";

export async function GET(request: NextRequest) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const stats = await ordersService.getStats(cookie);
        return NextResponse.json(stats);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Failed to fetch channel stats" },
            { status: 500 }
        );
    }
}
