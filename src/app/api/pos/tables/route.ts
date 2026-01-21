import { NextRequest, NextResponse } from "next/server";
import { tablesService } from "@/services/pos/tables.service";

export async function GET(request: NextRequest) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const tables = await tablesService.getAll(cookie);
        return NextResponse.json(tables);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Failed to fetch tables" },
            { status: 500 }
        );
    }
}
// POST: Create a new table
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";

        const newTable = await tablesService.create(body, cookie, csrfToken);
        return NextResponse.json(newTable);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Failed to create table" },
            { status: 500 }
        );
    }
}
