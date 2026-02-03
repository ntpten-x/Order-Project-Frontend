import { discountsService } from "../../../../services/pos/discounts.service";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const searchParams = request.nextUrl.searchParams;
        const filters = new URLSearchParams(searchParams);
        const discounts = await discountsService.getAll(cookie, filters);

        // Ensure discounts is always an array
        // Backend may return { success: true, data: [...] } or array directly
        let discountsArray = discounts;
        if (!Array.isArray(discounts)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const discountsObj = discounts as any;
            if (discountsObj && typeof discountsObj === 'object') {
                // Handle { success: true, data: [...] } format
                if (discountsObj.success && Array.isArray(discountsObj.data)) {
                    discountsArray = discountsObj.data;
                }
                // Handle { data: [...] } format
                else if (Array.isArray(discountsObj.data)) {
                    discountsArray = discountsObj.data;
                }
                // Handle single object (shouldn't happen but handle it)
                else if (discountsObj.id && (discountsObj.discount_name || discountsObj.display_name)) {
                    console.log('[API] Received single discount object, converting to array:', discountsObj);
                    discountsArray = [discountsObj];
                }
                else {
                    console.warn('[API] Unexpected discounts format:', discountsObj);
                    discountsArray = [];
                }
            } else {
                discountsArray = [];
            }
        }

        return NextResponse.json(discountsArray);
    } catch (error: unknown) {
        console.error("API Error:", error);
        return NextResponse.json({ error: (error as Error).message || "Internal Server Error" }, { status: 500 });
    }
}
