import { NextRequest, NextResponse } from "next/server";
import { handleApiRouteError } from "../../_utils/route-error";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const activeBranchId = request.cookies.get("active_branch_id")?.value || null;
        return NextResponse.json({ active_branch_id: activeBranchId });
    } catch (error) {
        return handleApiRouteError(error);
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const response = NextResponse.json({ active_branch_id: null });
        const forwardedProto = request.headers.get("x-forwarded-proto") || "";
        const isHttps = forwardedProto.toLowerCase() === "https" || request.nextUrl.protocol === "https:";
        response.cookies.set("active_branch_id", "", {
            httpOnly: true,
            secure: isHttps,
            sameSite: (isHttps ? "none" : "lax") as "none" | "lax",
            maxAge: 0,
            path: "/",
        });
        return response;
    } catch (error) {
        return handleApiRouteError(error);
    }
}
