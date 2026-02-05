import { NextRequest, NextResponse } from "next/server";
import { getProxyUrl } from "../../../../../lib/proxy-utils";

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

        if (!response.ok) {
            return NextResponse.json({ error: "Failed to fetch current shift" }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Proxy Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
