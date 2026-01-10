import { NextRequest, NextResponse } from "next/server";
import { ingredientsService } from "../../../../../services/ingredients.service";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await request.json();
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";
        const updatedItem = await ingredientsService.update(params.id, body, cookie, csrfToken);
        return NextResponse.json(updatedItem);
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
