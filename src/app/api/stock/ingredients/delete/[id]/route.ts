import { NextRequest, NextResponse } from "next/server";
import { ingredientsService } from "../../../../../../services/stock/ingredients.service";
import { handleApiRouteError } from "../../../../_utils/route-error";

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";
        await ingredientsService.delete(params.id, cookie, csrfToken);
        return NextResponse.json({ success: true, message: "Ingredient deleted successfully" }, { status: 200 });
    } catch (error: unknown) {
        return handleApiRouteError(error);
    }
}