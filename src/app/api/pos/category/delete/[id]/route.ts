import { NextRequest, NextResponse } from "next/server";
import { categoryService } from "../../../../../../services/pos/category.service";

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";
        await categoryService.delete(params.id, cookie, csrfToken);
        return NextResponse.json({ message: "Category deleted successfully" });
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
