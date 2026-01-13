import { Tables } from "../../types/api/pos/tables";
import { getProxyUrl } from "../../lib/proxy-utils";

const BASE_PATH = "/pos/tables";

const getHeaders = (cookie?: string, contentType: string = "application/json"): HeadersInit => {
    const headers: Record<string, string> = {};
    if (contentType) headers["Content-Type"] = contentType;
    if (cookie) headers.Cookie = cookie;
    return headers;
};

export const tablesService = {
    getAll: async (cookie?: string): Promise<Tables[]> => {
        const url = getProxyUrl("GET", BASE_PATH);
        const headers = getHeaders(cookie, "");

        const response = await fetch(url!, {
            cache: "no-store",
            headers
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "ไม่สามารถดึงข้อมูลโต๊ะได้");
        }
        return response.json();
    },

    getById: async (id: string, cookie?: string): Promise<Tables> => {
        const url = getProxyUrl("GET", `${BASE_PATH}/getById/${id}`);
        const headers = getHeaders(cookie, "");

        const response = await fetch(url!, {
            cache: "no-store",
            headers
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "ไม่สามารถดึงข้อมูลโต๊ะได้");
        }
        return response.json();
    },

    getByName: async (name: string, cookie?: string): Promise<Tables> => {
        const url = getProxyUrl("GET", `${BASE_PATH}/getByName/${name}`);
        const headers = getHeaders(cookie, "");

        const response = await fetch(url!, {
            cache: "no-store",
            headers
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "ไม่สามารถดึงข้อมูลโต๊ะได้");
        }
        return response.json();
    },

    create: async (data: Partial<Tables>, cookie?: string, csrfToken?: string): Promise<Tables> => {
        const url = getProxyUrl("POST", `${BASE_PATH}/create`);
        const headers = getHeaders(cookie) as Record<string, string>;
        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

        const response = await fetch(url!, {
            method: "POST",
            headers,
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "ไม่สามารถสร้างโต๊ะได้");
        }
        return response.json();
    },

    update: async (id: string, data: Partial<Tables>, cookie?: string, csrfToken?: string): Promise<Tables> => {
        const url = getProxyUrl("PUT", `${BASE_PATH}/update/${id}`);
        const headers = getHeaders(cookie) as Record<string, string>;
        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

        const response = await fetch(url!, {
            method: "PUT",
            headers,
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "ไม่สามารถแก้ไขโต๊ะได้");
        }
        return response.json();
    },

    delete: async (id: string, cookie?: string, csrfToken?: string): Promise<void> => {
        const url = getProxyUrl("DELETE", `${BASE_PATH}/delete/${id}`);
        const headers = getHeaders(cookie, "");
        if (csrfToken) (headers as Record<string, string>)["X-CSRF-Token"] = csrfToken;

        const response = await fetch(url!, {
            method: "DELETE",
            headers
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "ไม่สามารถลบโต๊ะได้");
        }
    }
};
