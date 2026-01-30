import { NextRequest, NextResponse } from "next/server";
import { PROXY_CONFIGS } from "../../../../../../lib/proxy-utils";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await request.json();
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";
        const { id } = params;

        const url = `${PROXY_CONFIGS.API_BASE_URL}/pos/payment-accounts/accounts/${id}`;
        console.log(`[API Proxy] PUT ${url}, Has Token: ${!!csrfToken}`);

        const response = await fetch(url, {
            method: "PUT",
            headers: {
                Cookie: cookie,
                "X-CSRF-Token": csrfToken,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error(`[API Proxy] PUT Error Status: ${response.status}, Error:`, errorData);
            return NextResponse.json(errorData, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: unknown) {
        console.error("[API Proxy] Proxy Execution Error (PUT):", (error as Error).message);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";
        const { id } = params;

        const url = `${PROXY_CONFIGS.API_BASE_URL}/pos/payment-accounts/accounts/${id}`;
        console.log(`[API Proxy] DELETE ${url}, Has Token: ${!!csrfToken}`);

        const response = await fetch(url, {
            method: "DELETE",
            headers: {
                Cookie: cookie,
                "X-CSRF-Token": csrfToken,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error(`[API Proxy] DELETE Error Status: ${response.status}, Error:`, errorData);
            return NextResponse.json(errorData, { status: response.status });
        }

        return new NextResponse(null, { status: 204 });
    } catch (error: unknown) {
        console.error("[API Proxy] Proxy Execution Error (DELETE):", (error as Error).message);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
