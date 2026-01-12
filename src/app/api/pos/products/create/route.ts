import { NextRequest, NextResponse } from "next/server";
import { productsService } from "../../../../../services/pos/products.service";

export async function POST(request: NextRequest) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";
        const body = await request.json();
        const product = await productsService.create(body, cookie, csrfToken);
        return NextResponse.json(product, { status: 201 });
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
