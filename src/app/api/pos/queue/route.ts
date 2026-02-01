import { NextRequest, NextResponse } from "next/server";
import { PROXY_CONFIGS } from "../../../../lib/proxy-utils";

export const dynamic = 'force-dynamic';

// GET: Fetch all queue items
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const status = searchParams.get("status");
        const cookie = request.headers.get("cookie") || "";

        let url = `${PROXY_CONFIGS.API_BASE_URL}/pos/queue`;
        if (status) url += `?status=${status}`;

        const response = await fetch(url, {
            headers: {
                Cookie: cookie,
                "Content-Type": "application/json"
            },
            cache: "no-store"
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return NextResponse.json(
                { error: errorData.error?.message || errorData.message || "Failed to fetch queue" },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("[API Proxy] Queue GET Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to fetch queue" },
            { status: 500 }
        );
    }
}

// POST: Add order to queue
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";

        const url = `${PROXY_CONFIGS.API_BASE_URL}/pos/queue`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                Cookie: cookie,
                "X-CSRF-Token": csrfToken,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return NextResponse.json(
                { error: errorData.error?.message || errorData.message || "Failed to add to queue" },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("[API Proxy] Queue POST Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to add to queue" },
            { status: 500 }
        );
    }
}
