import { NextRequest, NextResponse } from "next/server";
import { stockCategoryService } from "../../../../../../services/stock/category.service";
import { handleApiRouteError } from "../../../../_utils/route-error";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await request.json();
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";
        const updated = await stockCategoryService.update(params.id, body, cookie, csrfToken);
        return NextResponse.json(updated);
    } catch (error) {
        return handleApiRouteError(error);
    }
}
