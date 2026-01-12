import { NextRequest, NextResponse } from "next/server";
import { productsService } from "../../../../services/pos/products.service";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const searchParams = request.nextUrl.searchParams;
        const products = await productsService.findAll(cookie, searchParams);
        return NextResponse.json(products);
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
