import { NextRequest, NextResponse } from "next/server";
import { tablesService } from "../../../../services/pos/tables.service";
import { handleApiRouteError } from "../../_utils/route-error";

export async function GET(request: NextRequest) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const searchParams = new URLSearchParams(request.nextUrl.searchParams);
        const tables = await tablesService.getAll(cookie, searchParams);
        return NextResponse.json(tables);
    } catch (error) {
        return handleApiRouteError(error);
    }
}
// POST: Create a new table
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";

        const newTable = await tablesService.create(body, cookie, csrfToken);
        return NextResponse.json(newTable);
    } catch (error) {
        return handleApiRouteError(error);
    }
}
