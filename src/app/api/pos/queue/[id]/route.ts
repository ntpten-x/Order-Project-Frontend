import { NextRequest } from "next/server";
import { PROXY_CONFIGS } from "../../../../../lib/proxy-utils";
import { proxyToBackend } from "../../../_utils/proxy-to-backend";

export const dynamic = 'force-dynamic';

// DELETE: Remove order from queue
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const id = encodeURIComponent(params.id);
    const url = `${PROXY_CONFIGS.API_BASE_URL}/pos/queue/${id}`;
    return proxyToBackend(request, { url, method: "DELETE" });
}
