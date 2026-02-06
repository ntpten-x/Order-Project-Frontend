import { IngredientsUnit } from "../../types/api/stock/ingredientsUnit";
import { getProxyUrl } from "../../lib/proxy-utils";
import { getBackendErrorMessage, unwrapBackendData } from "../../utils/api/backendResponse";

const BASE_PATH = "/stock/ingredientsUnit";

export const ingredientsUnitService = {
    findAll: async (cookie?: string, searchParams?: URLSearchParams): Promise<IngredientsUnit[]> => {
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
            throw new Error(getBackendErrorMessage(errorData, "Failed to fetch ingredients units"));
        }
        return unwrapBackendData(await response.json()) as IngredientsUnit[];
    },

    findOne: async (id: string, cookie?: string): Promise<IngredientsUnit> => {
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
            throw new Error(getBackendErrorMessage(errorData, "Failed to fetch ingredients unit"));
        }
        return unwrapBackendData(await response.json()) as IngredientsUnit;
    },

    findOneByUnitName: async (name: string, cookie?: string): Promise<IngredientsUnit> => {
        const url = getProxyUrl("GET", `${BASE_PATH}/unit_name/${name}`);
        const headers: HeadersInit = {};
        if (cookie) headers.Cookie = cookie;

        const response = await fetch(url!, {
            cache: "no-store",
            credentials: 'include',
            headers
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(getBackendErrorMessage(errorData, "Failed to fetch ingredients unit by name"));
        }
        return unwrapBackendData(await response.json()) as IngredientsUnit;
    },

    create: async (data: Partial<IngredientsUnit>, cookie?: string, csrfToken?: string): Promise<IngredientsUnit> => {
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
            throw new Error(getBackendErrorMessage(errorData, "Failed to create ingredients unit"));
        }
        return unwrapBackendData(await response.json()) as IngredientsUnit;
    },

    update: async (id: string, data: Partial<IngredientsUnit>, cookie?: string, csrfToken?: string): Promise<IngredientsUnit> => {
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
            throw new Error(getBackendErrorMessage(errorData, "Failed to update ingredients unit"));
        }
        return unwrapBackendData(await response.json()) as IngredientsUnit;
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
            throw new Error(getBackendErrorMessage(errorData, "Failed to delete ingredients unit"));
        }
    },
};
