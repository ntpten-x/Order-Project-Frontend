import { Ingredients } from "../types/api/ingredients";
import { getProxyUrl } from "../lib/proxy-utils";

const BASE_PATH = "/ingredients";

export const ingredientsService = {
    findAll: async (): Promise<Ingredients[]> => {
        const url = getProxyUrl("GET", BASE_PATH);
        const response = await fetch(url!, { cache: "no-store" });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "Failed to fetch ingredients");
        }
        return response.json();
    },

    findOne: async (id: string): Promise<Ingredients> => {
        const url = getProxyUrl("GET", `${BASE_PATH}/${id}`);
        const response = await fetch(url!, { cache: "no-store" });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "Failed to fetch ingredient");
        }
        return response.json();
    },

    findOneByName: async (name: string): Promise<Ingredients> => {
        const url = getProxyUrl("GET", `${BASE_PATH}/name/${name}`);
        const response = await fetch(url!, { cache: "no-store" });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "Failed to fetch ingredient by name");
        }
        return response.json();
    },

    create: async (data: Partial<Ingredients>): Promise<Ingredients> => {
        const url = getProxyUrl("POST", BASE_PATH);
        const response = await fetch(url!, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "Failed to create ingredient");
        }
        return response.json();
    },

    update: async (id: string, data: Partial<Ingredients>): Promise<Ingredients> => {
        const url = getProxyUrl("PUT", `${BASE_PATH}/${id}`);
        const response = await fetch(url!, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "Failed to update ingredient");
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
            throw new Error(errorData.error || errorData.message || "Failed to delete ingredient");
        }
    },
};
