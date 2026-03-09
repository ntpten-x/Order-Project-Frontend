import { NextRequest, NextResponse } from "next/server";

import { deliveryService } from "../../../../../services/pos/delivery.service";
import { handleApiRouteError } from "../../../_utils/route-error";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const delivery = await deliveryService.getById(params.id, cookie);
        return NextResponse.json(delivery);
    } catch (error: unknown) {
        console.error("API Error:", error);
        return handleApiRouteError(error);
    }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await request.json();
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";
        const delivery = await deliveryService.update(params.id, body, cookie, csrfToken);
        return NextResponse.json(delivery);
    } catch (error: unknown) {
        console.error("API Error:", error);
        return handleApiRouteError(error);
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";
        await deliveryService.delete(params.id, cookie, csrfToken);
        return NextResponse.json({ message: "Delivery deleted successfully" });
    } catch (error: unknown) {
        console.error("API Error:", error);
        return handleApiRouteError(error);
    }
}
