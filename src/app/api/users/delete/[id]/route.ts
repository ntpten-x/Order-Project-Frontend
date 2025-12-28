import { userService } from "../../../../../services/users.service";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const cookie = request.headers.get("cookie") || "";
        await userService.deleteUser(id, cookie);
        return NextResponse.json({ message: "User deleted successfully" });
    } catch (error: unknown) {
        console.error("API Error:", error);
        return NextResponse.json({ error: (error as Error).message || "Internal Server Error" }, { status: 500 });
    }
}