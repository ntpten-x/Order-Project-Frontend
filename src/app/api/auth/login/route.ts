import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/services/auth.service";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const csrfToken = request.headers.get("X-CSRF-Token") || "";
        const cookieHeader = request.headers.get("cookie") || "";

        // Use authService to talk to backend
        const { token, ...user } = await authService.login(body, csrfToken, cookieHeader);

        const nextResponse = NextResponse.json({ message: "Login successful", user, token });

        // Set the cookie on the response
        nextResponse.cookies.set("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 10, // 10 hours
            path: "/",
        });

        return nextResponse;

    } catch (error: unknown) {
        console.error("Login Route Error:", error);
        return NextResponse.json({
            message: "Internal Server Error",
            detail: (error as Error).message,
        }, { status: 500 });
    }
}
