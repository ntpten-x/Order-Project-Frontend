import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get("token")?.value;

        if (!token) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:3000";

        const response = await fetch(`${backendUrl}/auth/me`, {
            method: "GET",
            headers: {
                "Cookie": `token=${token}`, // Pass the token to backend
                "Content-Type": "application/json"
            },
        });

        if (!response.ok) {
            // If backend says unauthorized (e.g. token expired), we should probably clear our cookie
            const nextResponse = NextResponse.json({ message: "Unauthorized" }, { status: response.status });
            if (response.status === 401 || response.status === 403) {
                nextResponse.cookies.delete("token");
            }
            return nextResponse;
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error("GetMe Proxy Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
