import { NextRequest, NextResponse } from "next/server";
import { userService } from "../../../../services/users.service";
import { handleApiRouteError } from "../../_utils/route-error";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const cookie = req.headers.get("cookie") || "";
        const data = await userService.getUserById(params.id, cookie);
        return NextResponse.json(data);
    } catch (error) {
        return handleApiRouteError(error);
    }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        const cookie = req.headers.get("cookie") || "";
        const csrfToken = req.headers.get("x-csrf-token") || "";

        const data = await userService.updateUser(params.id, body, cookie, csrfToken);
        return NextResponse.json(data);
    } catch (error) {
        return handleApiRouteError(error);
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const cookie = req.headers.get("cookie") || "";
        const csrfToken = req.headers.get("x-csrf-token") || "";

        await userService.deleteUser(params.id, cookie, csrfToken);
        return NextResponse.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        return handleApiRouteError(error);
    }
}