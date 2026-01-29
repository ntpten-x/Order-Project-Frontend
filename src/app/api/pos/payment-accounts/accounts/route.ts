import { NextRequest, NextResponse } from "next/server";
import { PROXY_CONFIGS } from "../../../../../lib/proxy-utils";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const shopId = searchParams.get("shopId");
        const cookie = request.headers.get("cookie") || "";

        let url = `${PROXY_CONFIGS.API_BASE_URL}/pos/payment-accounts/accounts`;
        if (shopId) url += `?shopId=${shopId}`;

        console.log(`[API Proxy] GET ${url}`);

        const response = await fetch(url, {
            headers: {
                Cookie: cookie,
                "Content-Type": "application/json"
            },
            cache: "no-store"
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[API Proxy] Backend Error Status: ${response.status}, Body: ${errorText}`);
            return NextResponse.json({ error: "Backend error" }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("[API Proxy] Proxy Execution Error (GET):", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";

        const url = `${PROXY_CONFIGS.API_BASE_URL}/pos/payment-accounts/accounts`;
        console.log(`[API Proxy] POST ${url}, Has Token: ${!!csrfToken}`);

        const response = await fetch(url, {
            method: "POST",
            headers: {
                Cookie: cookie,
                "X-CSRF-Token": csrfToken,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error(`[API Proxy] POST Error Status: ${response.status}, Error:`, errorData);
            return NextResponse.json(errorData, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("[API Proxy] Proxy Execution Error (POST):", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
