import { NextResponse } from "next/server";
import { ingredientsUnitService } from "../../../../../../services/stock/ingredientsUnit.service";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const body = await request.json();
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";
        const updatedItem = await ingredientsUnitService.update(params.id, body, cookie, csrfToken);
        return NextResponse.json(updatedItem);
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
