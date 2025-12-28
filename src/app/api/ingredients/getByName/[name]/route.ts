import { NextResponse } from "next/server";
import { ingredientsService } from "../../../../../services/ingredients.service";

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { name: string } }) {
    try {
        const ingredient = await ingredientsService.findOneByName(params.name);
        return NextResponse.json(ingredient);
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
