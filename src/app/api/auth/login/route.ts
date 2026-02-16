import { NextRequest, NextResponse } from "next/server";
import { API_ROUTES } from "../../../../config/api";
import { getProxyUrl } from "../../../../lib/proxy-utils";
import { throwBackendHttpError, unwrapBackendData } from "../../../../utils/api/backendResponse";
import { handleApiRouteError } from "../../_utils/route-error";
import { User } from "../../../../types/api/auth";
import { isHttpsRequest, normalizeSetCookieForProtocol, splitSetCookieHeader } from "../../_utils/cookie-forward";

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
    try {
        const body = await request.json();
        const csrfToken = request.headers.get("x-csrf-token") || request.headers.get("X-CSRF-Token") || "";
        const cookieHeader = request.headers.get("cookie") || "";

        const backendUrl = getProxyUrl("POST", API_ROUTES.AUTH.LOGIN);
        const backendResponse = await fetch(backendUrl!, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
                ...(cookieHeader ? { Cookie: cookieHeader } : {}),
            },
            credentials: "include",
            body: JSON.stringify(body),
        });

        if (!backendResponse.ok) {
            const errorData = await backendResponse.json().catch(() => ({}));
            throwBackendHttpError(backendResponse, errorData, "Login failed");
        }

        const parsed = unwrapBackendData<{ user: User } | User>(await backendResponse.json());
        const user = parsed && typeof parsed === "object" && "user" in parsed ? parsed.user : parsed;

        const nextResponse = NextResponse.json({ message: "Login successful", user });
        nextResponse.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
        nextResponse.headers.set("Pragma", "no-cache");
        nextResponse.headers.set("Expires", "0");

        appendSetCookieHeaders(backendResponse, nextResponse, isHttpsRequest(request));
        return nextResponse;
    } catch (error: unknown) {
        console.error("Login Route Error:", error);
        return handleApiRouteError(error);
    }
}
