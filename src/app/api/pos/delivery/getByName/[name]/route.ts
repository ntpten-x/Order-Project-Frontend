import { deliveryService } from "../../../../../../services/pos/delivery.service";
import { NextRequest, NextResponse } from "next/server";
import { handleApiRouteError } from "../../../../_utils/route-error";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { name: string } }) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const { name } = params;
        const delivery = await deliveryService.getByName(name, cookie);
        return NextResponse.json(delivery);
    } catch (error: unknown) {
        console.error("API Error:", error);
        return handleApiRouteError(error);
    }
}
