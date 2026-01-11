import { NextRequest, NextResponse } from "next/server";
import { ingredientsService } from "../../../../../../services/stock/ingredients.service";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const ingredient = await ingredientsService.findOne(params.id, cookie);
        return NextResponse.json(ingredient);
    } catch (error: unknown) {
        return NextResponse.json({ error: (error instanceof Error ? error.message : "Internal Server Error") }, { status: 500 });
    }
}
