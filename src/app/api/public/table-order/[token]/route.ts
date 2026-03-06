import { NextRequest } from "next/server";
import { handleApiRouteError } from "../../../_utils/route-error";
import { proxyPublicJsonRequest } from "../../_utils/proxy";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, context: { params: { token: string } }) {
    try {
        const token = encodeURIComponent(context.params.token);
        return await proxyPublicJsonRequest({
            method: "GET",
            backendPath: `/public/table-order/${token}`,
        });
    } catch (error) {
        return handleApiRouteError(error);
    }
}
