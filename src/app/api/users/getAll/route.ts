import { NextRequest, NextResponse } from "next/server";
import { userService } from "@/services/users.service";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const users = await userService.getAllUsers(cookie);
        return NextResponse.json(users);
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}