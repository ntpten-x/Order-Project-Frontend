import { NextRequest, NextResponse } from "next/server";
import { toppingService } from "../../../../../../services/pos/topping.service";
import { handleApiRouteError } from "../../../../_utils/route-error";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";
        const body = await request.json();
        const topping = await toppingService.update(params.id, body, cookie, csrfToken);
        return NextResponse.json(topping);
    } catch (error) {
        return handleApiRouteError(error);
    }
}
