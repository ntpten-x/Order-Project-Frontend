import { posHistoryService } from "../../../../../services/pos/posHistory.service";
import { NextRequest, NextResponse } from "next/server";
import { authService } from "../../../../../services/auth.service";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const body = await request.json();

        // CSRF handling via authService if needed, or rely on service to pass token?
        // Service expects csrfToken in args. We can fetch it or just pass undefined if backend handles cookie mainly.
        // Usually, for server-side proxy, we might need to get token. But here we are simply proxying.
        // Let's assume client sends proper cookie.

        // Wait, frontend service usually needs CSRF token for mutations.
        // The pattern in `orders/create/route.ts` (if checked) would show.
        // I'll skip explicit CSRF fetch here and rely on what's passed or cookie.
        // Actually, explicit fetching is better if needed.
        // But `ordersService` fetch logic gets CSRF token from argument.
        // Here, we are in Next.js API. 
        // Let's keep it simple: call service. 
        // Note: service.create expects (data, cookie, csrfToken). 
        // We can get csrf token from header "X-CSRF-Token".
        const csrfToken = request.headers.get("X-CSRF-Token") || undefined;

        const result = await posHistoryService.create(body, cookie, csrfToken);
        return NextResponse.json(result, { status: 201 });
    } catch (error: unknown) {
        console.error("API Error:", error);
        return NextResponse.json({ error: (error as Error).message || "Internal Server Error" }, { status: 500 });
    }
}
