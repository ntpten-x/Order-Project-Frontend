import { NextResponse } from "next/server";
import { ingredientsService } from "@/services/ingredients.service";

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        await ingredientsService.delete(params.id);
        return NextResponse.json({ message: "Ingredient deleted successfully" }, { status: 204 });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
