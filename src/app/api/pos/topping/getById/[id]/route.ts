import { NextRequest, NextResponse } from "next/server";
import { toppingService } from "../../../../../../services/pos/topping.service";
import { handleApiRouteError } from "../../../../_utils/route-error";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const topping = await toppingService.findOne(params.id, cookie);
        return NextResponse.json(topping);
    } catch (error) {
        return handleApiRouteError(error);
    }
}
