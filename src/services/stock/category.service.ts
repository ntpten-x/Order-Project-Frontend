import { getProxyUrl } from "../../lib/proxy-utils";
import { StockCategory } from "../../types/api/stock/category";
import {
    normalizeBackendPaginated,
    throwBackendHttpError,
    unwrapBackendData,
} from "../../utils/api/backendResponse";

const BASE_PATH = "/stock/category";

const getHeaders = (cookie?: string, contentType: string = "application/json"): HeadersInit => {
    const headers: Record<string, string> = {};
    if (contentType) headers["Content-Type"] = contentType;
    if (cookie) headers.Cookie = cookie;
    return headers;
};

export const stockCategoryService = {
    findAllPaginated: async (
        cookie?: string,
        searchParams?: URLSearchParams,
        options?: { signal?: AbortSignal }
    ): Promise<{ data: StockCategory[]; total: number; page: number; last_page: number }> => {
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
            throwBackendHttpError(response, errorData, "โหลดหมวดหมู่วัตถุดิบไม่สำเร็จ");
        }

        return normalizeBackendPaginated<StockCategory>(await response.json());
    },

    findAll: async (cookie?: string, searchParams?: URLSearchParams): Promise<StockCategory[]> => {
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
            throwBackendHttpError(response, errorData, "โหลดหมวดหมู่วัตถุดิบไม่สำเร็จ");
        }

        return unwrapBackendData(await response.json()) as StockCategory[];
    },

    findOne: async (id: string, cookie?: string, options?: { signal?: AbortSignal }): Promise<StockCategory> => {
        const url = getProxyUrl("GET", `${BASE_PATH}/${id}`);

        const response = await fetch(url!, {
            cache: "no-store",
            credentials: "include",
            headers: getHeaders(cookie, ""),
            signal: options?.signal,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "โหลดข้อมูลหมวดหมู่วัตถุดิบไม่สำเร็จ");
        }

        return unwrapBackendData(await response.json()) as StockCategory;
    },

    create: async (data: Partial<StockCategory>, cookie?: string, csrfToken?: string): Promise<StockCategory> => {
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
            throwBackendHttpError(response, errorData, "สร้างหมวดหมู่วัตถุดิบไม่สำเร็จ");
        }

        return unwrapBackendData(await response.json()) as StockCategory;
    },

    update: async (
        id: string,
        data: Partial<StockCategory>,
        cookie?: string,
        csrfToken?: string
    ): Promise<StockCategory> => {
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
            throwBackendHttpError(response, errorData, "บันทึกหมวดหมู่วัตถุดิบไม่สำเร็จ");
        }

        return unwrapBackendData(await response.json()) as StockCategory;
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
            throwBackendHttpError(response, errorData, "ลบหมวดหมู่วัตถุดิบไม่สำเร็จ");
        }
    },
};
