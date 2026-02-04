import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/services/auth.service";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}));
        const cookieHeader = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("x-csrf-token") || request.headers.get("X-CSRF-Token") || "";

        const branchId = typeof body?.branch_id === "string" ? body.branch_id : body?.branch_id ?? null;
        const result = await authService.switchBranch(branchId, csrfToken, cookieHeader);

        const nextResponse = NextResponse.json(result);

        if (result.active_branch_id) {
            nextResponse.cookies.set("active_branch_id", result.active_branch_id, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
                maxAge: 60 * 60 * 24 * 30, // 30 days
                path: "/",
            });
        } else {
            nextResponse.cookies.delete("active_branch_id");
        }

        return nextResponse;
    } catch (error: unknown) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to switch branch" },
            { status: 500 }
        );
    }
}
