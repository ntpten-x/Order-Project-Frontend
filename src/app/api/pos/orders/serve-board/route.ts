import { NextRequest, NextResponse } from "next/server";
import { servingBoardService } from "../../../../../services/pos/servingBoard.service";
import { handleApiRouteError } from "../../../_utils/route-error";

export async function GET(request: NextRequest) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const data = await servingBoardService.getBoard(cookie);
        return NextResponse.json(data);
    } catch (error) {
        return handleApiRouteError(error);
    }
}
