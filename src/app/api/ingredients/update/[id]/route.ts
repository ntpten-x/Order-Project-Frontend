import { NextResponse } from "next/server";
import { ingredientsService } from "../../../../../services/ingredients.service";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const body = await request.json();
        const updatedIngredient = await ingredientsService.update(params.id, body);
        return NextResponse.json(updatedIngredient);
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
