import { NextRequest } from "next/server";
import { PROXY_CONFIGS } from "../../../../../../lib/proxy-utils";
import { proxyToBackend } from "../../../../_utils/proxy-to-backend";

export const dynamic = 'force-dynamic';

// PATCH: Update queue status
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const id = encodeURIComponent(params.id);
    const url = `${PROXY_CONFIGS.API_BASE_URL}/pos/queue/${id}/status`;
    return proxyToBackend(request, { url, method: "PATCH", forwardBody: true });
}
