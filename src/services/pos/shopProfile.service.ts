import { getProxyUrl } from "../../lib/proxy-utils";
import { throwBackendHttpError, unwrapBackendData } from "../../utils/api/backendResponse";
import { withInflightDedup } from "../../utils/api/inflight";

export interface ShopProfile {
    id: string;
    shop_name: string;
    address?: string;
    phone?: string;
    promptpay_number?: string;
    promptpay_name?: string;
    takeaway_qr_token?: string | null;
    takeaway_qr_expires_at?: string | null;
}

const BASE_PATH = "/pos/shopProfile";
const SHOP_PROFILE_CACHE_TTL_MS = 60_000;

type ShopProfileCacheEntry = {
    ts: number;
    data: ShopProfile;
};

const profileCache = new Map<string, ShopProfileCacheEntry>();

const getHeaders = (cookie?: string, contentType: string = "application/json"): HeadersInit => {
    const headers: Record<string, string> = {};
    if (contentType) headers["Content-Type"] = contentType;
    if (cookie) headers.Cookie = cookie;
    return headers;
};

export const shopProfileService = {
    getProfile: async (cookie?: string): Promise<ShopProfile> => {
        const cacheKey = cookie ?? "client";
        const cached = profileCache.get(cacheKey);
        if (cached && Date.now() - cached.ts < SHOP_PROFILE_CACHE_TTL_MS) {
            return cached.data;
        }

        return withInflightDedup(`shopProfile:get:${cacheKey}`, async () => {
            const url = getProxyUrl("GET", BASE_PATH);
            const headers = getHeaders(cookie, "");

            const response = await fetch(url!, {
                cache: "no-store",
                headers,
                credentials: "include",
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throwBackendHttpError(response, errorData, "Unable to load shop profile");
            }
            const payload = unwrapBackendData(await response.json()) as ShopProfile;
            profileCache.set(cacheKey, { ts: Date.now(), data: payload });
            return payload;
        });
    },

    updateProfile: async (data: Partial<ShopProfile>, cookie?: string, csrfToken?: string): Promise<ShopProfile> => {
        const url = getProxyUrl("PUT", BASE_PATH);
        const headers = getHeaders(cookie) as Record<string, string>;
        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

        const response = await fetch(url!, {
            method: "PUT",
            headers,
            credentials: "include",
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "Unable to update shop profile");
        }
        const payload = unwrapBackendData(await response.json()) as ShopProfile;
        profileCache.clear();
        return payload;
    },
};
