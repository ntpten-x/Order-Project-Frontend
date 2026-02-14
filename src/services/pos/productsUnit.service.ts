import { ProductsUnit } from "../../types/api/pos/productsUnit";
import { getProxyUrl } from "../../lib/proxy-utils";
import { normalizeBackendPaginated, unwrapBackendData } from "../../utils/api/backendResponse";

const BASE_PATH = "/pos/productsUnit";

export const productsUnitService = {
    findAllPaginated: async (
        cookie?: string,
        searchParams?: URLSearchParams
    ): Promise<{ data: ProductsUnit[]; total: number; page: number; last_page: number }> => {
        let url = getProxyUrl("GET", BASE_PATH);
        if (searchParams) {
            url += `?${searchParams.toString()}`;
        }

        const headers: HeadersInit = {};
        if (cookie) headers.Cookie = cookie;

        const response = await fetch(url!, {
            cache: "no-store",
            credentials: "include",
            headers
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData?.error?.message || errorData.error || errorData.message || "Failed to fetch products units");
        }
        return normalizeBackendPaginated<ProductsUnit>(await response.json());
    },

    findAll: async (cookie?: string, searchParams?: URLSearchParams): Promise<ProductsUnit[]> => {
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
            throw new Error(errorData?.error?.message || errorData.error || errorData.message || "Failed to fetch products units");
        }
        return unwrapBackendData(await response.json()) as ProductsUnit[];
    },

    findOne: async (id: string, cookie?: string): Promise<ProductsUnit> => {
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
            throw new Error(errorData?.error?.message || errorData.error || errorData.message || "Failed to fetch products unit");
        }
        return unwrapBackendData(await response.json()) as ProductsUnit;
    },

    findOneByName: async (name: string, cookie?: string): Promise<ProductsUnit> => {
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
            throw new Error(errorData?.error?.message || errorData.error || errorData.message || "Failed to fetch products unit by name");
        }
        return unwrapBackendData(await response.json()) as ProductsUnit;
    },

    create: async (data: Partial<ProductsUnit>, cookie?: string, csrfToken?: string): Promise<ProductsUnit> => {
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
            throw new Error(errorData?.error?.message || errorData.error || errorData.message || "Failed to create products unit");
        }
        return unwrapBackendData(await response.json()) as ProductsUnit;
    },

    update: async (id: string, data: Partial<ProductsUnit>, cookie?: string, csrfToken?: string): Promise<ProductsUnit> => {
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
            throw new Error(errorData?.error?.message || errorData.error || errorData.message || "Failed to update products unit");
        }
        return unwrapBackendData(await response.json()) as ProductsUnit;
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
            throw new Error(errorData?.error?.message || errorData.error || errorData.message || "Failed to delete products unit");
        }
    },
};
