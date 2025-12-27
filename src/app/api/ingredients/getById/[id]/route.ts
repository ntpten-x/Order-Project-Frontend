import { NextResponse } from "next/server";
import { ingredientsService } from "@/services/ingredients.service";

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const ingredient = await ingredientsService.findOne(params.id);
        return NextResponse.json(ingredient);
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
