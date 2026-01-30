import { Discounts } from "../../types/api/pos/discounts";
import { getProxyUrl } from "../../lib/proxy-utils";
import { API_ROUTES } from "../../config/api";

const BASE_PATH = API_ROUTES.POS.DISCOUNTS;

const getHeaders = (cookie?: string, contentType: string = "application/json"): HeadersInit => {
    const headers: Record<string, string> = {};
    if (contentType) headers["Content-Type"] = contentType;
    if (cookie) headers.Cookie = cookie;
    return headers;
};

export const discountsService = {
    getAll: async (cookie?: string, searchParams?: URLSearchParams): Promise<Discounts[]> => {
        let url = getProxyUrl("GET", BASE_PATH);
        const params = new URLSearchParams(searchParams || "");
        if (params.toString()) {
            url += `?${params.toString()}`;
        }
        const headers = getHeaders(cookie, "");

        const response = await fetch(url!, {
            cache: "no-store",
            headers,
            credentials: "include"
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "ไม่สามารถดึงข้อมูลส่วนลดได้");
        }
        return response.json();
    },

    getById: async (id: string, cookie?: string): Promise<Discounts> => {
        const url = getProxyUrl("GET", `${BASE_PATH}/${id}`);
        const headers = getHeaders(cookie, "");

        const response = await fetch(url!, {
            cache: "no-store",
            headers,
            credentials: "include"
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "ไม่สามารถดึงข้อมูลส่วนลดได้");
        }
        return response.json();
    },

    getByName: async (name: string, cookie?: string): Promise<Discounts> => {
        const url = getProxyUrl("GET", `${BASE_PATH}/getByName/${name}`);
        const headers = getHeaders(cookie, "");

        const response = await fetch(url!, {
            cache: "no-store",
            headers,
            credentials: "include"
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "ไม่สามารถดึงข้อมูลส่วนลดได้");
        }
        return response.json();
    },

    create: async (data: Partial<Discounts>, cookie?: string, csrfToken?: string): Promise<Discounts> => {
        const url = getProxyUrl("POST", BASE_PATH);
        const headers = getHeaders(cookie) as Record<string, string>;
        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

        const response = await fetch(url!, {
            method: "POST",
            headers,
            credentials: "include",
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "ไม่สามารถสร้างส่วนลดได้");
        }
        return response.json();
    },

    update: async (id: string, data: Partial<Discounts>, cookie?: string, csrfToken?: string): Promise<Discounts> => {
        const url = getProxyUrl("PUT", `${BASE_PATH}/${id}`);
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
            throw new Error(errorData.error || errorData.message || "ไม่สามารถแก้ไขส่วนลดได้");
        }
        return response.json();
    },

    delete: async (id: string, cookie?: string, csrfToken?: string): Promise<void> => {
        const url = getProxyUrl("DELETE", `${BASE_PATH}/${id}`);
        const headers = getHeaders(cookie, "");
        if (csrfToken) (headers as Record<string, string>)["X-CSRF-Token"] = csrfToken;

        const response = await fetch(url!, {
            method: "DELETE",
            headers,
            credentials: "include"
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "ไม่สามารถลบส่วนลดได้");
        }
    }
};
