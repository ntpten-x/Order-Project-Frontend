import { NextRequest, NextResponse } from "next/server";
import { getProxyUrl } from "../../../../../../lib/proxy-utils";
import { handleApiRouteError } from "../../../../_utils/route-error";

export const dynamic = "force-dynamic";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const url = getProxyUrl("GET", `/pos/shifts/summary/${id}`);
        const cookie = request.headers.get("cookie");

        const response = await fetch(url!, {
            headers: {
                Cookie: cookie || "",
                "Content-Type": "application/json"
            },
            cache: "no-store",
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
            return NextResponse.json(payload, { status: response.status });
        }

        return NextResponse.json(payload);
    } catch (error) {
        return handleApiRouteError(error);
    }
}
