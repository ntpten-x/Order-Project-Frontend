import { userService } from "@/services/users.service";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, { params }: { params: { username: string; password: string; roleId: string } }) {
    try {
        const { username, password, roleId } = params;
        const user = await userService.createUser({
            username,
            password,
            roles_id: roleId,
        });
        return NextResponse.json(user);
    } catch (error: any) {
        console.error("API Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}