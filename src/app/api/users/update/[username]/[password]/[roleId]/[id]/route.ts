import { userService } from "@/services/users.service";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest, { params }: { params: { username: string; password: string; roleId: string; id: string } }) {
    try {
        const { username, password, roleId, id } = params;
        const updateData: any = {
            username,
            roles_id: parseInt(roleId),
        };

        if (password !== '__KEEP_PASSWORD__') {
            updateData.password = password;
        }

        const user = await userService.updateUser(parseInt(id), updateData);
        return NextResponse.json(user);
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}