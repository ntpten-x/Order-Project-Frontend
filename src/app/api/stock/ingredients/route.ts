import { NextRequest, NextResponse } from "next/server";
import { ingredientsService } from "../../../../services/stock/ingredients.service";
import { handleApiRouteError } from "../../_utils/route-error";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const searchParams = request.nextUrl.searchParams;
        const ingredients = await ingredientsService.findAll(cookie, searchParams);
        return NextResponse.json(ingredients);
    } catch (error) {
        return handleApiRouteError(error);
    }
}
