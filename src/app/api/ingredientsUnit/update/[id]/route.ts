import { NextResponse } from "next/server";
import { ingredientsUnitService } from "../../../../../services/ingredientsUnit.service";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const body = await request.json();
        const cookie = request.headers.get("cookie") || undefined;
        const updatedIngredientsUnit = await ingredientsUnitService.update(params.id, body, cookie);
        return NextResponse.json(updatedIngredientsUnit);
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
