import { NextRequest, NextResponse } from "next/server";
import { productsUnitService } from "../../../../../services/pos/productsUnit.service";

export async function POST(request: NextRequest) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";
        const body = await request.json();
        const productsUnit = await productsUnitService.create(body, cookie, csrfToken);
        return NextResponse.json(productsUnit, { status: 201 });
    } catch (error: unknown) {
        console.error("Error creating productsUnit:", error);
        const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

