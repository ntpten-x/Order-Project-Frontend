import { NextRequest, NextResponse } from "next/server";
import { getProxyUrl } from "../../../../../lib/proxy-utils";
import { handleApiRouteError } from "../../../_utils/route-error";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const startAt = searchParams.get("startAt");
        const endAt = searchParams.get("endAt");

        const query = new URLSearchParams();
        if (startDate) query.set("startDate", startDate);
        if (endDate) query.set("endDate", endDate);
        if (startAt) query.set("startAt", startAt);
        if (endAt) query.set("endAt", endAt);

        const endpoint = `/pos/dashboard/sales${query.toString() ? `?${query.toString()}` : ""}`;
        const url = getProxyUrl("GET", endpoint);
        const cookie = request.headers.get("cookie");

        const response = await fetch(url!, {
            headers: {
                Cookie: cookie || "",
                "Content-Type": "application/json"
            },
            cache: "no-store",
        });

        if (!response.ok) {
            return NextResponse.json({ error: "Failed to fetch sales summary" }, { status: response.status });
        }

        const data = await response.json();
        const nextResponse = NextResponse.json(data);
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
