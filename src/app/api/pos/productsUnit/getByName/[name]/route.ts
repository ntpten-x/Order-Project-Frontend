import { NextRequest, NextResponse } from "next/server";
import { productsUnitService } from "../../../../../../services/pos/productsUnit.service";
import { handleApiRouteError } from "../../../../_utils/route-error";
import { BackendHttpError } from "../../../../../../utils/api/backendResponse";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { name: string } }) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const productsUnit = await productsUnitService.findOneByName(params.name, cookie);
        return NextResponse.json(productsUnit);
    } catch (error) {
        if (error instanceof BackendHttpError && error.status === 404) {
            return NextResponse.json(null);
        }
        return handleApiRouteError(error);
    }
}
