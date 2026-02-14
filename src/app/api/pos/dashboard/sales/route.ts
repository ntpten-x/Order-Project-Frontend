import { NextRequest, NextResponse } from "next/server";
import { getProxyUrl } from "../../../../../lib/proxy-utils";
import { handleApiRouteError } from "../../../_utils/route-error";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        const endpoint = `/pos/dashboard/sales${startDate && endDate ? `?startDate=${startDate}&endDate=${endDate}` : ''}`;
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
        return NextResponse.json(data);
    } catch (error) {
        return handleApiRouteError(error);
    }
}
