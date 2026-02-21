import { NextRequest, NextResponse } from "next/server";

type ProxyToBackendOptions = {
    url: string;
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    forwardBody?: boolean;
};

function shouldForwardClientIp(): boolean {
    const configured = (process.env.TRUST_PROXY_CHAIN || "").trim().toLowerCase();
    return configured !== "" && configured !== "0" && configured !== "false";
}

function sanitizeForwardedFor(raw: string): string | null {
    const maxIps = 8;
    const ipToken = /^[A-Fa-f0-9:.]+$/;
    const safe = raw
        .split(",")
        .map((part) => part.trim())
        .filter((part) => part.length > 0 && ipToken.test(part))
        .slice(0, maxIps);

    return safe.length > 0 ? safe.join(", ") : null;
}

function extractErrorMessage(payload: unknown, fallback: string): string {
    if (!payload) return fallback;
    if (typeof payload === "string") return payload;

    if (typeof payload !== "object") return fallback;

    const record = payload as Record<string, unknown>;
    const error = record.error;

    if (typeof error === "string") return error;
    if (error && typeof error === "object") {
        const errorRecord = error as Record<string, unknown>;
        if (typeof errorRecord.message === "string") return errorRecord.message;
    }

    if (typeof record.message === "string") return record.message;
    return fallback;
}

export async function proxyToBackend(request: NextRequest, options: ProxyToBackendOptions) {
    const headers: Record<string, string> = {
        Accept: "application/json",
    };

    const cookie = request.headers.get("cookie");
    if (cookie) headers.Cookie = cookie;

    const csrfToken = request.headers.get("X-CSRF-Token");
    if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

    if (shouldForwardClientIp()) {
        const forwardedFor = request.headers.get("x-forwarded-for");
        const sanitizedForwardedFor = forwardedFor ? sanitizeForwardedFor(forwardedFor) : null;
        if (sanitizedForwardedFor) {
            headers["X-Forwarded-For"] = sanitizedForwardedFor;
        } else {
            const resolvedIp = (request as NextRequest & { ip?: string }).ip;
            if (typeof resolvedIp === "string" && resolvedIp.trim().length > 0) {
                headers["X-Forwarded-For"] = resolvedIp.trim();
            }
        }
    }

    const userAgent = request.headers.get("user-agent");
    if (userAgent) headers["User-Agent"] = userAgent;

    const forwardedHost = (request.headers.get("x-forwarded-host") || request.headers.get("host") || "")
        .split(",")[0]
        .trim();
    if (forwardedHost) {
        headers["X-Forwarded-Host"] = forwardedHost;
    }

    const forwardedProto = (request.headers.get("x-forwarded-proto") || request.nextUrl.protocol.replace(":", ""))
        .split(",")[0]
        .trim()
        .toLowerCase();
    if (forwardedProto) {
        headers["X-Forwarded-Proto"] = forwardedProto;
    }

    let body: string | undefined;
    if (options.forwardBody) {
        try {
            body = JSON.stringify(await request.json());
            headers["Content-Type"] = "application/json";
        } catch {
            return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
        }
    }

    try {
        const response = await fetch(options.url, {
            method: options.method,
            headers,
            body,
            cache: "no-store",
            signal: request.signal,
        });

        if (response.status === 204) {
            return new NextResponse(null, { status: 204 });
        }

        const contentType = response.headers.get("content-type") ?? "";
        const payload = contentType.includes("application/json")
            ? await response.json().catch(() => null)
            : await response.text().catch(() => "");

        if (!response.ok) {
            const fallback = `Request failed (${response.status})`;
            return NextResponse.json(
                { error: extractErrorMessage(payload, fallback) },
                { status: response.status }
            );
        }

        if (typeof payload === "string") {
            return NextResponse.json({ data: payload }, { status: response.status });
        }

        return NextResponse.json(payload ?? {}, { status: response.status });
    } catch (error) {
        console.error("[API Proxy] Backend proxy error:", {
            method: options.method,
            url: options.url,
            error,
        });

        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Backend proxy failed" },
            { status: 500 }
        );
    }
}
