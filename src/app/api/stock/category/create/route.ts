import { NextRequest, NextResponse } from "next/server";
import { stockCategoryService } from "../../../../../services/stock/category.service";
import { handleApiRouteError } from "../../../_utils/route-error";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";
        const category = await stockCategoryService.create(body, cookie, csrfToken);
        return NextResponse.json(category, { status: 201 });
    } catch (error) {
        return handleApiRouteError(error);
    }
}
