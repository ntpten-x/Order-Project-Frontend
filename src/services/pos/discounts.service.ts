import { Discounts } from "../../types/api/pos/discounts";
import { getProxyUrl } from "../../lib/proxy-utils";
import { API_ROUTES } from "../../config/api";
import { normalizeBackendPaginated, throwBackendHttpError, unwrapBackendData } from "../../utils/api/backendResponse";
import { withInflightDedup } from "../../utils/api/inflight";

const BASE_PATH = API_ROUTES.POS.DISCOUNTS;
const DISCOUNT_CACHE_TTL_MS = 60_000;

type DiscountListCacheEntry = {
    ts: number;
    data: Discounts[];
};

const discountListCache = new Map<string, DiscountListCacheEntry>();

const getHeaders = (cookie?: string, contentType: string = "application/json"): HeadersInit => {
    const headers: Record<string, string> = {};
    if (contentType) headers["Content-Type"] = contentType;
    if (cookie) headers.Cookie = cookie;
    return headers;
};

const normalizeDiscountList = (json: unknown): Discounts[] => {
    if (Array.isArray(json)) {
        return json as Discounts[];
    }

    if (json && typeof json === "object" && !Array.isArray(json)) {
        const record = json as Record<string, unknown>;

        if (record.success === true && Array.isArray(record.data)) {
            return record.data as Discounts[];
        }

        if (Array.isArray(record.data)) {
            return record.data as Discounts[];
        }

        if (record.success === true && record.data && typeof record.data === "object" && !Array.isArray(record.data)) {
            const data = record.data as Record<string, unknown>;
            if (data.id && data.display_name) {
                return [data as unknown as Discounts];
            }
        }

        if (record.id && record.display_name) {
            return [record as unknown as Discounts];
        }
    }

    return [];
};

export const discountsService = {
    getAllPaginated: async (
        cookie?: string,
        searchParams?: URLSearchParams
    ): Promise<{ data: Discounts[]; total: number; page: number; last_page: number }> => {
        let url = getProxyUrl("GET", BASE_PATH);
        const params = new URLSearchParams(searchParams || "");
        if (params.toString()) {
            url += `?${params.toString()}`;
        }
        const headers = getHeaders(cookie, "");

        const response = await fetch(url!, {
            cache: "no-store",
            headers,
            credentials: "include"
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "Unable to load discounts");
        }

        return normalizeBackendPaginated<Discounts>(await response.json());
    },

    getAll: async (cookie?: string, searchParams?: URLSearchParams): Promise<Discounts[]> => {
        const params = new URLSearchParams(searchParams || "");
        const cacheKey = `${cookie ?? "client"}:${params.toString()}`;
        const cached = discountListCache.get(cacheKey);
        if (cached && Date.now() - cached.ts < DISCOUNT_CACHE_TTL_MS) {
            return cached.data;
        }

        return withInflightDedup(`discounts:getAll:${cacheKey}`, async () => {
            let url = getProxyUrl("GET", BASE_PATH);
            if (params.toString()) {
                url += `?${params.toString()}`;
            }
            const headers = getHeaders(cookie, "");

            const response = await fetch(url!, {
                cache: "no-store",
                headers,
                credentials: "include"
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throwBackendHttpError(response, errorData, "Unable to load discounts");
            }

            const payload = normalizeDiscountList(await response.json());
            discountListCache.set(cacheKey, { ts: Date.now(), data: payload });
            return payload;
        });
    },

    getById: async (id: string, cookie?: string): Promise<Discounts> => {
        const url = getProxyUrl("GET", `${BASE_PATH}/${id}`);
        const headers = getHeaders(cookie, "");

        const response = await fetch(url!, {
            cache: "no-store",
            headers,
            credentials: "include"
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "Unable to load discount");
        }
        return unwrapBackendData(await response.json()) as Discounts;
    },

    getByName: async (name: string, cookie?: string): Promise<Discounts> => {
        const url = getProxyUrl("GET", `${BASE_PATH}/name/${encodeURIComponent(name)}`);
        const headers = getHeaders(cookie, "");

        const response = await fetch(url!, {
            cache: "no-store",
            headers,
            credentials: "include"
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "Unable to load discount");
        }
        return unwrapBackendData(await response.json()) as Discounts;
    },

    create: async (data: Partial<Discounts>, cookie?: string, csrfToken?: string): Promise<Discounts> => {
        const url = getProxyUrl("POST", BASE_PATH);
        const headers = getHeaders(cookie) as Record<string, string>;
        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

        const response = await fetch(url!, {
            method: "POST",
            headers,
            credentials: "include",
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "Unable to create discount");
        }
        const payload = unwrapBackendData(await response.json()) as Discounts;
        discountListCache.clear();
        return payload;
    },

    update: async (id: string, data: Partial<Discounts>, cookie?: string, csrfToken?: string): Promise<Discounts> => {
        const url = getProxyUrl("PUT", `${BASE_PATH}/${id}`);
        const headers = getHeaders(cookie) as Record<string, string>;
        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

        const response = await fetch(url!, {
            method: "PUT",
            headers,
            credentials: "include",
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "Unable to update discount");
        }
        const payload = unwrapBackendData(await response.json()) as Discounts;
        discountListCache.clear();
        return payload;
    },

    delete: async (id: string, cookie?: string, csrfToken?: string): Promise<void> => {
        const url = getProxyUrl("DELETE", `${BASE_PATH}/${id}`);
        const headers = getHeaders(cookie, "");
        if (csrfToken) (headers as Record<string, string>)["X-CSRF-Token"] = csrfToken;

        const response = await fetch(url!, {
            method: "DELETE",
            headers,
            credentials: "include"
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "Unable to delete discount");
        }
        discountListCache.clear();
    }
};
