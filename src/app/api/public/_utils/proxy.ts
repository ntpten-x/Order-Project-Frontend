import { NextResponse } from "next/server";
import { getProxyUrl } from "../../../../lib/proxy-utils";

export async function proxyPublicJsonRequest(options: {
    method: "GET" | "POST";
    backendPath: string;
    body?: unknown;
}): Promise<NextResponse> {
    const { method, backendPath, body } = options;

    const url = getProxyUrl(method, backendPath);
    const headers: Record<string, string> = {
        Accept: "application/json",
    };

    if (method !== "GET") {
        headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url!, {
        method,
        headers,
        cache: "no-store",
        ...(method !== "GET" ? { body: JSON.stringify(body ?? {}) } : {}),
    });

    const contentType = response.headers.get("content-type") || "application/json";
    const payload = await response.text();

    return new NextResponse(payload || "{}", {
        status: response.status,
        headers: {
            "Content-Type": contentType,
        },
    });
}
