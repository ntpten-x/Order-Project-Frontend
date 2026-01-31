import { NextRequest, NextResponse } from "next/server";
import { ordersService } from "../../../../services/pos/orders.service";

// GET: Fetch all orders
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "50");
        const status = searchParams.get("status") || undefined;
        const type = searchParams.get("type") || undefined;
        const query = searchParams.get("q") || undefined;
        const cookie = request.headers.get("cookie") || "";

        const data = await ordersService.getAll(cookie, page, limit, status, type, query);
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to fetch orders" },
            { status: 500 }
        );
    }
}

// POST: Create a new order
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";

        const newOrder = await ordersService.create(body, cookie, csrfToken);
        return NextResponse.json(newOrder);
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to create order" },
            { status: 500 }
        );
    }
}
