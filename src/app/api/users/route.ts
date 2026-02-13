import { NextRequest, NextResponse } from "next/server";
import { userService } from "../../../services/users.service";
import { handleApiRouteError } from "../_utils/route-error";

export async function GET(req: NextRequest) {
    try {
        const cookie = req.headers.get("cookie") || "";
        const searchParams = req.nextUrl.searchParams;
        const data = await userService.getAllUsersPaginated(cookie, searchParams);
        return NextResponse.json(data);
    } catch (error) {
        return handleApiRouteError(error);
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const cookie = req.headers.get("cookie") || "";
        const csrfToken = req.headers.get("x-csrf-token") || "";

        const data = await userService.createUser(body, cookie, csrfToken);
        return NextResponse.json(data);
    } catch (error) {
        return handleApiRouteError(error);
    }
}
