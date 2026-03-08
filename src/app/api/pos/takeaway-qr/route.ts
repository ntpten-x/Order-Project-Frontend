import { NextRequest, NextResponse } from "next/server";
import { takeawayQrService } from "../../../../services/pos/takeawayQr.service";
import { handleApiRouteError } from "../../_utils/route-error";

export async function GET(request: NextRequest) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const payload = await takeawayQrService.getInfo(cookie);
        return NextResponse.json(payload);
    } catch (error) {
        return handleApiRouteError(error);
    }
}
