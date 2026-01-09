import { NextRequest, NextResponse } from "next/server";
import { ingredientsService } from "../../../../services/ingredients.service";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const cookie = request.headers.get("cookie") || "";
        const newIngredient = await ingredientsService.create(body, cookie);
        return NextResponse.json(newIngredient, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
