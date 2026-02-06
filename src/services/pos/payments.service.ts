import { Payments } from "../../types/api/pos/payments";
import { getProxyUrl } from "../../lib/proxy-utils";
import { getBackendErrorMessage, unwrapBackendData } from "../../utils/api/backendResponse";

const BASE_PATH = "/pos/payments";

const getHeaders = (cookie?: string, contentType: string = "application/json"): HeadersInit => {
    const headers: Record<string, string> = {};
    if (contentType) headers["Content-Type"] = contentType;
    if (cookie) headers.Cookie = cookie;
    return headers;
};

export const paymentsService = {
    getAll: async (cookie?: string): Promise<Payments[]> => {
        const url = getProxyUrl("GET", BASE_PATH);
        const headers = getHeaders(cookie, "");

        const response = await fetch(url!, {
            cache: "no-store",
            headers
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(getBackendErrorMessage(errorData, "ไม่สามารถดึงข้อมูลการชำระเงินได้"));
        }
        return unwrapBackendData(await response.json()) as Payments[];
    },

    getById: async (id: string, cookie?: string): Promise<Payments> => {
        const url = getProxyUrl("GET", `${BASE_PATH}/${id}`);
        const headers = getHeaders(cookie, "");

        const response = await fetch(url!, {
            cache: "no-store",
            headers
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(getBackendErrorMessage(errorData, "ไม่สามารถดึงข้อมูลการชำระเงินได้"));
        }
        return unwrapBackendData(await response.json()) as Payments;
    },

    create: async (data: Partial<Payments>, cookie?: string, csrfToken?: string): Promise<Payments> => {
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
            throw new Error(getBackendErrorMessage(errorData, "ไม่สามารถสร้างรายการชำระเงินได้"));
        }
        return unwrapBackendData(await response.json()) as Payments;
    },

    update: async (id: string, data: Partial<Payments>, cookie?: string, csrfToken?: string): Promise<Payments> => {
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
            throw new Error(getBackendErrorMessage(errorData, "ไม่สามารถแก้ไขรายการชำระเงินได้"));
        }
        return unwrapBackendData(await response.json()) as Payments;
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
            throw new Error(getBackendErrorMessage(errorData, "ไม่สามารถลบรายการชำระเงินได้"));
        }
    }
};
