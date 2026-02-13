import { NextRequest, NextResponse } from "next/server";
import { shopProfileService } from "../../../../services/pos/shopProfile.service";
import { handleApiRouteError } from "../../_utils/route-error";

export async function GET(request: NextRequest) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const profile = await shopProfileService.getProfile(cookie);
        return NextResponse.json(profile);
    } catch (error) {
        return handleApiRouteError(error);
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";

        const updatedProfile = await shopProfileService.updateProfile(body, cookie, csrfToken);
        return NextResponse.json(updatedProfile);
    } catch (error) {
        return handleApiRouteError(error);
    }
}
