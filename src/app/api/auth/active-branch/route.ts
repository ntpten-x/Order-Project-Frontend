import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const activeBranchId = request.cookies.get("active_branch_id")?.value || null;
    return NextResponse.json({ active_branch_id: activeBranchId });
}

