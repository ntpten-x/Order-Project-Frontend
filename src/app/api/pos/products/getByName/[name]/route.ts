import { NextRequest, NextResponse } from "next/server";
import { productsService } from "../../../../../../services/pos/products.service";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { name: string } }) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const product = await productsService.findOneByName(params.name, cookie);
        return NextResponse.json(product);
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
