import { roleService } from "../../../../services/roles.service";
import { NextRequest, NextResponse } from "next/server";
import { handleApiRouteError } from "../../_utils/route-error";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const roles = await roleService.getAllRoles(cookie);
        return NextResponse.json(roles);
    } catch (error: unknown) {
        console.error("API Error fetching roles:", error);
        return handleApiRouteError(error);
    }
}
