import { NextRequest, NextResponse } from "next/server";
import { userService } from "@/services/users.service";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const cookie = request.headers.get("cookie") || "";
        const users = await userService.getUserById(id, cookie);
        return NextResponse.json(users);
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: (error as Error).message || "Internal Server Error" }, { status: 500 });
    }
}