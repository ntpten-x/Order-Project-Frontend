import { NextRequest, NextResponse } from "next/server";
import { toppingGroupService } from "../../../../services/pos/toppingGroup.service";
import { handleApiRouteError } from "../../_utils/route-error";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const cookie = request.headers.get("cookie") || "";
        const hasPaging = searchParams.has("page") || searchParams.has("limit");

        const data = hasPaging
            ? await toppingGroupService.findAllPaginated(cookie, searchParams)
            : await toppingGroupService.findAll(cookie, searchParams);
        return NextResponse.json(data);
    } catch (error) {
        return handleApiRouteError(error);
    }
}
