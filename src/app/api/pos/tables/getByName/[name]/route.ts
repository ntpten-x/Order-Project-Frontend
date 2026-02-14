import { tablesService } from "../../../../../../services/pos/tables.service";
import { NextRequest, NextResponse } from "next/server";
import { handleApiRouteError } from "../../../../_utils/route-error";
import { BackendHttpError } from "../../../../../../utils/api/backendResponse";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { name: string } }) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const { name } = params;
        const table = await tablesService.getByName(name, cookie);
        return NextResponse.json(table);
    } catch (error: unknown) {
        if (error instanceof BackendHttpError && error.status === 404) {
            return NextResponse.json(null);
        }
        return handleApiRouteError(error);
    }
}
