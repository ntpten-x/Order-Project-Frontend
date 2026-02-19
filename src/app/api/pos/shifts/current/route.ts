import { NextRequest, NextResponse } from "next/server";
import { getProxyUrl } from "../../../../../lib/proxy-utils";
import { unwrapBackendData } from "../../../../../utils/api/backendResponse";
import { handleApiRouteError } from "../../../_utils/route-error";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const url = getProxyUrl("GET", "/pos/shifts/current");
        const cookie = request.headers.get("cookie");

        const response = await fetch(url!, {
            headers: {
                Cookie: cookie || "",
                "Content-Type": "application/json"
            },
            cache: "no-store",
        });

        if (response.status === 404) {
            return NextResponse.json(null, { status: 404 });
        }

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
            return NextResponse.json(payload, { status: response.status });
        }

        const currentShift = unwrapBackendData(payload as unknown);
        if (currentShift === null) {
            return NextResponse.json(null, { status: 404 });
        }

        return NextResponse.json(payload);
    } catch (error) {
        console.error("Proxy Error:", error);
        return handleApiRouteError(error);
    }
}
