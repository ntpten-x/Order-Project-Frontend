import { NextRequest, NextResponse } from "next/server";
import { toppingService } from "../../../../../services/pos/topping.service";
import { handleApiRouteError } from "../../../_utils/route-error";

export async function POST(request: NextRequest) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";
        const body = await request.json();
        const topping = await toppingService.create(body, cookie, csrfToken);
        return NextResponse.json(topping, { status: 201 });
    } catch (error: unknown) {
        console.error("Error creating topping:", error);
        return handleApiRouteError(error);
    }
}
