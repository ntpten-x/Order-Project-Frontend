import { roleService } from "@/services/roles.service";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const roles = await roleService.getAllRoles();
        return NextResponse.json(roles);
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
