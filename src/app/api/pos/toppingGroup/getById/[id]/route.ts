import { NextRequest, NextResponse } from "next/server";
import { toppingGroupService } from "../../../../../../services/pos/toppingGroup.service";
import { handleApiRouteError } from "../../../../_utils/route-error";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const toppingGroup = await toppingGroupService.findOne(params.id, cookie);
        return NextResponse.json(toppingGroup);
    } catch (error) {
        return handleApiRouteError(error);
    }
}
