import { NextRequest, NextResponse } from "next/server";
import { productsService } from "@/services/pos/products.service";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "50");
        const cookie = request.headers.get("cookie") || "";

        // Remove page and limit from searchParams to pass the rest as filters
        const filters = new URLSearchParams(searchParams);
        filters.delete("page");
        filters.delete("limit");

        const data = await productsService.findAll(page, limit, cookie, filters);
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Failed to fetch products" },
            { status: 500 }
        );
    }
}
