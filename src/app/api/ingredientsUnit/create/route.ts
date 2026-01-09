import { NextResponse } from "next/server";
import { ingredientsUnitService } from "../../../../services/ingredientsUnit.service";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const cookie = request.headers.get("cookie") || undefined;
        const newIngredientsUnit = await ingredientsUnitService.create(body, cookie);
        return NextResponse.json(newIngredientsUnit, { status: 201 });
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
