import { tablesService } from "../../../../../../services/pos/tables.service";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { name: string } }) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const { name } = params;
        // Check if service has getByName method properly implemented
        // In previous step I added it to the service.
        const table = await tablesService.getByName(name, cookie);
        return NextResponse.json(table);
    } catch (error: unknown) {
        console.error("API Error:", error);
        return NextResponse.json({ error: (error as Error).message || "Internal Server Error" }, { status: 500 });
    }
}
