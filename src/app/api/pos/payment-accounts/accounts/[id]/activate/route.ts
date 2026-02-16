import { NextRequest } from "next/server";
import { proxyToBackend } from "../../../../../_utils/proxy-to-backend";
import { getProxyUrl } from "../../../../../../../lib/proxy-utils";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    const id = encodeURIComponent(params.id);
    const url = getProxyUrl("PATCH", `/pos/payment-accounts/accounts/${id}/activate`);
    return proxyToBackend(request, { url: url!, method: "PATCH" });
}
