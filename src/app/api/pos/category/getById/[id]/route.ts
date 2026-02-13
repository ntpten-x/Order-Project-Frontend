import { NextRequest, NextResponse } from "next/server";
import { categoryService } from "../../../../../../services/pos/category.service";
import { handleApiRouteError } from "../../../../_utils/route-error";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const category = await categoryService.findOne(params.id, cookie);
        return NextResponse.json(category);
    } catch (error) {
        return handleApiRouteError(error);
    }
}
