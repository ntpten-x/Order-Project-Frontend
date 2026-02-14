import { NextRequest } from "next/server";
import { proxyToBackend } from "../../../../_utils/proxy-to-backend";
import { getProxyUrl } from "../../../../../../lib/proxy-utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const url = getProxyUrl("GET", `/permissions/roles/${params.id}/effective`);
    return proxyToBackend(req, { url: url!, method: "GET" });
}
