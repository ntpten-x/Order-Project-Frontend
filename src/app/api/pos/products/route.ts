import { NextRequest, NextResponse } from "next/server";
import { productsService } from "../../../../services/pos/products.service";

export const dynamic = 'force-dynamic';

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

        const response = await productsService.findAll(page, limit, cookie, filters);

        // Transform backend response format to match frontend schema
        // Backend returns: { success: true, data: [...], meta: { page, limit, total, totalPages } }
        // Frontend expects: { data: [...], total, page, last_page }
        if (response && typeof response === 'object' && 'data' in response) {
            // Already in correct format (from schema validation)
            return NextResponse.json(response);
        }

        // Fallback: if response is in backend format, transform it
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const backendResponse = response as any;
        if (backendResponse.success && backendResponse.data && backendResponse.meta) {
            return NextResponse.json({
                data: backendResponse.data,
                total: backendResponse.meta.total || 0,
                page: backendResponse.meta.page || page,
                last_page: backendResponse.meta.totalPages || Math.ceil((backendResponse.meta.total || 0) / limit)
            });
        }

        return NextResponse.json(response);
    } catch (error) {
        console.error('[API] Products fetch error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to fetch products" },
            { status: 500 }
        );
    }
}
