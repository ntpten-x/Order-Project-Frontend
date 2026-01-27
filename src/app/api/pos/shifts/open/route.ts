import { NextRequest, NextResponse } from "next/server";
import { getProxyUrl } from "../../../../../lib/proxy-utils";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const url = getProxyUrl("POST", "/pos/shifts/open");
        const cookie = request.headers.get("cookie");
        const csrfToken = request.headers.get("x-csrf-token");

        const response = await fetch(url!, {
            method: "POST",
            headers: {
                Cookie: cookie || "",
                "Content-Type": "application/json",
                ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {})
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            return NextResponse.json(error, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
