import { NextRequest, NextResponse } from "next/server";

import { getProxyUrl } from "../../../../../../lib/proxy-utils";
import { handleApiRouteError } from "../../../../_utils/route-error";

export const dynamic = "force-dynamic";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } },
) {
    try {
        const url = getProxyUrl("GET", `/pos/dashboard/orders/${params.id}`);
        const cookie = request.headers.get("cookie");

        const response = await fetch(url!, {
            headers: {
                Cookie: cookie || "",
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
            return NextResponse.json(payload, { status: response.status });
        }

        const nextResponse = NextResponse.json(payload);
        const cacheControl = response.headers.get("cache-control");
        const vary = response.headers.get("vary");
        if (cacheControl) {
            nextResponse.headers.set("Cache-Control", cacheControl);
        }
        if (vary) {
            nextResponse.headers.set("Vary", vary);
        }
        return nextResponse;
    } catch (error) {
        return handleApiRouteError(error);
    }
}
