import { NextRequest, NextResponse } from "next/server";
import { tablesService } from "../../../../../../services/pos/tables.service";
import { handleApiRouteError } from "../../../../_utils/route-error";

interface Params {
    params: {
        id: string;
    };
}

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: Params) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const qrInfo = await tablesService.getQrToken(params.id, cookie);
        return NextResponse.json(qrInfo);
    } catch (error) {
        return handleApiRouteError(error);
    }
}
