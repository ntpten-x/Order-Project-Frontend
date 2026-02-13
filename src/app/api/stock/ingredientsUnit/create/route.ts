import { NextResponse } from "next/server";
import { ingredientsUnitService } from "../../../../../services/stock/ingredientsUnit.service";
import { handleApiRouteError } from "../../../_utils/route-error";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";
        const newItem = await ingredientsUnitService.create(body, cookie, csrfToken);
        return NextResponse.json(newItem, { status: 201 });
    } catch (error) {
        return handleApiRouteError(error);
    }
}
