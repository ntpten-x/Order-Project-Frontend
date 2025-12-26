import { NextResponse } from "next/server";
import { ingredientsUnitService } from "@/services/ingredientsUnit.service";

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        await ingredientsUnitService.delete(params.id);
        return NextResponse.json({ message: "IngredientsUnit deleted successfully" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
