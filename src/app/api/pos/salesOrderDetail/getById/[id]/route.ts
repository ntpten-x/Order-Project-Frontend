import { salesOrderDetailService } from "../../../../../../services/pos/salesOrderDetail.service";
import { NextRequest, NextResponse } from "next/server";
import { handleApiRouteError } from "../../../../_utils/route-error";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const { id } = params;
        const detail = await salesOrderDetailService.getById(id, cookie);
        return NextResponse.json(detail);
    } catch (error: unknown) {
        console.error("API Error:", error);
        return handleApiRouteError(error);
    }
}
