import { NextRequest, NextResponse } from "next/server";
import { productsService } from "../../../../../../services/pos/products.service";
import { handleApiRouteError } from "../../../../_utils/route-error";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { name: string } }) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const product = await productsService.findOneByName(params.name, cookie);
        return NextResponse.json(product);
    } catch (error) {
        return handleApiRouteError(error);
    }
}
