import { NextRequest, NextResponse } from "next/server";
import { auditService } from "../../../../../services/audit.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const cookie = req.headers.get("cookie") || "";
        const data = await auditService.getLogById(params.id, cookie);
        return NextResponse.json(data);
    } catch (error) {
        console.error("[API] audit/logs/:id GET error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to fetch audit log" },
            { status: 500 }
        );
    }
}
