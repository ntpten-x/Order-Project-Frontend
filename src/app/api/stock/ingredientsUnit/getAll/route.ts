import { NextRequest, NextResponse } from "next/server";
import { ingredientsUnitService } from "../../../../../services/stock/ingredientsUnit.service";
import { handleApiRouteError } from "../../../_utils/route-error";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const searchParams = request.nextUrl.searchParams;
        const ingredientsUnits = await ingredientsUnitService.findAll(cookie, searchParams);
        return NextResponse.json(ingredientsUnits);
    } catch (error) {
        return handleApiRouteError(error);
    }
}
