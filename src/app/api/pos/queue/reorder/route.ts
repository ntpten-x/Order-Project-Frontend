import { NextRequest, NextResponse } from "next/server";
import { PROXY_CONFIGS } from "../../../../../lib/proxy-utils";

export const dynamic = 'force-dynamic';

// POST: Reorder queue
export async function POST(request: NextRequest) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";

        const url = `${PROXY_CONFIGS.API_BASE_URL}/pos/queue/reorder`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                Cookie: cookie,
                "X-CSRF-Token": csrfToken,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return NextResponse.json(
                { error: errorData.error?.message || errorData.message || "Failed to reorder queue" },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("[API Proxy] Queue Reorder Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to reorder queue" },
            { status: 500 }
        );
    }
}
