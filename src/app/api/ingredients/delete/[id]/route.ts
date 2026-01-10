import { NextRequest, NextResponse } from "next/server";
import { ingredientsService } from "../../../../../services/ingredients.service";

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";
        await ingredientsService.delete(params.id, cookie, csrfToken);
        return NextResponse.json({ success: true, message: "Ingredient deleted successfully" }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
