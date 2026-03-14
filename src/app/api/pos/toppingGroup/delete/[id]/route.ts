import { NextRequest, NextResponse } from "next/server";
import { toppingGroupService } from "../../../../../../services/pos/toppingGroup.service";
import { handleApiRouteError } from "../../../../_utils/route-error";

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";
        await toppingGroupService.delete(params.id, cookie, csrfToken);
        return NextResponse.json({ success: true });
    } catch (error) {
        return handleApiRouteError(error);
    }
}
