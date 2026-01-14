import { posHistoryService } from "../../../../../../services/pos/posHistory.service";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const id = params.id;
        const body = await request.json();
        const csrfToken = request.headers.get("X-CSRF-Token") || undefined;

        const result = await posHistoryService.update(id, body, cookie, csrfToken);
        return NextResponse.json(result);
    } catch (error: unknown) {
        console.error("API Error:", error);
        return NextResponse.json({ error: (error as Error).message || "Internal Server Error" }, { status: 500 });
    }
}
