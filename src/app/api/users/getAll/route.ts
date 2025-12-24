import { NextResponse } from "next/server";
import { userService } from "@/services/users.service";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const users = await userService.getAllUsers();
        return NextResponse.json(users);
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}