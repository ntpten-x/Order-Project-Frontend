import { NextRequest, NextResponse } from "next/server";
import { toppingService } from "../../../../../../services/pos/topping.service";
import { handleApiRouteError } from "../../../../_utils/route-error";

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";
        await toppingService.delete(params.id, cookie, csrfToken);
        return NextResponse.json({ message: "Topping deleted successfully" });
    } catch (error) {
        return handleApiRouteError(error);
    }
}
