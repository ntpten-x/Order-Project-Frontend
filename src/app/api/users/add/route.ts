import { userService } from "../../../../services/users.service";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        console.log("DEBUG: Posting User Body:", JSON.stringify(body, null, 2));
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";

        // Pass body directly to service
        const user = await userService.createUser(body, cookie, csrfToken);
        return NextResponse.json(user);
    } catch (error: unknown) {
        console.error("API Error:", error);
        return NextResponse.json({ error: (error as Error).message || "Internal Server Error" }, { status: 500 });
    }
}
