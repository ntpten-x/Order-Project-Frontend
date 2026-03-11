import { getProxyUrl } from "../../lib/proxy-utils";
import { Ingredients } from "../../types/api/stock/ingredients";
import {
    normalizeBackendPaginated,
    throwBackendHttpError,
    unwrapBackendData,
} from "../../utils/api/backendResponse";

const BASE_PATH = "/stock/ingredients";

const getHeaders = (cookie?: string, contentType: string = "application/json"): HeadersInit => {
    const headers: Record<string, string> = {};
    if (contentType) headers["Content-Type"] = contentType;
    if (cookie) headers.Cookie = cookie;
    return headers;
};

export const ingredientsService = {
    findAllPaginated: async (
        cookie?: string,
        searchParams?: URLSearchParams,
        options?: { signal?: AbortSignal }
    ): Promise<{ data: Ingredients[]; total: number; page: number; last_page: number }> => {
        let url = getProxyUrl("GET", BASE_PATH);
        if (searchParams) {
            url += `?${searchParams.toString()}`;
        }

        const response = await fetch(url!, {
            cache: "no-store",
            credentials: "include",
            headers: getHeaders(cookie, ""),
            signal: options?.signal,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "โหลดรายการวัตถุดิบไม่สำเร็จ");
        }

        return normalizeBackendPaginated<Ingredients>(await response.json());
    },

    findAll: async (cookie?: string, searchParams?: URLSearchParams): Promise<Ingredients[]> => {
        let url = getProxyUrl("GET", BASE_PATH);
        if (searchParams) {
            url += `?${searchParams.toString()}`;
        }

        const response = await fetch(url!, {
            cache: "no-store",
            credentials: "include",
            headers: getHeaders(cookie, ""),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "โหลดรายการวัตถุดิบไม่สำเร็จ");
        }

        return unwrapBackendData(await response.json()) as Ingredients[];
    },

    findOne: async (id: string, cookie?: string, options?: { signal?: AbortSignal }): Promise<Ingredients> => {
        const url = getProxyUrl("GET", `${BASE_PATH}/${id}`);

        const response = await fetch(url!, {
            cache: "no-store",
            credentials: "include",
            headers: getHeaders(cookie, ""),
            signal: options?.signal,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "โหลดข้อมูลวัตถุดิบไม่สำเร็จ");
        }

        return unwrapBackendData(await response.json()) as Ingredients;
    },

    create: async (data: Partial<Ingredients>, cookie?: string, csrfToken?: string): Promise<Ingredients> => {
        const url = getProxyUrl("POST", BASE_PATH);
        const headers = getHeaders(cookie) as Record<string, string>;
        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

        const response = await fetch(url!, {
            method: "POST",
            headers,
            body: JSON.stringify(data),
            credentials: "include",
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "สร้างวัตถุดิบไม่สำเร็จ");
        }

        return unwrapBackendData(await response.json()) as Ingredients;
    },

    update: async (
        id: string,
        data: Partial<Ingredients>,
        cookie?: string,
        csrfToken?: string
    ): Promise<Ingredients> => {
        const url = getProxyUrl("PUT", `${BASE_PATH}/${id}`);
        const headers = getHeaders(cookie) as Record<string, string>;
        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

        const response = await fetch(url!, {
            method: "PUT",
            headers,
            body: JSON.stringify(data),
            credentials: "include",
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "บันทึกการแก้ไขวัตถุดิบไม่สำเร็จ");
        }

        return unwrapBackendData(await response.json()) as Ingredients;
    },

    delete: async (id: string, cookie?: string, csrfToken?: string): Promise<void> => {
        const url = getProxyUrl("DELETE", `${BASE_PATH}/${id}`);
        const headers = getHeaders(cookie, "") as Record<string, string>;
        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

        const response = await fetch(url!, {
            method: "DELETE",
            headers,
            credentials: "include",
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "ลบวัตถุดิบไม่สำเร็จ");
        }
    },
};
