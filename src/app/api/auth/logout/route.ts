import { NextResponse } from "next/server";

export async function POST() {
    const nextResponse = NextResponse.json({ message: "Logged out successfully" });

    // Clear the token cookie
    nextResponse.cookies.delete("token");

    return nextResponse;
}
