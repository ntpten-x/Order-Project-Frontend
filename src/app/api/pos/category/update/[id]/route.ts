import { NextRequest, NextResponse } from "next/server";
import { categoryService } from "../../../../../../services/pos/category.service";
import { handleApiRouteError } from "../../../../_utils/route-error";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";
        const body = await request.json();
        const category = await categoryService.update(params.id, body, cookie, csrfToken);
        return NextResponse.json(category);
    } catch (error) {
        return handleApiRouteError(error);
    }
}
