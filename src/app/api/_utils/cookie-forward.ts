import { NextRequest } from "next/server";

export const splitSetCookieHeader = (setCookieHeader: string): string[] =>
    setCookieHeader
        .split(/,(?=\s*[^=]+=)/)
        .map((entry) => entry.trim())
        .filter(Boolean);

export const isHttpsRequest = (request: NextRequest): boolean => {
    const forwardedProto = (request.headers.get("x-forwarded-proto") || "")
        .split(",")[0]
        .trim()
        .toLowerCase();
    return forwardedProto === "https" || request.nextUrl.protocol === "https:";
};

export const normalizeSetCookieForProtocol = (cookie: string, isHttps: boolean): string => {
    if (isHttps) return cookie;

    // Browsers reject SameSite=None without Secure on HTTP deployments.
    return cookie
        .replace(/;\s*Secure/gi, "")
        .replace(/;\s*SameSite=None/gi, "; SameSite=Lax");
};
