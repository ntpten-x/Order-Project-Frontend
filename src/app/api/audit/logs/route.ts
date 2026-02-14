import { NextRequest, NextResponse } from "next/server";
import { auditService } from "../../../../services/audit.service";
import { handleApiRouteError } from "../../_utils/route-error";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const cookie = req.headers.get("cookie") || "";
        const searchParams = req.nextUrl.searchParams;
        const data = await auditService.getLogs(cookie, searchParams);
        return NextResponse.json(data);
    } catch (error) {
        console.error("[API] audit/logs GET error:", error);
        return handleApiRouteError(error);
    }
}
