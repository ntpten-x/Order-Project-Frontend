import { NextRequest, NextResponse } from "next/server";

type ProxyToBackendOptions = {
    url: string;
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    forwardBody?: boolean;
};

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

    const forwardedFor = request.headers.get("x-forwarded-for");
    if (forwardedFor) headers["X-Forwarded-For"] = forwardedFor;

    const userAgent = request.headers.get("user-agent");
    if (userAgent) headers["User-Agent"] = userAgent;

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
