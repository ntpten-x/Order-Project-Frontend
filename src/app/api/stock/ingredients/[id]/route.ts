import { NextRequest, NextResponse } from "next/server";
import { ingredientsService } from "../../../../../services/stock/ingredients.service";
import { handleApiRouteError } from "../../../_utils/route-error";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const ingredient = await ingredientsService.findOne(params.id, cookie);
        return NextResponse.json(ingredient);
    } catch (error: unknown) {
        return handleApiRouteError(error);
    }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await request.json();
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";
        const updatedItem = await ingredientsService.update(params.id, body, cookie, csrfToken);
        return NextResponse.json(updatedItem);
    } catch (error: unknown) {
        return handleApiRouteError(error);
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";
        await ingredientsService.delete(params.id, cookie, csrfToken);
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return handleApiRouteError(error);
    }
}
