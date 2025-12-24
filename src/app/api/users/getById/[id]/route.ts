import { NextRequest, NextResponse } from "next/server";
import { userService } from "@/services/users.service";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const users = await userService.getUserById(parseInt(id));
        return NextResponse.json(users);
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}