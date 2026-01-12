import { NextRequest, NextResponse } from "next/server";
import { productsUnitService } from "../../../../../../services/pos/productsUnit.service";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";
        const body = await request.json();
        const productsUnit = await productsUnitService.update(params.id, body, cookie, csrfToken);
        return NextResponse.json(productsUnit);
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
