import { NextRequest, NextResponse } from "next/server";
import { toppingGroupService } from "../../../../../../services/pos/toppingGroup.service";
import { handleApiRouteError } from "../../../../_utils/route-error";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";
        const body = await request.json();
        const toppingGroup = await toppingGroupService.update(params.id, body, cookie, csrfToken);
        return NextResponse.json(toppingGroup);
    } catch (error) {
        return handleApiRouteError(error);
    }
}
