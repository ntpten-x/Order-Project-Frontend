import { NextRequest, NextResponse } from "next/server";
import { ingredientsService } from "../../../../services/stock/ingredients.service";
import { handleApiRouteError } from "../../_utils/route-error";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const searchParams = request.nextUrl.searchParams;
        const hasPaging = searchParams.has("page") || searchParams.has("limit");
        const ingredients = hasPaging
            ? await ingredientsService.findAllPaginated(cookie, searchParams)
            : await ingredientsService.findAll(cookie, searchParams);
        return NextResponse.json(ingredients);
    } catch (error) {
        return handleApiRouteError(error);
    }
}
