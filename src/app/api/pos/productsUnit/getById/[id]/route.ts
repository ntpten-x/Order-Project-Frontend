import { NextRequest, NextResponse } from "next/server";
import { productsUnitService } from "../../../../../../services/pos/productsUnit.service";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const productsUnit = await productsUnitService.findOne(params.id, cookie);
        return NextResponse.json(productsUnit);
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
