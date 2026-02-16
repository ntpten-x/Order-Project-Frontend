import { NextRequest } from "next/server";
import { proxyToBackend } from "../../../_utils/proxy-to-backend";
import { getProxyUrl } from "../../../../../lib/proxy-utils";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get("shopId");
    const baseUrl = getProxyUrl("GET", "/pos/payment-accounts/accounts");
    const query = new URLSearchParams();
    if (shopId) query.set("shopId", shopId);
    const url = query.toString() ? `${baseUrl}?${query.toString()}` : baseUrl;

    return proxyToBackend(request, { url: url!, method: "GET" });
}

export async function POST(request: NextRequest) {
    const url = getProxyUrl("POST", "/pos/payment-accounts/accounts");
    return proxyToBackend(request, { url: url!, method: "POST", forwardBody: true });
}
