import { NextRequest, NextResponse } from "next/server";
import { API_ROUTES } from "../../../../config/api";
import { getProxyUrl } from "../../../../lib/proxy-utils";
import { buildForwardedHostProtoHeaders, isHttpsRequest, normalizeSetCookieForProtocol, splitSetCookieHeader } from "../../_utils/cookie-forward";

function appendSetCookieHeaders(response: Response, nextResponse: NextResponse, isHttps: boolean) {
    const setCookieHeader = response.headers.get("set-cookie");
    if (!setCookieHeader) return;

    const cookieEntries = splitSetCookieHeader(setCookieHeader)
        .map((entry) => normalizeSetCookieForProtocol(entry, isHttps));

    for (const cookie of cookieEntries) {
        nextResponse.headers.append("Set-Cookie", cookie);
    }
}

export async function POST(request: NextRequest) {
    const csrfToken = request.headers.get("X-CSRF-Token") || "";
    const cookieHeader = request.headers.get("cookie") || "";
    const forwardedHeaders = buildForwardedHostProtoHeaders(request);
    const backendUrl = getProxyUrl("POST", API_ROUTES.AUTH.LOGOUT);

    const backendResponse = await fetch(backendUrl!, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
            ...(cookieHeader ? { Cookie: cookieHeader } : {}),
            ...forwardedHeaders,
        },
        credentials: "include",
    }).catch(() => null);

    const nextResponse = NextResponse.json({ message: "Logged out successfully" });
    nextResponse.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    nextResponse.headers.set("Pragma", "no-cache");
    nextResponse.headers.set("Expires", "0");

    const backendSetCookie = backendResponse?.headers.get("set-cookie") || "";
    if (backendResponse) {
        appendSetCookieHeaders(backendResponse, nextResponse, isHttpsRequest(request));
    }

    // Fallback clear only when backend did not return Set-Cookie headers.
    if (!backendSetCookie) {
        nextResponse.cookies.delete("token");
        nextResponse.cookies.delete("active_branch_id");
    }

    return nextResponse;
}
