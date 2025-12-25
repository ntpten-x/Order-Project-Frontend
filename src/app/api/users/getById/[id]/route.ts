import { NextRequest, NextResponse } from "next/server";
import { userService } from "@/services/users.service";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const users = await userService.getUserById(id);
        return NextResponse.json(users);
    } catch (error: any) {
        console.error("API Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}