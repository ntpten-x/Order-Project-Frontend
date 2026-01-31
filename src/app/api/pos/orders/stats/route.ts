
import { NextRequest, NextResponse } from "next/server";
import { ordersService } from "../../../../../services/pos/orders.service";

// GET: Fetch order statistics
export async function GET(request: NextRequest) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const stats = await ordersService.getStats(cookie);
        return NextResponse.json(stats);
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to fetch order statistics" },
            { status: 500 }
        );
    }
}
