import { NextRequest, NextResponse } from "next/server";
import { stockCategoryService } from "../../../../../../services/stock/category.service";
import { handleApiRouteError } from "../../../../_utils/route-error";

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";
        await stockCategoryService.delete(params.id, cookie, csrfToken);
        return NextResponse.json({ success: true, message: "Stock category deleted successfully" });
    } catch (error) {
        return handleApiRouteError(error);
    }
}
