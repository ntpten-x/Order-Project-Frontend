import { NextRequest, NextResponse } from "next/server";
import { productsService } from "../../../../../services/pos/products.service";
import { handleApiRouteError } from "../../../_utils/route-error";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const searchParams = request.nextUrl.searchParams;

        // Pass-through supported filters (e.g., category_id).
        const filters = new URLSearchParams(searchParams);
        const response = await productsService.countActive(cookie, filters);

        return NextResponse.json(response);
    } catch (error) {
        return handleApiRouteError(error);
    }
}

