import { NextRequest, NextResponse } from "next/server";
import { stockCategoryService } from "../../../../services/stock/category.service";
import { handleApiRouteError } from "../../_utils/route-error";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const searchParams = request.nextUrl.searchParams;
        const hasPaging = searchParams.has("page") || searchParams.has("limit");
        const categories = hasPaging
            ? await stockCategoryService.findAllPaginated(cookie, searchParams)
            : await stockCategoryService.findAll(cookie, searchParams);
        return NextResponse.json(categories);
    } catch (error) {
        return handleApiRouteError(error);
    }
}
