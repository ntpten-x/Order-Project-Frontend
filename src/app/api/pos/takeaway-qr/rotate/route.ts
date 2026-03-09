import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { takeawayQrService } from "../../../../../services/pos/takeawayQr.service";
import { shopProfileService } from "../../../../../services/pos/shopProfile.service";
import { BackendHttpError } from "../../../../../utils/api/backendResponse";
import { handleApiRouteError } from "../../../_utils/route-error";

export const dynamic = "force-dynamic";

const TAKEAWAY_QR_TOKEN_PREFIX = "tw_";
const TAKEAWAY_QR_TOKEN_BYTES = Math.max(16, Number(process.env.TAKEAWAY_QR_TOKEN_BYTES || 24));
const TAKEAWAY_QR_TOKEN_EXPIRE_DAYS = Number(process.env.TAKEAWAY_QR_TOKEN_EXPIRE_DAYS || 365);

function buildFallbackToken() {
    return `${TAKEAWAY_QR_TOKEN_PREFIX}${randomBytes(TAKEAWAY_QR_TOKEN_BYTES).toString("base64url")}`;
}

function resolveFallbackExpiryIso(): string | null {
    if (!Number.isFinite(TAKEAWAY_QR_TOKEN_EXPIRE_DAYS) || TAKEAWAY_QR_TOKEN_EXPIRE_DAYS <= 0) {
        return null;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + TAKEAWAY_QR_TOKEN_EXPIRE_DAYS);
    return expiresAt.toISOString();
}

async function rotateViaShopProfileFallback(cookie: string, csrfToken: string) {
    const profile = await shopProfileService.getProfile(cookie);
    const nextToken = buildFallbackToken();
    const nextExpiryIso = resolveFallbackExpiryIso();

    const updatedProfile = await shopProfileService.updateProfile(
        {
            shop_name: profile.shop_name,
            address: profile.address,
            phone: profile.phone,
            promptpay_name: profile.promptpay_name,
            promptpay_number: profile.promptpay_number,
            takeaway_qr_token: nextToken,
            takeaway_qr_expires_at: nextExpiryIso,
        },
        cookie,
        csrfToken
    );

    return {
        token: updatedProfile.takeaway_qr_token || nextToken,
        customer_path: `/order/takeaway/${updatedProfile.takeaway_qr_token || nextToken}`,
        qr_code_expires_at: updatedProfile.takeaway_qr_expires_at ?? nextExpiryIso,
        shop_name: updatedProfile.shop_name || profile.shop_name || null,
    };
}

export async function POST(request: NextRequest) {
    try {
        const cookie = request.headers.get("cookie") || "";
        const csrfToken = request.headers.get("X-CSRF-Token") || "";
        let payload;
        try {
            payload = await takeawayQrService.rotate(cookie, csrfToken);
        } catch (error) {
            const isMissingDedicatedRoute =
                error instanceof BackendHttpError &&
                error.status === 404 &&
                typeof error.message === "string" &&
                error.message.includes("/pos/takeaway-qr/rotate");

            if (!isMissingDedicatedRoute) {
                throw error;
            }

            payload = await rotateViaShopProfileFallback(cookie, csrfToken);
        }

        return NextResponse.json(payload);
    } catch (error) {
        return handleApiRouteError(error);
    }
}
