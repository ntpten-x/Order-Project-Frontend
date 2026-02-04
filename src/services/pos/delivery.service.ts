import { Delivery } from "../../types/api/pos/delivery";
import { getProxyUrl } from "../../lib/proxy-utils";
import { API_ROUTES } from "../../config/api";
import { normalizeBackendPaginated, unwrapBackendData } from "../../utils/api/backendResponse";

const BASE_PATH = API_ROUTES.POS.DELIVERY;

const getHeaders = (cookie?: string, contentType: string = "application/json"): HeadersInit => {
    const headers: Record<string, string> = {};
    if (contentType) headers["Content-Type"] = contentType;
    if (cookie) headers.Cookie = cookie;
    return headers;
};

export const deliveryService = {
    getAll: async (cookie?: string, searchParams?: URLSearchParams): Promise<{ data: Delivery[], total: number, page: number, last_page: number }> => {
        let url = getProxyUrl("GET", BASE_PATH);
        const params = new URLSearchParams(searchParams || "");
        if (!params.has("page")) params.set("page", "1");
        if (!params.has("limit")) params.set("limit", "200");
        const query = params.toString();
        if (query) {
            url += `?${query}`;
        }
        const headers = getHeaders(cookie, "");

        const response = await fetch(url!, {
            cache: "no-store",
            headers,
            credentials: "include"
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData?.error?.message || errorData.error || errorData.message || "Failed to fetch delivery providers");
        }
        return normalizeBackendPaginated<Delivery>(await response.json());
    },

    getById: async (id: string, cookie?: string): Promise<Delivery> => {
        const url = getProxyUrl("GET", `${BASE_PATH}/${id}`);
        const headers = getHeaders(cookie, "");

        const response = await fetch(url!, {
            cache: "no-store",
            headers,
            credentials: "include"
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData?.error?.message || errorData.error || errorData.message || "Failed to fetch delivery provider");
        }
        return unwrapBackendData(await response.json()) as Delivery;
    },

    getByName: async (name: string, cookie?: string): Promise<Delivery> => {
        const url = getProxyUrl("GET", `${BASE_PATH}/getByName/${name}`);
        const headers = getHeaders(cookie, "");

        const response = await fetch(url!, {
            cache: "no-store",
            headers,
            credentials: "include"
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData?.error?.message || errorData.error || errorData.message || "Failed to fetch delivery provider");
        }
        return unwrapBackendData(await response.json()) as Delivery;
    },

    create: async (data: Partial<Delivery>, cookie?: string, csrfToken?: string): Promise<Delivery> => {
        const url = getProxyUrl("POST", `${BASE_PATH}`);
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
            throw new Error(errorData?.error?.message || errorData.error || errorData.message || "Failed to create delivery provider");
        }
        return unwrapBackendData(await response.json()) as Delivery;
    },

    update: async (id: string, data: Partial<Delivery>, cookie?: string, csrfToken?: string): Promise<Delivery> => {
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
            throw new Error(errorData?.error?.message || errorData.error || errorData.message || "Failed to update delivery provider");
        }
        return unwrapBackendData(await response.json()) as Delivery;
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
            throw new Error(errorData?.error?.message || errorData.error || errorData.message || "Failed to delete delivery provider");
        }
    }
};
