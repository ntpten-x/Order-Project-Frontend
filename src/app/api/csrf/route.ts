
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
            // "set-cookie" header in fetch can be a comma-separated string or null
            // Next.js might need parsing if multiple cookies, but simple forwarding might work for single cookie
            // or use split if multiple.
            // Note: node-fetch or native fetch joins multiple Set-Cookie headers with comma.
            // This can be problematic if cookies have dates with commas.
            // Using a simple header copy for now.
            nextResponse.headers.set("Set-Cookie", setCookieHeader);
        }

        return nextResponse;
    } catch (error) {
        console.error("CSRF Token Error:", error);
        return NextResponse.json({ error: "Failed to fetch CSRF token" }, { status: 500 });
    }
}
