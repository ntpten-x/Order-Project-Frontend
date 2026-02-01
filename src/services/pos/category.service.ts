import { Category } from "../../types/api/pos/category";
import { getProxyUrl } from "../../lib/proxy-utils";

const BASE_PATH = "/pos/category";

export const categoryService = {
    findAll: async (cookie?: string, searchParams?: URLSearchParams): Promise<Category[]> => {
        let url = getProxyUrl("GET", BASE_PATH);
        if (searchParams) {
            url += `?${searchParams.toString()}`;
        }

        const headers: HeadersInit = {};
        if (cookie) headers.Cookie = cookie;

        const response = await fetch(url!, {
            cache: "no-store",
            credentials: 'include',
            headers
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "Failed to fetch categories");
        }
        const json = await response.json();
        if (Array.isArray(json)) {
            return json;
        }
        if (json?.success && Array.isArray(json.data)) {
            return json.data;
        }
        throw new Error("Invalid categories response format");
    },

    findOne: async (id: string, cookie?: string): Promise<Category> => {
        const url = getProxyUrl("GET", `${BASE_PATH}/${id}`);
        const headers: HeadersInit = {};
        if (cookie) headers.Cookie = cookie;

        const response = await fetch(url!, {
            cache: "no-store",
            credentials: 'include',
            headers
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "Failed to fetch category");
        }
        const json = await response.json();
        if (json?.success && json.data) {
            return json.data;
        }
        return json;
    },

    findOneByName: async (name: string, cookie?: string): Promise<Category> => {
        const url = getProxyUrl("GET", `${BASE_PATH}/name/${name}`);
        const headers: HeadersInit = {};
        if (cookie) headers.Cookie = cookie;

        const response = await fetch(url!, {
            cache: "no-store",
            credentials: 'include',
            headers
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "Failed to fetch category by name");
        }
        const json = await response.json();
        if (json?.success && json.data) {
            return json.data;
        }
        return json;
    },

    create: async (data: Partial<Category>, cookie?: string, csrfToken?: string): Promise<Category> => {
        const url = getProxyUrl("POST", BASE_PATH);
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (cookie) headers.Cookie = cookie;
        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

        const response = await fetch(url!, {
            method: "POST",
            headers,
            body: JSON.stringify(data),
            credentials: 'include'
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "Failed to create category");
        }
        return response.json();
    },

    update: async (id: string, data: Partial<Category>, cookie?: string, csrfToken?: string): Promise<Category> => {
        const url = getProxyUrl("PUT", `${BASE_PATH}/${id}`);
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (cookie) headers.Cookie = cookie;
        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

        const response = await fetch(url!, {
            method: "PUT",
            headers,
            body: JSON.stringify(data),
            credentials: 'include'
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "Failed to update category");
        }
        return response.json();
    },

    delete: async (id: string, cookie?: string, csrfToken?: string): Promise<void> => {
        const url = getProxyUrl("DELETE", `${BASE_PATH}/${id}`);
        const headers: Record<string, string> = {};
        if (cookie) headers.Cookie = cookie;
        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

        const response = await fetch(url!, {
            method: "DELETE",
            headers,
            credentials: 'include'
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "Failed to delete category");
        }
    },
};
