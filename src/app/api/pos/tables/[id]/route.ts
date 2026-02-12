import { NextRequest, NextResponse } from "next/server";
import { tablesService } from "../../../../../services/pos/tables.service";
import { handleApiRouteError } from "../../../_utils/route-error";

interface Params {
    params: {
        id: string;
    };
}

// GET: Get single table
export async function GET(request: NextRequest, { params }: Params) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const table = await tablesService.getById(params.id, cookie);
        return NextResponse.json(table);
    } catch (error) {
        return handleApiRouteError(error);
    }
}

// PUT: Update table
export async function PUT(request: NextRequest, { params }: Params) {
    try {
        const body = await request.json();
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";

        const updatedTable = await tablesService.update(params.id, body, cookie, csrfToken);
        return NextResponse.json(updatedTable);
    } catch (error) {
        return handleApiRouteError(error);
    }
}

// DELETE: Delete table
export async function DELETE(request: NextRequest, { params }: Params) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";

        await tablesService.delete(params.id, cookie, csrfToken);
        return NextResponse.json({ success: true });
    } catch (error) {
        return handleApiRouteError(error);
    }
}