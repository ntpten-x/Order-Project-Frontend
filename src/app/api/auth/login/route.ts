import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:3000"; // Use env var

        const response = await fetch(`${backendUrl}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const error = await response.json();
            return NextResponse.json(error, { status: response.status });
        }

        const data = await response.json();
        const token = data.token;
        const user = data.user;

        const nextResponse = NextResponse.json({ message: "Login successful", user });

        // Set the cookie on the response
        // Note: In production (HTTPS), secure: true is important.
        nextResponse.cookies.set("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax", // Better for top-level navigation, or 'strict'
            maxAge: 60 * 60 * 10, // 10 hours
            path: "/",
        });

        return nextResponse;

    } catch (error: unknown) {
        console.error("Login Proxy Error:", error);
        console.error("Attempted Backend URL:", process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:3000");
        return NextResponse.json({
            message: "Internal Server Error",
            detail: (error as Error).message,
            backendUrl: process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:3000"
        }, { status: 500 });
    }
}
