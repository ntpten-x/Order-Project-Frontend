import { NextRequest, NextResponse } from "next/server";
import { toppingService } from "../../../../services/pos/topping.service";
import { handleApiRouteError } from "../../_utils/route-error";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const searchParams = request.nextUrl.searchParams;
        const hasPaging = searchParams.has("page") || searchParams.has("limit");
        const toppings = hasPaging
            ? await toppingService.findAllPaginated(cookie, searchParams)
            : await toppingService.findAll(cookie, searchParams);
        return NextResponse.json(toppings);
    } catch (error) {
        return handleApiRouteError(error);
    }
}
