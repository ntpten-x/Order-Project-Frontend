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

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";
        const newIngredient = await ingredientsService.create(body, cookie, csrfToken);
        return NextResponse.json(newIngredient, { status: 201 });
    } catch (error) {
        return handleApiRouteError(error);
    }
}
