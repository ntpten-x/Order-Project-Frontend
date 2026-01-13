import { NextRequest, NextResponse } from "next/server";
import { productsService } from "../../../../services/pos/products.service";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "50");

        const products = await productsService.findAll(page, limit, cookie, searchParams);
        return NextResponse.json(products);
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
