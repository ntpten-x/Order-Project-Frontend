import { NextRequest } from "next/server";
import { handleApiRouteError } from "../../../../_utils/route-error";
import { proxyPublicJsonRequest } from "../../../_utils/proxy";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, context: { params: { token: string } }) {
    try {
        const token = encodeURIComponent(context.params.token);
        return await proxyPublicJsonRequest({
            method: "GET",
            backendPath: `/public/table-order/${token}/order`,
        });
    } catch (error) {
        return handleApiRouteError(error);
    }
}

export async function POST(request: NextRequest, context: { params: { token: string } }) {
    try {
        const token = encodeURIComponent(context.params.token);
        const body = await request.json();
        return await proxyPublicJsonRequest({
            method: "POST",
            backendPath: `/public/table-order/${token}/order`,
            body,
        });
    } catch (error) {
        return handleApiRouteError(error);
    }
}
