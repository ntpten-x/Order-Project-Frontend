
import { userService } from "@/services/users.service";
import { NextRequest, NextResponse } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PUT(request: NextRequest, { params }: { params: any }) {
    try {
        const { username, password, roleId, id } = params;

        let body = {};
        try {
            const contentLength = request.headers.get("content-length");
            if (contentLength && parseInt(contentLength) > 0) {
                body = await request.json();
            }
        } catch (e) {
            console.warn("Failed to parse request body:", e);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: any = {
            username,
            roles_id: roleId, // Use as string (UUID)
            ...body // Merge body (contains is_active, is_use)
        };

        if (password !== '__KEEP_PASSWORD__') {
            updateData.password = password;
        }

        const cookie = request.headers.get("cookie") || "";
        const user = await userService.updateUser(id, updateData, cookie); // id as string
        return NextResponse.json(user);
    } catch (error: any) {
        console.error("API Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}