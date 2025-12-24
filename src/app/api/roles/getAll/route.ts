import { roleService } from "@/services/roles.service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: Request) {
    try {
        const roles = await roleService.getAllRoles();
        return NextResponse.json(roles);
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
