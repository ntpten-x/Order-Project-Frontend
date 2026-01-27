import { paymentsService } from "../../../../../services/pos/payments.service";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const cookie = request.headers.get("cookie") || "";
        const payment = await paymentsService.getById(id, cookie);
        return NextResponse.json(payment);
    } catch (error: unknown) {
        console.error("API Error (GET ID):", error);
        return NextResponse.json({ error: (error as Error).message || "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const body = await request.json();
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";
        const payment = await paymentsService.update(id, body, cookie, csrfToken);
        return NextResponse.json(payment);
    } catch (error: unknown) {
        console.error("API Error (PUT):", error);
        return NextResponse.json({ error: (error as Error).message || "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";
        await paymentsService.delete(id, cookie, csrfToken);
        return NextResponse.json({ message: "Payment deleted successfully" });
    } catch (error: unknown) {
        console.error("API Error (DELETE):", error);
        return NextResponse.json({ error: (error as Error).message || "Internal Server Error" }, { status: 500 });
    }
}
