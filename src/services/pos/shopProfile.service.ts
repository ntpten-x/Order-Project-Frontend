import { getProxyUrl } from "../../lib/proxy-utils";
import { throwBackendHttpError, unwrapBackendData } from "../../utils/api/backendResponse";

export interface ShopProfile {
    id: string;
    shop_name: string;
    address?: string;
    phone?: string;
    promptpay_number?: string;
    promptpay_name?: string;
}

const BASE_PATH = "/pos/shopProfile";

const getHeaders = (cookie?: string, contentType: string = "application/json"): HeadersInit => {
    const headers: Record<string, string> = {};
    if (contentType) headers["Content-Type"] = contentType;
    if (cookie) headers.Cookie = cookie;
    return headers;
};

export const shopProfileService = {
    getProfile: async (cookie?: string): Promise<ShopProfile> => {
        const url = getProxyUrl("GET", BASE_PATH);
        const headers = getHeaders(cookie, "");

        const response = await fetch(url!, {
            cache: "no-store",
            headers,
            credentials: "include"
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "ไม่สามารถดึงข้อมูลร้านค้าได้");
        }
        return unwrapBackendData(await response.json()) as ShopProfile;
    },

    updateProfile: async (data: Partial<ShopProfile>, cookie?: string, csrfToken?: string): Promise<ShopProfile> => {
        const url = getProxyUrl("PUT", BASE_PATH);
        const headers = getHeaders(cookie) as Record<string, string>;
        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

        const response = await fetch(url!, {
            method: "PUT", // Matches route definition
            headers,
            credentials: "include",
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "ไม่สามารถอัปเดตข้อมูลร้านค้าได้");
        }
        return unwrapBackendData(await response.json()) as ShopProfile;
    }
};
