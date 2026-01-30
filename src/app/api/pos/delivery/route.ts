import { deliveryService } from "../../../../services/pos/delivery.service";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const searchParams = new URLSearchParams(request.nextUrl.searchParams);
        const delivery = await deliveryService.getAll(cookie, searchParams);
        return NextResponse.json(delivery);
    } catch (error: unknown) {
        console.error("API Error:", error);
        return NextResponse.json({ error: (error as Error).message || "Internal Server Error" }, { status: 500 });
    }
}
