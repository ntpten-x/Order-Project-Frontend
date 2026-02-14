import { NextRequest, NextResponse } from "next/server";
import { categoryService } from "../../../../../services/pos/category.service";
import { handleApiRouteError } from "../../../_utils/route-error";

export async function POST(request: NextRequest) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";
        const body = await request.json();
        const category = await categoryService.create(body, cookie, csrfToken);
        return NextResponse.json(category, { status: 201 });
    } catch (error) {
        return handleApiRouteError(error);
    }
}
