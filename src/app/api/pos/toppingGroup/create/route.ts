import { NextRequest, NextResponse } from "next/server";
import { toppingGroupService } from "../../../../../services/pos/toppingGroup.service";
import { handleApiRouteError } from "../../../_utils/route-error";

export async function POST(request: NextRequest) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";
        const body = await request.json();
        const toppingGroup = await toppingGroupService.create(body, cookie, csrfToken);
        return NextResponse.json(toppingGroup, { status: 201 });
    } catch (error) {
        return handleApiRouteError(error);
    }
}
