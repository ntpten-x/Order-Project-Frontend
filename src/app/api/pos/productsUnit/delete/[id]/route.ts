import { NextRequest, NextResponse } from "next/server";
import { productsUnitService } from "../../../../../../services/pos/productsUnit.service";
import { handleApiRouteError } from "../../../../_utils/route-error";

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";
        await productsUnitService.delete(params.id, cookie, csrfToken);
        return NextResponse.json({ message: "Products Unit deleted successfully" });
    } catch (error) {
        return handleApiRouteError(error);
    }
}
