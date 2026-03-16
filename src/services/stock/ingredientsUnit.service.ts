import { getProxyUrl } from "../../lib/proxy-utils";
import { IngredientsUnit } from "../../types/api/stock/ingredientsUnit";
import {
    normalizeBackendPaginated,
    throwBackendHttpError,
    unwrapBackendData,
} from "../../utils/api/backendResponse";

const BASE_PATH = "/stock/ingredientsUnit";

const getHeaders = (cookie?: string, contentType: string = "application/json"): HeadersInit => {
    const headers: Record<string, string> = {};
    if (contentType) headers["Content-Type"] = contentType;
    if (cookie) headers.Cookie = cookie;
    return headers;
};

export const ingredientsUnitService = {
    findAllPaginated: async (
        cookie?: string,
        searchParams?: URLSearchParams,
        options?: { signal?: AbortSignal }
    ): Promise<{ data: IngredientsUnit[]; total: number; page: number; last_page: number }> => {
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
            throwBackendHttpError(response, errorData, "โหลดรายการหน่วยนับวัตถุดิบไม่สำเร็จ");
        }

        return normalizeBackendPaginated<IngredientsUnit>(await response.json());
    },

    findAll: async (cookie?: string, searchParams?: URLSearchParams): Promise<IngredientsUnit[]> => {
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
            throwBackendHttpError(response, errorData, "โหลดรายการหน่วยนับวัตถุดิบไม่สำเร็จ");
        }

        return unwrapBackendData(await response.json()) as IngredientsUnit[];
    },

    findOne: async (id: string, cookie?: string, options?: { signal?: AbortSignal }): Promise<IngredientsUnit> => {
        const url = getProxyUrl("GET", `${BASE_PATH}/${id}`);

        const response = await fetch(url!, {
            cache: "no-store",
            credentials: "include",
            headers: getHeaders(cookie, ""),
            signal: options?.signal,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "โหลดข้อมูลหน่วยนับวัตถุดิบไม่สำเร็จ");
        }

        return unwrapBackendData(await response.json()) as IngredientsUnit;
    },

    create: async (data: Partial<IngredientsUnit>, cookie?: string, csrfToken?: string): Promise<IngredientsUnit> => {
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
            throwBackendHttpError(response, errorData, "สร้างหน่วยนับวัตถุดิบไม่สำเร็จ");
        }

        return unwrapBackendData(await response.json()) as IngredientsUnit;
    },

    update: async (
        id: string,
        data: Partial<IngredientsUnit>,
        cookie?: string,
        csrfToken?: string
    ): Promise<IngredientsUnit> => {
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
            throwBackendHttpError(response, errorData, "บันทึกการแก้ไขหน่วยนับวัตถุดิบไม่สำเร็จ");
        }

        return unwrapBackendData(await response.json()) as IngredientsUnit;
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
            throwBackendHttpError(response, errorData, "ลบหน่วยนับวัตถุดิบไม่สำเร็จ");
        }
    },
};
