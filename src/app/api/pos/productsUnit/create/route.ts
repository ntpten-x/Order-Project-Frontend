import { NextRequest, NextResponse } from "next/server";
import { productsUnitService } from "../../../../../services/pos/productsUnit.service";

export async function POST(request: NextRequest) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";
        const body = await request.json();
        const productsUnit = await productsUnitService.create(body, cookie, csrfToken);
        return NextResponse.json(productsUnit, { status: 201 });
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
