import { posHistoryService } from "../../../../../../services/pos/posHistory.service";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const id = params.id;
        const csrfToken = request.headers.get("X-CSRF-Token") || undefined;

        await posHistoryService.delete(id, cookie, csrfToken);
        return NextResponse.json({ message: "History deleted successfully" });
    } catch (error: unknown) {
        console.error("API Error:", error);
        return NextResponse.json({ error: (error as Error).message || "Internal Server Error" }, { status: 500 });
    }
}
