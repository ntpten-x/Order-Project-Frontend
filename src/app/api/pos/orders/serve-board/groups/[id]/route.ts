import { NextRequest, NextResponse } from "next/server";
import { servingBoardService } from "../../../../../../../services/pos/servingBoard.service";
import { handleApiRouteError } from "../../../../../_utils/route-error";

type RouteContext = {
    params: { id: string };
};

export async function PATCH(request: NextRequest, { params }: RouteContext) {
    try {
        const body = await request.json();
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";
        await servingBoardService.updateGroupStatus(params.id, body.serving_status, cookie, csrfToken);
        return NextResponse.json({ success: true });
    } catch (error) {
        return handleApiRouteError(error);
    }
}
