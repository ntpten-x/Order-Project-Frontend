import { NextRequest, NextResponse } from "next/server";
import { authService } from "../../../../services/auth.service";
import { handleApiRouteError } from "../../_utils/route-error";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}));
        const cookieHeader = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("x-csrf-token") || request.headers.get("X-CSRF-Token") || "";

        const branchId = typeof body?.branch_id === "string" ? body.branch_id : body?.branch_id ?? null;
        const result = await authService.switchBranch(branchId, csrfToken, cookieHeader);

        const nextResponse = NextResponse.json(result);

        // Cookie security: only set `Secure` + `SameSite=None` when we're actually on HTTPS.
        // Setting `Secure` on an HTTP site causes browsers to ignore the cookie, which makes
        // branch switching appear to "not work" on EC2 IP deployments (http://...).
        const forwardedProto = request.headers.get("x-forwarded-proto") || "";
        const isHttps = forwardedProto.toLowerCase() === "https" || request.nextUrl.protocol === "https:";
        const cookieOptions = {
            httpOnly: true,
            secure: isHttps,
            sameSite: (isHttps ? "none" : "lax") as "none" | "lax",
            maxAge: 60 * 60 * 24 * 30, // 30 days (seconds)
            path: "/",
        };

        if (result.active_branch_id) {
            nextResponse.cookies.set("active_branch_id", result.active_branch_id, cookieOptions);
        } else {
            // Use a set-with-expiry to clear for the current protocol's cookie attributes.
            nextResponse.cookies.set("active_branch_id", "", { ...cookieOptions, maxAge: 0 });
        }

        return nextResponse;
    } catch (error: unknown) {
        return handleApiRouteError(error);
    }
}
