import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/services/auth.service";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get("token")?.value;

        if (!token) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        try {
            const user = await authService.getMe(token);
            return NextResponse.json(user);
        } catch {
            // If service fails (e.g. invalid token), clear cookie
            const nextResponse = NextResponse.json({ message: "Unauthorized" }, { status: 401 });
            nextResponse.cookies.delete("token");
            return nextResponse;
        }

    } catch (error) {
        console.error("GetMe Route Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
