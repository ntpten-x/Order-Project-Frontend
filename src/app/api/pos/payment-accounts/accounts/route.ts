import { NextRequest } from "next/server";
import { proxyToBackend } from "../../../_utils/proxy-to-backend";
import { getProxyUrl } from "../../../../../lib/proxy-utils";

export async function GET(request: NextRequest) {
    const baseUrl = getProxyUrl("GET", "/pos/payment-accounts/accounts");
    const search = request.nextUrl.search;
    const url = search ? `${baseUrl}${search}` : baseUrl;

    return proxyToBackend(request, { url: url!, method: "GET" });
}

export async function POST(request: NextRequest) {
    const url = getProxyUrl("POST", "/pos/payment-accounts/accounts");
    return proxyToBackend(request, { url: url!, method: "POST", forwardBody: true });
}
