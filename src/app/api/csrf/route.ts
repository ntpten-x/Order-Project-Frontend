
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getProxyUrl } from "../../../lib/proxy-utils";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const url = getProxyUrl("GET", "/csrf-token");
        const cookieStore = cookies();
        const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join(';');

        const response = await fetch(url!, {
            headers: {
                Cookie: cookieHeader
            }
        });

        if (!response.ok) {
            throw new Error("Failed to fetch CSRF token");
        }

        const data = await response.json();
        const nextResponse = NextResponse.json(data);

        // Forward Set-Cookie headers from Backend to Client
        const setCookieHeader = response.headers.get("set-cookie");
        if (setCookieHeader) {
            // Split on commas that precede a new cookie name (avoids splitting Expires=Wed, 21 Oct ...).
            const cookieEntries = setCookieHeader
                .split(/,(?=\s*[^=]+=)/)
                .map(entry => entry.trim())
                .filter(Boolean);
            cookieEntries.forEach(cookie => nextResponse.headers.append("Set-Cookie", cookie));
        }

        return nextResponse;
    } catch (error) {
        console.error("CSRF Token Error:", error);
        return NextResponse.json({ error: "Failed to fetch CSRF token" }, { status: 500 });
    }
}
