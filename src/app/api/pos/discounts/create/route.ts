import { discountsService } from "../../../../../services/pos/discounts.service";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";
        const discount = await discountsService.create(body, cookie, csrfToken);
        return NextResponse.json(discount);
    } catch (error: unknown) {
        console.error("API Error:", error);
        return NextResponse.json({ error: (error as Error).message || "Internal Server Error" }, { status: 500 });
    }
}
