import { discountsService } from "../../../../services/pos/discounts.service";
import { NextRequest, NextResponse } from "next/server";
import { handleApiRouteError } from "../../_utils/route-error";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const searchParams = request.nextUrl.searchParams;
        const filters = new URLSearchParams(searchParams);
        const hasPaging = searchParams.has("page") || searchParams.has("limit");
        const discounts = hasPaging
            ? await discountsService.getAllPaginated(cookie, filters)
            : await discountsService.getAll(cookie, filters);
        return NextResponse.json(discounts);
    } catch (error: unknown) {
        console.error("API Error:", error);
        return handleApiRouteError(error);
    }
}
