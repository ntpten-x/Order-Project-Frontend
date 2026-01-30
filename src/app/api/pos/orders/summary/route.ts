import { NextRequest, NextResponse } from "next/server";
import { ordersService } from "@/services/pos/orders.service";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "50");
        const status = searchParams.get("status") || undefined;
        const type = searchParams.get("type") || undefined;
        const cookie = request.headers.get("cookie") || "";

        const data = await ordersService.getAllSummary(cookie, page, limit, status, type);
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to fetch orders summary" },
            { status: 500 }
        );
    }
}
