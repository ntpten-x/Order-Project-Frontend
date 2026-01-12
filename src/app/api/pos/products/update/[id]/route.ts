import { NextRequest, NextResponse } from "next/server";
import { productsService } from "../../../../../../services/pos/products.service";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";
        const body = await request.json();
        const product = await productsService.update(params.id, body, cookie, csrfToken);
        return NextResponse.json(product);
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
