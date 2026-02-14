import { NextRequest, NextResponse } from "next/server";
import { productsService } from "../../../../../../services/pos/products.service";
import { handleApiRouteError } from "../../../../_utils/route-error";

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";
        await productsService.delete(params.id, cookie, csrfToken);
        return NextResponse.json({ message: "Product deleted successfully" });
    } catch (error) {
        return handleApiRouteError(error);
    }
}
