import { PaymentMethod } from "../../types/api/pos/paymentMethod";
import { getProxyUrl } from "../../lib/proxy-utils";
import { API_ROUTES } from "../../config/api";
import { normalizeBackendPaginated, throwBackendHttpError, unwrapBackendData } from "../../utils/api/backendResponse";

const BASE_PATH = API_ROUTES.POS.PAYMENT_METHODS;

const getHeaders = (cookie?: string, contentType: string = "application/json"): HeadersInit => {
    const headers: Record<string, string> = {};
    if (contentType) headers["Content-Type"] = contentType;
    if (cookie) headers.Cookie = cookie;
    return headers;
};

export const paymentMethodService = {
    getAll: async (cookie?: string, searchParams?: URLSearchParams): Promise<{ data: PaymentMethod[], total: number, page: number, last_page: number }> => {
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
            throwBackendHttpError(response, errorData, "Failed to fetch payment methods");
        }
        return normalizeBackendPaginated<PaymentMethod>(await response.json());
    },

    getById: async (id: string, cookie?: string): Promise<PaymentMethod> => {
        const url = getProxyUrl("GET", `${BASE_PATH}/${id}`);
        const headers = getHeaders(cookie, "");

        const response = await fetch(url!, {
            cache: "no-store",
            headers,
            credentials: "include"
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "Failed to fetch payment method");
        }
        return unwrapBackendData(await response.json()) as PaymentMethod;
    },

    getByName: async (name: string, cookie?: string): Promise<PaymentMethod> => {
        const url = getProxyUrl("GET", `${BASE_PATH}/getByName/${encodeURIComponent(name)}`);
        const headers = getHeaders(cookie, "");

        const response = await fetch(url!, {
            cache: "no-store",
            headers,
            credentials: "include"
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "Failed to fetch payment method");
        }
        return unwrapBackendData(await response.json()) as PaymentMethod;
    },

    create: async (data: Partial<PaymentMethod>, cookie?: string, csrfToken?: string): Promise<PaymentMethod> => {
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
            throwBackendHttpError(response, errorData, "Failed to create payment method");
        }
        return unwrapBackendData(await response.json()) as PaymentMethod;
    },

    update: async (id: string, data: Partial<PaymentMethod>, cookie?: string, csrfToken?: string): Promise<PaymentMethod> => {
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
            throwBackendHttpError(response, errorData, "Failed to update payment method");
        }
        return unwrapBackendData(await response.json()) as PaymentMethod;
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
            throwBackendHttpError(response, errorData, "Failed to delete payment method");
        }
    }
};
