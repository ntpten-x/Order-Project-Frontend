import { NextRequest, NextResponse } from "next/server";
import { tablesService } from "../../../../../services/pos/tables.service";
import { handleApiRouteError } from "../../../_utils/route-error";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const searchParams = new URLSearchParams(request.nextUrl.searchParams);
        const tables = await tablesService.getAllQrCodes(cookie, searchParams);
        return NextResponse.json(tables);
    } catch (error) {
        return handleApiRouteError(error);
    }
}
