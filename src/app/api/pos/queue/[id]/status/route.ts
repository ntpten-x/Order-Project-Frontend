import { NextRequest, NextResponse } from "next/server";
import { PROXY_CONFIGS } from "../../../../../../lib/proxy-utils";

export const dynamic = 'force-dynamic';

// PATCH: Update queue status
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";

        const url = `${PROXY_CONFIGS.API_BASE_URL}/pos/queue/${params.id}/status`;

        const response = await fetch(url, {
            method: "PATCH",
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
                { error: errorData.error?.message || errorData.message || "Failed to update queue status" },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("[API Proxy] Queue PATCH Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to update queue status" },
            { status: 500 }
        );
    }
}
