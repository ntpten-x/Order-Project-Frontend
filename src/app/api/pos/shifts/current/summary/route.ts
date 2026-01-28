import { NextRequest, NextResponse } from "next/server";
import { getProxyUrl } from "@/lib/proxy-utils";

export async function GET(request: NextRequest) {
    try {
        const url = getProxyUrl("GET", "/pos/shifts/current/summary");
        const cookie = request.headers.get("cookie");

        const response = await fetch(url!, {
            headers: {
                Cookie: cookie || "",
                "Content-Type": "application/json"
            },
            cache: "no-store",
        });

        if (!response.ok) {
            return NextResponse.json({ error: "Failed to fetch shift summary" }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
