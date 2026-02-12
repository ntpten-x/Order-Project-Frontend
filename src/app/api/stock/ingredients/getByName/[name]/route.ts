import { NextResponse } from "next/server";
import { ingredientsService } from "../../../../../../services/stock/ingredients.service";
import { handleApiRouteError } from "../../../../_utils/route-error";

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { name: string } }) {
    try {
        const ingredient = await ingredientsService.findOneByName(params.name);
        return NextResponse.json(ingredient);
    } catch (error) {
        return handleApiRouteError(error);
    }
}
