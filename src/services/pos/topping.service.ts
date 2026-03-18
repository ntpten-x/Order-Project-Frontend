import { Topping } from "../../types/api/pos/topping";
import { getProxyUrl } from "../../lib/proxy-utils";
import { normalizeBackendPaginated, throwBackendHttpError, unwrapBackendData } from "../../utils/api/backendResponse";

const BASE_PATH = "/pos/topping";
type ToppingMutationPayload = Partial<Topping> & { category_ids?: string[]; topping_group_ids?: string[] };

export const toppingService = {
    findAllPaginated: async (
        cookie?: string,
        searchParams?: URLSearchParams
    ): Promise<{ data: Topping[]; total: number; page: number; last_page: number }> => {
        let url = getProxyUrl("GET", BASE_PATH);
        if (searchParams) {
            url += `?${searchParams.toString()}`;
        }

        const headers: HeadersInit = {};
        if (cookie) headers.Cookie = cookie;

        const response = await fetch(url!, {
            cache: "no-store",
            credentials: "include",
            headers,
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "Failed to fetch toppings");
        }
        return normalizeBackendPaginated<Topping>(await response.json());
    },

    findAll: async (cookie?: string, searchParams?: URLSearchParams): Promise<Topping[]> => {
        let url = getProxyUrl("GET", BASE_PATH);
        if (searchParams) {
            url += `?${searchParams.toString()}`;
        }

        const headers: HeadersInit = {};
        if (cookie) headers.Cookie = cookie;

        const response = await fetch(url!, {
            cache: "no-store",
            credentials: "include",
            headers,
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "Failed to fetch toppings");
        }
        return unwrapBackendData(await response.json()) as Topping[];
    },

    findOne: async (id: string, cookie?: string): Promise<Topping> => {
        const url = getProxyUrl("GET", `${BASE_PATH}/${id}`);
        const headers: HeadersInit = {};
        if (cookie) headers.Cookie = cookie;

        const response = await fetch(url!, {
            cache: "no-store",
            credentials: "include",
            headers,
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "Failed to fetch topping");
        }
        return unwrapBackendData(await response.json()) as Topping;
    },

    findOneByName: async (name: string, cookie?: string): Promise<Topping> => {
        const url = getProxyUrl("GET", `${BASE_PATH}/name/${name}`);
        const headers: HeadersInit = {};
        if (cookie) headers.Cookie = cookie;

        const response = await fetch(url!, {
            cache: "no-store",
            credentials: "include",
            headers,
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "Failed to fetch topping by name");
        }
        return unwrapBackendData(await response.json()) as Topping;
    },

    create: async (data: ToppingMutationPayload, cookie?: string, csrfToken?: string): Promise<Topping> => {
        const url = getProxyUrl("POST", BASE_PATH);
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (cookie) headers.Cookie = cookie;
        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

        const response = await fetch(url!, {
            method: "POST",
            headers,
            body: JSON.stringify(data),
            credentials: "include",
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "Failed to create topping");
        }
        return unwrapBackendData(await response.json()) as Topping;
    },

    update: async (id: string, data: ToppingMutationPayload, cookie?: string, csrfToken?: string): Promise<Topping> => {
        const url = getProxyUrl("PUT", `${BASE_PATH}/${id}`);
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (cookie) headers.Cookie = cookie;
        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

        const response = await fetch(url!, {
            method: "PUT",
            headers,
            body: JSON.stringify(data),
            credentials: "include",
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "Failed to update topping");
        }
        return unwrapBackendData(await response.json()) as Topping;
    },

    delete: async (id: string, cookie?: string, csrfToken?: string): Promise<void> => {
        const url = getProxyUrl("DELETE", `${BASE_PATH}/${id}`);
        const headers: Record<string, string> = {};
        if (cookie) headers.Cookie = cookie;
        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

        const response = await fetch(url!, {
            method: "DELETE",
            headers,
            credentials: "include",
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "Failed to delete topping");
        }
    },
};
