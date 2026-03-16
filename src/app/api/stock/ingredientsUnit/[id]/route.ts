import { NextRequest, NextResponse } from "next/server";
import { ingredientsUnitService } from "../../../../../services/stock/ingredientsUnit.service";
import { handleApiRouteError } from "../../../_utils/route-error";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const ingredientsUnit = await ingredientsUnitService.findOne(params.id, cookie);
        return NextResponse.json(ingredientsUnit);
    } catch (error) {
        return handleApiRouteError(error);
    }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await request.json();
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";
        const updatedItem = await ingredientsUnitService.update(params.id, body, cookie, csrfToken);
        return NextResponse.json(updatedItem);
    } catch (error) {
        return handleApiRouteError(error);
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";
        await ingredientsUnitService.delete(params.id, cookie, csrfToken);
        return NextResponse.json({ success: true });
    } catch (error) {
        return handleApiRouteError(error);
    }
}
