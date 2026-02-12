import { NextRequest, NextResponse } from "next/server";
import { ingredientsService } from "../../../../../services/stock/ingredients.service";
import { handleApiRouteError } from "../../../_utils/route-error";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";
        const newIngredient = await ingredientsService.create(body, cookie, csrfToken);
        return NextResponse.json(newIngredient, { status: 201 });
    } catch (error: unknown) {
        return handleApiRouteError(error);
    }
}
