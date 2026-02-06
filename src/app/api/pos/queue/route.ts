import { NextRequest } from "next/server";
import { PROXY_CONFIGS } from "../../../../lib/proxy-utils";
import { proxyToBackend } from "../../_utils/proxy-to-backend";

export const dynamic = 'force-dynamic';

// GET: Fetch all queue items
export async function GET(request: NextRequest) {
    const status = request.nextUrl.searchParams.get("status");

    const url = new URL(`${PROXY_CONFIGS.API_BASE_URL}/pos/queue`);
    if (status) url.searchParams.set("status", status);

    return proxyToBackend(request, { url: url.toString(), method: "GET" });
}

// POST: Add order to queue
export async function POST(request: NextRequest) {
    const url = `${PROXY_CONFIGS.API_BASE_URL}/pos/queue`;
    return proxyToBackend(request, { url, method: "POST", forwardBody: true });
}
