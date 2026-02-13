import { salesOrderDetailService } from "../../../../../../services/pos/salesOrderDetail.service";
import { NextRequest, NextResponse } from "next/server";
import { handleApiRouteError } from "../../../../_utils/route-error";

export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";
        const { id } = params;
        await salesOrderDetailService.delete(id, cookie, csrfToken);
        return NextResponse.json({ message: "SalesOrderDetail deleted successfully" });
    } catch (error: unknown) {
        console.error("API Error:", error);
        return handleApiRouteError(error);
    }
}