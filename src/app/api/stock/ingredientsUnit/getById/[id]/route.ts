import { NextResponse } from "next/server";
import { ingredientsUnitService } from "../../../../../../services/stock/ingredientsUnit.service";
import { handleApiRouteError } from "../../../../_utils/route-error";

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const cookie = request.headers.get("cookie") || undefined;
        const ingredientsUnit = await ingredientsUnitService.findOne(params.id, cookie);
        return NextResponse.json(ingredientsUnit);
    } catch (error) {
        return handleApiRouteError(error);
    }
}
