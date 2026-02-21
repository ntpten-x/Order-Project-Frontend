import { NextRequest, NextResponse } from "next/server";
import { handleApiRouteError } from "../../_utils/route-error";

/**
 * This route allows the frontend to retrieve the HttpOnly 'token' cookie.
 * This is used to pass the token explicitly to Socket.IO 'auth' object
 * because the browser won't send the cookie automatically for cross-port socket handshakes.
 */
export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get("token")?.value;

        if (!token) {
            return NextResponse.json({ token: null }, { status: 200 });
        }

        return NextResponse.json({ token }, {
            headers: {
                "Cache-Control": "no-store, no-cache, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0",
            }
        });
    } catch (error: unknown) {
        console.error("Socket Token Route Error:", error);
        return handleApiRouteError(error);
    }
}
