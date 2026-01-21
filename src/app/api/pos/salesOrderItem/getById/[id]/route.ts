import { salesOrderItemService } from "../../../../../../services/pos/salesOrderItem.service";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const { id } = params;
        const item = await salesOrderItemService.getById(id, cookie);
        return NextResponse.json(item);
    } catch (error: unknown) {
        console.error("API Error:", error);
        return NextResponse.json({ error: (error as Error).message || "Internal Server Error" }, { status: 500 });
    }
}
