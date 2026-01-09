import { NextResponse } from "next/server";
import { ingredientsUnitService } from "../../../../../services/ingredientsUnit.service";

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const cookie = request.headers.get("cookie") || undefined;
        await ingredientsUnitService.delete(params.id, cookie);
        return NextResponse.json({ message: "IngredientsUnit deleted successfully" }, { status: 200 });
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
