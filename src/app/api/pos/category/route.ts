import { NextRequest, NextResponse } from "next/server";
import { categoryService } from "../../../../services/pos/category.service";
import { handleApiRouteError } from "../../_utils/route-error";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const cookie = request.headers.get("cookie") || "";

        const data = await categoryService.findAll(cookie, searchParams);
        return NextResponse.json(data);
    } catch (error) {
        return handleApiRouteError(error);
    }
}
