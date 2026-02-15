import { Discounts } from "../../types/api/pos/discounts";
import { getProxyUrl } from "../../lib/proxy-utils";
import { API_ROUTES } from "../../config/api";
import { normalizeBackendPaginated, throwBackendHttpError, unwrapBackendData } from "../../utils/api/backendResponse";

const BASE_PATH = API_ROUTES.POS.DISCOUNTS;

const getHeaders = (cookie?: string, contentType: string = "application/json"): HeadersInit => {
    const headers: Record<string, string> = {};
    if (contentType) headers["Content-Type"] = contentType;
    if (cookie) headers.Cookie = cookie;
    return headers;
};

export const discountsService = {
    getAllPaginated: async (
        cookie?: string,
        searchParams?: URLSearchParams
    ): Promise<{ data: Discounts[]; total: number; page: number; last_page: number }> => {
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
            throwBackendHttpError(response, errorData, "ไม่สามารถดึงข้อมูลส่วนลดได้");
        }

        return normalizeBackendPaginated<Discounts>(await response.json());
    },

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
            throwBackendHttpError(response, errorData, "ไม่สามารถดึงข้อมูลส่วนลดได้");
        }
        const json = await response.json();

        // Handle different response formats
        if (Array.isArray(json)) {
            return json;
        }

        // Backend returns { success: true, data: [...] }
        if (json?.success && Array.isArray(json.data)) {
            return json.data;
        }

        // Backend returns { data: [...] } without success flag
        if (json?.data && Array.isArray(json.data)) {
            return json.data;
        }

        // Backend returns single object (shouldn't happen but handle it)
        // Check if it's a discount object by checking required fields
        if (json && typeof json === 'object' && !Array.isArray(json)) {
            // Check if it's wrapped in success response but data is object instead of array
            if (json.success && json.data && typeof json.data === 'object' && !Array.isArray(json.data)) {
                if (json.data.id && (json.data.discount_name || json.data.display_name)) {
                    return [json.data as Discounts];
                }
            }

            // Check if it's a single discount object
            if (json.id && (json.discount_name || json.display_name)) {
                // Single discount object - convert to array
                return [json as Discounts];
            }
        }

        return [];
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
            throwBackendHttpError(response, errorData, "ไม่สามารถดึงข้อมูลส่วนลดได้");
        }
        return unwrapBackendData(await response.json()) as Discounts;
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
            throwBackendHttpError(response, errorData, "ไม่สามารถดึงข้อมูลส่วนลดได้");
        }
        return unwrapBackendData(await response.json()) as Discounts;
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
            throwBackendHttpError(response, errorData, "ไม่สามารถสร้างส่วนลดได้");
        }
        return unwrapBackendData(await response.json()) as Discounts;
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
            throwBackendHttpError(response, errorData, "ไม่สามารถแก้ไขส่วนลดได้");
        }
        return unwrapBackendData(await response.json()) as Discounts;
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
            throwBackendHttpError(response, errorData, "ไม่สามารถลบส่วนลดได้");
        }
    }
};
