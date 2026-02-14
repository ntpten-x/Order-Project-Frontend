import { NextRequest, NextResponse } from "next/server";
import { getProxyUrl } from "../../../../../lib/proxy-utils";
import { handleApiRouteError } from "../../../_utils/route-error";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const topLimit = searchParams.get("topLimit") || "7";
        const recentLimit = searchParams.get("recentLimit") || "8";

        const query = new URLSearchParams();
        if (startDate) query.set("startDate", startDate);
        if (endDate) query.set("endDate", endDate);
        query.set("topLimit", topLimit);
        query.set("recentLimit", recentLimit);

        const url = getProxyUrl("GET", `/pos/dashboard/overview?${query.toString()}`);
        const cookie = request.headers.get("cookie");

        const response = await fetch(url!, {
            headers: {
                Cookie: cookie || "",
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        if (!response.ok) {
            return NextResponse.json({ error: "Failed to fetch dashboard overview" }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        return handleApiRouteError(error);
    }
}

