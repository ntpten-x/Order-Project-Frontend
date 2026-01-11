import { NextResponse } from "next/server";
import { ingredientsUnitService } from "../../../../../../services/stock/ingredientsUnit.service";

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";
        await ingredientsUnitService.delete(params.id, cookie, csrfToken);
        return NextResponse.json({ success: true, message: "IngredientsUnit deleted successfully" }, { status: 200 });
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
