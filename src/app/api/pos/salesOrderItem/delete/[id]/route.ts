import { salesOrderItemService } from "../../../../../../services/pos/salesOrderItem.service";
import { NextRequest, NextResponse } from "next/server";
import { handleApiRouteError } from "../../../../_utils/route-error";

export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";
        const { id } = params;
        await salesOrderItemService.delete(id, cookie, csrfToken);
        return NextResponse.json({ message: "SalesOrderItem deleted successfully" });
    } catch (error: unknown) {
        console.error("API Error:", error);
        return handleApiRouteError(error);
    }
}