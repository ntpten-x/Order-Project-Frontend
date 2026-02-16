import { NextRequest } from "next/server";
import { proxyToBackend } from "../../../../_utils/proxy-to-backend";
import { getProxyUrl } from "../../../../../../lib/proxy-utils";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    const id = encodeURIComponent(params.id);
    const url = getProxyUrl("PUT", `/pos/payment-accounts/accounts/${id}`);
    return proxyToBackend(request, { url: url!, method: "PUT", forwardBody: true });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    const id = encodeURIComponent(params.id);
    const url = getProxyUrl("DELETE", `/pos/payment-accounts/accounts/${id}`);
    return proxyToBackend(request, { url: url!, method: "DELETE" });
}
