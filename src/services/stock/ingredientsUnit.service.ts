import { getProxyUrl } from "../../lib/proxy-utils";
import { IngredientsUnit } from "../../types/api/stock/ingredientsUnit";
import {
    normalizeBackendPaginated,
    throwBackendHttpError,
    unwrapBackendData,
} from "../../utils/api/backendResponse";

const BASE_PATH = "/stock/ingredientsUnit";

function getListPath(): string {
    return typeof window !== "undefined" ? `${BASE_PATH}/getAll` : BASE_PATH;
}

function getDetailPath(id: string): string {
    return typeof window !== "undefined" ? `${BASE_PATH}/getById/${id}` : `${BASE_PATH}/${id}`;
}

function getCreatePath(): string {
    return typeof window !== "undefined" ? `${BASE_PATH}/create` : BASE_PATH;
}

function getUpdatePath(id: string): string {
    return typeof window !== "undefined" ? `${BASE_PATH}/update/${id}` : `${BASE_PATH}/${id}`;
}

function getDeletePath(id: string): string {
    return typeof window !== "undefined" ? `${BASE_PATH}/delete/${id}` : `${BASE_PATH}/${id}`;
}

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
        let url = getProxyUrl("GET", getListPath());
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
        let url = getProxyUrl("GET", getListPath());
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
        const url = getProxyUrl("GET", getDetailPath(id));

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
        const url = getProxyUrl("POST", getCreatePath());
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
        const url = getProxyUrl("PUT", getUpdatePath(id));
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
        const url = getProxyUrl("DELETE", getDeletePath(id));
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
