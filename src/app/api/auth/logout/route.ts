import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/services/auth.service";

export async function POST(request: NextRequest) {
    const token = request.cookies.get("token")?.value;
    const csrfToken = request.headers.get("X-CSRF-Token") || "";
    const cookieHeader = request.headers.get("cookie") || "";

    // Attempt logout on backend (optional but good practice)
    if (token) {
        await authService.logout(token, csrfToken, cookieHeader);
    }

    const nextResponse = NextResponse.json({ message: "Logged out successfully" });

    // Clear the token cookie
    nextResponse.cookies.delete("token");
    // Clear websocket helper token
    nextResponse.cookies.delete("token_ws");

    return nextResponse;
}
