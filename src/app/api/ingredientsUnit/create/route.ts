import { NextResponse } from "next/server";
import { ingredientsUnitService } from "@/services/ingredientsUnit.service";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const newIngredientsUnit = await ingredientsUnitService.create(body);
        return NextResponse.json(newIngredientsUnit, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
