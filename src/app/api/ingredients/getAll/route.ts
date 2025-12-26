import { NextResponse } from "next/server";
import { ingredientsService } from "@/services/ingredients.service";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const ingredients = await ingredientsService.findAll();
        return NextResponse.json(ingredients);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
