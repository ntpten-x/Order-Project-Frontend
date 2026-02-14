import { NextRequest } from "next/server";
import { proxyToBackend } from "../../../_utils/proxy-to-backend";
import { getProxyUrl } from "../../../../../lib/proxy-utils";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const url = getProxyUrl("PUT", `/permissions/users/${params.id}`);
    return proxyToBackend(req, { url: url!, method: "PUT", forwardBody: true });
}
