import { NextRequest, NextResponse } from "next/server";
import { categoryService } from "../../../../services/pos/category.service";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const searchParams = request.nextUrl.searchParams;
        const categories = await categoryService.findAll(cookie, searchParams);
        return NextResponse.json(categories);
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
