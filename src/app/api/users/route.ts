import { NextRequest, NextResponse } from "next/server";
import { userService } from "../../../services/users.service";

export async function GET(req: NextRequest) {
    try {
        const cookie = req.headers.get("cookie") || "";
        const searchParams = req.nextUrl.searchParams;
        const data = await userService.getAllUsers(cookie, searchParams);
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to fetch users" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const cookie = req.headers.get("cookie") || "";
        const csrfToken = req.headers.get("x-csrf-token") || "";

        const data = await userService.createUser(body, cookie, csrfToken);
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to create user" },
            { status: 500 }
        );
    }
}
