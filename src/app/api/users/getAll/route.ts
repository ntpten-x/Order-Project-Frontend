import { NextRequest, NextResponse } from "next/server";
import { userService } from "../../../../services/users.service";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const searchParams = request.nextUrl.searchParams;
        const users = await userService.getAllUsers(cookie, searchParams);
        return NextResponse.json(users);
    } catch (error: unknown) {
        return NextResponse.json({ error: (error as Error).message || "Internal Server Error" }, { status: 500 });
    }
}