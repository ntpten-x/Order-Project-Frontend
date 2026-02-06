import { NextRequest } from "next/server";
import { PROXY_CONFIGS } from "../../../../../lib/proxy-utils";
import { proxyToBackend } from "../../../_utils/proxy-to-backend";

export const dynamic = 'force-dynamic';

// POST: Reorder queue
export async function POST(request: NextRequest) {
    const url = `${PROXY_CONFIGS.API_BASE_URL}/pos/queue/reorder`;
    return proxyToBackend(request, { url, method: "POST" });
}
