import { NextRequest, NextResponse } from "next/server";
import { productsUnitService } from "../../../../services/pos/productsUnit.service";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const searchParams = request.nextUrl.searchParams;
        const productsUnits = await productsUnitService.findAll(cookie, searchParams);
        return NextResponse.json(productsUnits);
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
