import { NextRequest, NextResponse } from "next/server";
import { productsUnitService } from "../../../../../../services/pos/productsUnit.service";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { name: string } }) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const productsUnit = await productsUnitService.findOneByName(params.name, cookie);
        return NextResponse.json(productsUnit);
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
