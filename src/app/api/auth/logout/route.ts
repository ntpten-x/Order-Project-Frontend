import { NextRequest, NextResponse } from "next/server";

export async function POST(_request: NextRequest) {
    const nextResponse = NextResponse.json({ message: "Logged out successfully" });

    // Clear the token cookie
    nextResponse.cookies.delete("token");

    return nextResponse;
}
