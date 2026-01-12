import { NextRequest, NextResponse } from "next/server";
import { productsService } from "../../../../../../services/pos/products.service";

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";
        await productsService.delete(params.id, cookie, csrfToken);
        return NextResponse.json({ message: "Product deleted successfully" });
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
