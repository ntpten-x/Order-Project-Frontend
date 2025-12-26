import { IngredientsUnit } from "../types/api/ingredientsUnit";
import { getProxyUrl } from "../lib/proxy-utils";

const BASE_PATH = "/ingredientsUnit";

export const ingredientsUnitService = {
    findAll: async (): Promise<IngredientsUnit[]> => {
        const url = getProxyUrl("GET", BASE_PATH);
        const response = await fetch(url!, { cache: "no-store" });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "Failed to fetch ingredients units");
        }
        return response.json();
    },

    findOne: async (id: string): Promise<IngredientsUnit> => {
        const url = getProxyUrl("GET", `${BASE_PATH}/${id}`);
        const response = await fetch(url!, { cache: "no-store" });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "Failed to fetch ingredients unit");
        }
        return response.json();
    },

    findOneByUnitName: async (name: string): Promise<IngredientsUnit> => {
        const url = getProxyUrl("GET", `${BASE_PATH}/unit_name/${name}`);
        const response = await fetch(url!, { cache: "no-store" });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "Failed to fetch ingredients unit by name");
        }
        return response.json();
    },

    create: async (data: Partial<IngredientsUnit>): Promise<IngredientsUnit> => {
        const url = getProxyUrl("POST", BASE_PATH);
        const response = await fetch(url!, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "Failed to create ingredients unit");
        }
        return response.json();
    },

    update: async (id: string, data: Partial<IngredientsUnit>): Promise<IngredientsUnit> => {
        const url = getProxyUrl("PUT", `${BASE_PATH}/${id}`);
        const response = await fetch(url!, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "Failed to update ingredients unit");
        }
        return response.json();
    },

    delete: async (id: string): Promise<void> => {
        const url = getProxyUrl("DELETE", `${BASE_PATH}/${id}`);
        const response = await fetch(url!, {
            method: "DELETE",
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "Failed to delete ingredients unit");
        }
    },
};
