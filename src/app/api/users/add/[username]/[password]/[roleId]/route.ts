import { userService } from "@/services/users.service";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, { params }: { params: { username: string; password: string; roleId: string } }) {
    try {
        const { username, password, roleId } = params;
        const user = await userService.createUser({
            username,
            password,
            roles_id: parseInt(roleId),
        });
        return NextResponse.json(user);
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}