import { roleService } from "../../../../services/roles.service";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const roles = await roleService.getAllRoles(cookie);
        return NextResponse.json(roles);
    } catch (error: unknown) {
        console.error("API Error fetching roles:", error);
        return NextResponse.json({ error: (error as Error).message || "Internal Server Error" }, { status: 500 });
    }
}
