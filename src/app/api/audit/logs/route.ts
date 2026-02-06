import { NextRequest, NextResponse } from "next/server";
import { auditService } from "../../../../services/audit.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const cookie = req.headers.get("cookie") || "";
        const searchParams = req.nextUrl.searchParams;
        const data = await auditService.getLogs(cookie, searchParams);
        return NextResponse.json(data);
    } catch (error) {
        console.error("[API] audit/logs GET error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to fetch audit logs" },
            { status: 500 }
        );
    }
}
