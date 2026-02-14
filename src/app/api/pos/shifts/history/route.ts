import { handleApiRouteError } from "../../../_utils/route-error";
import { NextRequest, NextResponse } from "next/server";
import { getProxyUrl } from "../../../../../lib/proxy-utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const cookie = request.headers.get("cookie");
        const searchParams = new URLSearchParams(request.nextUrl.searchParams);
        const query = searchParams.toString();
        const url = getProxyUrl("GET", `/pos/shifts/history${query ? `?${query}` : ""}`);

        const response = await fetch(url!, {
            headers: {
                Cookie: cookie || "",
                "Content-Type": "application/json"
            },
            cache: "no-store",
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
            return NextResponse.json(payload, { status: response.status });
        }

        return NextResponse.json(payload);
    } catch (error) {
        console.error("Proxy Error:", error);
        return handleApiRouteError(error);
    }
}
