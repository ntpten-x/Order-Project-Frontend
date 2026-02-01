import { Promotions, ValidatePromotionDTO, PromotionEligibility } from "../../types/api/pos/promotions";
import { getProxyUrl } from "../../lib/proxy-utils";
import { API_ROUTES } from "../../config/api";
import { getCsrfTokenCached } from "../../utils/pos/csrf";

const BASE_PATH = API_ROUTES.POS.PROMOTIONS;

const getHeaders = (cookie?: string, contentType: string = "application/json"): HeadersInit => {
    const headers: Record<string, string> = {};
    if (contentType) headers["Content-Type"] = contentType;
    if (cookie) headers.Cookie = cookie;
    return headers;
};

export const promotionsService = {
    getAll: async (cookie?: string, isActive?: boolean): Promise<Promotions[]> => {
        const queryParams = new URLSearchParams();
        if (isActive !== undefined) queryParams.append("isActive", isActive.toString());
        
        const endpoint = queryParams.toString() ? `${BASE_PATH}?${queryParams.toString()}` : BASE_PATH;
        const url = getProxyUrl("GET", endpoint);
        const headers = getHeaders(cookie, "");

        const response = await fetch(url!, {
            cache: "no-store",
            headers,
            credentials: "include"
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || errorData.message || "ไม่สามารถดึงข้อมูลโปรโมชันได้");
        }

        const json = await response.json();
        if (json.success && Array.isArray(json.data)) {
            return json.data;
        }
        if (Array.isArray(json)) {
            return json;
        }
        return [];
    },

    getActivePromotions: async (cookie?: string): Promise<Promotions[]> => {
        const url = getProxyUrl("GET", `${BASE_PATH}/active`);
        const headers = getHeaders(cookie, "");

        const response = await fetch(url!, {
            cache: "no-store",
            headers,
            credentials: "include"
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || errorData.message || "ไม่สามารถดึงข้อมูลโปรโมชันได้");
        }

        const json = await response.json();
        if (json.success && Array.isArray(json.data)) {
            return json.data;
        }
        if (Array.isArray(json)) {
            return json;
        }
        return [];
    },

    getById: async (id: string, cookie?: string): Promise<Promotions> => {
        const url = getProxyUrl("GET", `${BASE_PATH}/getById/${id}`);
        const headers = getHeaders(cookie, "");

        const response = await fetch(url!, {
            cache: "no-store",
            headers,
            credentials: "include"
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || errorData.message || "ไม่สามารถดึงข้อมูลโปรโมชันได้");
        }

        const json = await response.json();
        if (json.success && json.data) {
            return json.data;
        }
        return json;
    },

    create: async (data: Partial<Promotions>, cookie?: string): Promise<Promotions> => {
        const url = getProxyUrl("POST", `${BASE_PATH}/create`);
        const headers = getHeaders(cookie) as Record<string, string>;
        const csrfToken = await getCsrfTokenCached();
        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

        const response = await fetch(url!, {
            method: "POST",
            headers,
            credentials: "include",
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || errorData.message || "ไม่สามารถสร้างโปรโมชันได้");
        }

        const json = await response.json();
        if (json.success && json.data) {
            return json.data;
        }
        return json;
    },

    update: async (id: string, data: Partial<Promotions>, cookie?: string): Promise<Promotions> => {
        const url = getProxyUrl("PUT", `${BASE_PATH}/update/${id}`);
        const headers = getHeaders(cookie) as Record<string, string>;
        const csrfToken = await getCsrfTokenCached();
        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

        const response = await fetch(url!, {
            method: "PUT",
            headers,
            credentials: "include",
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || errorData.message || "ไม่สามารถอัปเดตโปรโมชันได้");
        }

        const json = await response.json();
        if (json.success && json.data) {
            return json.data;
        }
        return json;
    },

    delete: async (id: string, cookie?: string): Promise<void> => {
        const url = getProxyUrl("DELETE", `${BASE_PATH}/delete/${id}`);
        const headers = getHeaders(cookie, "");
        const csrfToken = await getCsrfTokenCached();
        if (csrfToken) (headers as Record<string, string>)["X-CSRF-Token"] = csrfToken;

        const response = await fetch(url!, {
            method: "DELETE",
            headers,
            credentials: "include"
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || errorData.message || "ไม่สามารถลบโปรโมชันได้");
        }
    },

    validatePromotion: async (data: ValidatePromotionDTO, cookie?: string): Promise<PromotionEligibility> => {
        const url = getProxyUrl("POST", `${BASE_PATH}/validate`);
        const headers = getHeaders(cookie) as Record<string, string>;

        const response = await fetch(url!, {
            method: "POST",
            headers,
            credentials: "include",
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || errorData.message || "ไม่สามารถตรวจสอบโปรโมชันได้");
        }

        const json = await response.json();
        if (json.success && json.data) {
            return json.data;
        }
        return json;
    },

    applyPromotion: async (code: string, cookie?: string): Promise<Promotions> => {
        const url = getProxyUrl("POST", `${BASE_PATH}/apply`);
        const headers = getHeaders(cookie) as Record<string, string>;
        const csrfToken = await getCsrfTokenCached();
        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

        const response = await fetch(url!, {
            method: "POST",
            headers,
            credentials: "include",
            body: JSON.stringify({ code }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || errorData.message || "ไม่สามารถใช้โปรโมชันได้");
        }

        const json = await response.json();
        if (json.success && json.data) {
            return json.data;
        }
        return json;
    },
};
