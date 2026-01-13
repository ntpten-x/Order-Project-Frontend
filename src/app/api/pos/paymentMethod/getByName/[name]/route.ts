import { paymentMethodService } from "../../../../../../services/pos/paymentMethod.service";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { name: string } }) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const { name } = params;
        const paymentMethod = await paymentMethodService.getByName(name, cookie);
        return NextResponse.json(paymentMethod);
    } catch (error: unknown) {
        console.error("API Error:", error);
        return NextResponse.json({ error: (error as Error).message || "Internal Server Error" }, { status: 500 });
    }
}
