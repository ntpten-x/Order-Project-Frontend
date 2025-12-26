import { NextResponse } from "next/server";
import { ingredientsUnitService } from "@/services/ingredientsUnit.service";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const ingredientsUnits = await ingredientsUnitService.findAll();
        return NextResponse.json(ingredientsUnits);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
