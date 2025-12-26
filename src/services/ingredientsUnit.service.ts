import { IngredientsUnit } from "../types/api/ingredientsUnit";
import { getProxyUrl } from "../lib/proxy-utils";

const BASE_PATH = "/ingredientsUnit";

export const ingredientsUnitService = {
    findAll: async (cookie?: string): Promise<IngredientsUnit[]> => {
        const url = getProxyUrl("GET", BASE_PATH);
        const headers: HeadersInit = {};
        if (cookie) headers.Cookie = cookie;

        const response = await fetch(url!, {
            cache: "no-store",
            headers
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "Failed to fetch ingredients units");
        }
        return response.json();
    },

    findOne: async (id: string, cookie?: string): Promise<IngredientsUnit> => {
        const url = getProxyUrl("GET", `${BASE_PATH}/${id}`);
        const headers: HeadersInit = {};
        if (cookie) headers.Cookie = cookie;

        const response = await fetch(url!, {
            cache: "no-store",
            headers
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "Failed to fetch ingredients unit");
        }
        return response.json();
    },

    findOneByUnitName: async (name: string, cookie?: string): Promise<IngredientsUnit> => {
        const url = getProxyUrl("GET", `${BASE_PATH}/unit_name/${name}`);
        const headers: HeadersInit = {};
        if (cookie) headers.Cookie = cookie;

        const response = await fetch(url!, {
            cache: "no-store",
            headers
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "Failed to fetch ingredients unit by name");
        }
        return response.json();
    },

    create: async (data: Partial<IngredientsUnit>, cookie?: string): Promise<IngredientsUnit> => {
        const url = getProxyUrl("POST", BASE_PATH);
        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (cookie) headers.Cookie = cookie;

        const response = await fetch(url!, {
            method: "POST",
            headers,
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "Failed to create ingredients unit");
        }
        return response.json();
    },

    update: async (id: string, data: Partial<IngredientsUnit>, cookie?: string): Promise<IngredientsUnit> => {
        const url = getProxyUrl("PUT", `${BASE_PATH}/${id}`);
        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (cookie) headers.Cookie = cookie;

        const response = await fetch(url!, {
            method: "PUT",
            headers,
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "Failed to update ingredients unit");
        }
        return response.json();
    },

    delete: async (id: string, cookie?: string): Promise<void> => {
        const url = getProxyUrl("DELETE", `${BASE_PATH}/${id}`);
        const headers: HeadersInit = {};
        if (cookie) headers.Cookie = cookie;

        const response = await fetch(url!, {
            method: "DELETE",
            headers
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "Failed to delete ingredients unit");
        }
    },
};
