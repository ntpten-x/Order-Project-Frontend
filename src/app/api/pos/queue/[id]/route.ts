import { NextRequest, NextResponse } from "next/server";
import { PROXY_CONFIGS } from "../../../../../lib/proxy-utils";

export const dynamic = 'force-dynamic';

// DELETE: Remove order from queue
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";

        const url = `${PROXY_CONFIGS.API_BASE_URL}/pos/queue/${params.id}`;

        const response = await fetch(url, {
            method: "DELETE",
            headers: {
                Cookie: cookie,
                "X-CSRF-Token": csrfToken,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return NextResponse.json(
                { error: errorData.error?.message || errorData.message || "Failed to remove from queue" },
                { status: response.status }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[API Proxy] Queue DELETE Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to remove from queue" },
            { status: 500 }
        );
    }
}
