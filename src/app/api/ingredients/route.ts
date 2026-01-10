import { NextRequest, NextResponse } from "next/server";
import { ingredientsService } from "../../../services/ingredients.service";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const ingredients = await ingredientsService.findAll(cookie);
        return NextResponse.json(ingredients);
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
