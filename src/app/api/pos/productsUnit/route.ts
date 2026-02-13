import { NextRequest, NextResponse } from "next/server";
import { productsUnitService } from "../../../../services/pos/productsUnit.service";
import { handleApiRouteError } from "../../_utils/route-error";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const searchParams = request.nextUrl.searchParams;
        const productsUnits = await productsUnitService.findAll(cookie, searchParams);
        return NextResponse.json(productsUnits);
    } catch (error) {
        return handleApiRouteError(error);
    }
}
