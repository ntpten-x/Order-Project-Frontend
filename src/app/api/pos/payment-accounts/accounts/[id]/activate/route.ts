import { NextRequest, NextResponse } from "next/server";
import { PROXY_CONFIGS } from "../../../../../../../lib/proxy-utils";
import { handleApiRouteError } from "../../../../../_utils/route-error";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";
        const { id } = params;

        const url = `${PROXY_CONFIGS.API_BASE_URL}/pos/payment-accounts/accounts/${id}/activate`;
        console.log(`[API Proxy] PATCH (Activate) ${url}, Has Token: ${!!csrfToken}`);

        const response = await fetch(url, {
            method: "PATCH",
            headers: {
                Cookie: cookie,
                "X-CSRF-Token": csrfToken,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error(`[API Proxy] PATCH Error Status: ${response.status}, Error:`, errorData);
            return NextResponse.json(errorData, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: unknown) {
        console.error("[API Proxy] Proxy Execution Error (PATCH):", (error as Error).message);
        return handleApiRouteError(error);
    }
}
