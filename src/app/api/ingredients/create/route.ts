import { NextResponse } from "next/server";
import { ingredientsService } from "@/services/ingredients.service";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const newIngredient = await ingredientsService.create(body);
        return NextResponse.json(newIngredient, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
