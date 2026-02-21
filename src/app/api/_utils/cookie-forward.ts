import { NextRequest } from "next/server";

export const splitSetCookieHeader = (setCookieHeader: string): string[] => {
    const cookies: string[] = [];
    let current = "";
    let inExpires = false;

    for (let i = 0; i < setCookieHeader.length; i++) {
        const char = setCookieHeader[i];
        const lowerSlice = setCookieHeader.slice(i, i + 8).toLowerCase();
        if (!inExpires && lowerSlice === "expires=") {
            inExpires = true;
        }

        if (char === "," && !inExpires) {
            const cookie = current.trim();
            if (cookie) cookies.push(cookie);
            current = "";
            continue;
        }

        current += char;

        if (inExpires && char === ";") {
            inExpires = false;
        }
    }

    const trailing = current.trim();
    if (trailing) cookies.push(trailing);

    return cookies;
};

export const isHttpsRequest = (request: NextRequest): boolean => {
    const forwardedProto = (request.headers.get("x-forwarded-proto") || "")
        .split(",")[0]
        .trim()
        .toLowerCase();
    return forwardedProto === "https" || request.nextUrl.protocol === "https:";
};

export const buildForwardedHostProtoHeaders = (request: NextRequest): Record<string, string> => {
    const forwardedHost = (request.headers.get("x-forwarded-host") || request.headers.get("host") || "")
        .split(",")[0]
        .trim();
    const forwardedProto = (request.headers.get("x-forwarded-proto") || request.nextUrl.protocol.replace(":", ""))
        .split(",")[0]
        .trim()
        .toLowerCase();

    const headers: Record<string, string> = {};
    if (forwardedHost) {
        headers["X-Forwarded-Host"] = forwardedHost;
    }
    if (forwardedProto) {
        headers["X-Forwarded-Proto"] = forwardedProto;
    }
    return headers;
};

export const normalizeSetCookieForProtocol = (cookie: string, isHttps: boolean): string => {
    if (isHttps) return cookie;

    // Browsers reject SameSite=None without Secure on HTTP deployments.
    return cookie
        .replace(/;\s*Secure/gi, "")
        .replace(/;\s*SameSite=None/gi, "; SameSite=Lax");
};
