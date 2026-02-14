import { NextRequest } from "next/server";
import { proxyToBackend } from "../../_utils/proxy-to-backend";
import { getProxyUrl } from "../../../../lib/proxy-utils";

export async function POST(req: NextRequest) {
    const url = getProxyUrl("POST", "/permissions/simulate");
    return proxyToBackend(req, { url: url!, method: "POST", forwardBody: true });
}
