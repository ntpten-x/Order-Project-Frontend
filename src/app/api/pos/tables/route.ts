import { tablesService } from "../../../../services/pos/tables.service";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const tables = await tablesService.getAll(cookie);
        return NextResponse.json(tables);
    } catch (error: unknown) {
        console.error("API Error:", error);
        return NextResponse.json({ error: (error as Error).message || "Internal Server Error" }, { status: 500 });
    }
}
