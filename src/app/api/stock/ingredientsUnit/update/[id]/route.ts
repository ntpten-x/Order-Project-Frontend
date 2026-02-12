import { NextResponse } from "next/server";
import { ingredientsUnitService } from "../../../../../../services/stock/ingredientsUnit.service";
import { handleApiRouteError } from "../../../../_utils/route-error";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const body = await request.json();
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";
        const updatedItem = await ingredientsUnitService.update(params.id, body, cookie, csrfToken);
        return NextResponse.json(updatedItem);
    } catch (error) {
        return handleApiRouteError(error);
    }
}
