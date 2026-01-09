import { NextResponse } from "next/server";
import { ingredientsUnitService } from "../../../../../services/ingredientsUnit.service";

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const cookie = request.headers.get("cookie") || undefined;
        const ingredientsUnit = await ingredientsUnitService.findOne(params.id, cookie);
        return NextResponse.json(ingredientsUnit);
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
