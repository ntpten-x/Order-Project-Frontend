import { NextRequest } from "next/server";
import { proxyToBackend } from "../../../../_utils/proxy-to-backend";
import { getProxyUrl } from "../../../../../../lib/proxy-utils";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const url = getProxyUrl("POST", `/permissions/approvals/${params.id}/reject`);
    return proxyToBackend(req, { url: url!, method: "POST", forwardBody: true });
}
