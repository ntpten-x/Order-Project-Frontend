import { handleApiRouteError } from "../_utils/route-error";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";


export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Server-side: call backend directly
        // Backend default port is 4000, but check env variable
        const backendUrl = process.env.BACKEND_API_INTERNAL || process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:4000";
        const url = `${backendUrl}/csrf-token`;
        const cookieStore = cookies();
        const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join(';');

        const response = await fetch(url, {
            method: "GET",
            headers: {
                Cookie: cookieHeader,
                "Content-Type": "application/json"
            },
            credentials: "include"
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("CSRF token fetch failed:", response.status, errorText);
            const fetchError = new Error(`CSRF token fetch failed with status ${response.status}`);
            // Retry once if first attempt fails
            try {
                const retryResponse = await fetch(url, {
                    method: "GET",
                    headers: {
                        Cookie: cookieHeader,
                        "Content-Type": "application/json"
                    },
                    credentials: "include"
                });
                if (retryResponse.ok) {
                    const retryData = await retryResponse.json();
                    return NextResponse.json(retryData);
                }
            } catch (retryError) {
                console.error("CSRF token retry failed:", retryError);
            }
            // If retry also fails, return error (don't return empty token)
            return handleApiRouteError(fetchError);
        }

        const data = await response.json();

        // Handle different response formats
        let csrfToken = '';
        if (data.success && data.csrfToken) {
            csrfToken = data.csrfToken;
        } else if (data.csrfToken) {
            csrfToken = data.csrfToken;
        } else if (data.error) {
            // Backend returned error - log and throw
            const errorMsg = data.error.message || 'Failed to fetch CSRF token';
            console.error('CSRF token error from backend:', data.error);
            throw new Error(errorMsg);
        } else {
            // Unexpected format
            console.warn('Unexpected CSRF token response format:', data);
            throw new Error('Unexpected response format from CSRF endpoint');
        }

        if (!csrfToken) {
            throw new Error('CSRF token is empty');
        }

        const nextResponse = NextResponse.json({ csrfToken });

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
        // Don't return empty token - return error to force proper handling
        return handleApiRouteError(error);
    }
}
