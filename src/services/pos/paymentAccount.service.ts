import { ShopPaymentAccount, CreatePaymentAccountDto } from "../../types/api/pos/shopPaymentAccount";
import { getProxyUrl } from "../../lib/proxy-utils";
import { getBackendErrorMessage, unwrapBackendData } from "../../utils/api/backendResponse";
// import { API_ROUTES } from "../../config/api";

// Assuming we add a new route constant or just use a hardcoded path for now if not in config
const BASE_PATH = "/pos/payment-accounts";

type BackendErrorPayload = {
    error?: {
        code?: string;
    };
};

const getErrorCode = (payload: unknown): string | undefined => {
    if (!payload || typeof payload !== "object") return undefined;
    return (payload as BackendErrorPayload).error?.code;
};

export const paymentAccountService = {
    getBasePath: (shopId?: string) => {
        const url = getProxyUrl("GET", `${BASE_PATH}/accounts`);
        return shopId ? `${url}?shopId=${shopId}` : url;
    },
    getByShopId: async (shopId?: string, cookie?: string): Promise<ShopPaymentAccount[]> => {
        let url = getProxyUrl("GET", `${BASE_PATH}/accounts`);
        if (shopId) url += `?shopId=${shopId}`;

        const headers: HeadersInit = {};
        if (cookie) headers.Cookie = cookie;

        const response = await fetch(url!, {
            cache: "no-store",
            credentials: 'include',
            headers
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const err: Error & { status?: number } = new Error(getBackendErrorMessage(errorData, "Failed to fetch accounts"));
            err.status = response.status;
            (err as Error & { code?: string }).code = getErrorCode(errorData);
            throw err;
        }

        return unwrapBackendData(await response.json()) as ShopPaymentAccount[];
    },

    create: async (data: CreatePaymentAccountDto, shopId?: string, cookie?: string, csrfToken?: string): Promise<ShopPaymentAccount> => {
        let url = getProxyUrl("POST", `${BASE_PATH}/accounts`);
        if (shopId) url += `?shopId=${shopId}`;

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
            const err: Error & { status?: number } = new Error(getBackendErrorMessage(errorData, "Failed to create account"));
            err.status = response.status;
            (err as Error & { code?: string }).code = getErrorCode(errorData);
            throw err;
        }
        return unwrapBackendData(await response.json()) as ShopPaymentAccount;
    },

    update: async (id: string, data: Partial<CreatePaymentAccountDto>, shopId?: string, cookie?: string, csrfToken?: string): Promise<ShopPaymentAccount> => {
        let url = getProxyUrl("PUT", `${BASE_PATH}/accounts/${id}`);
        if (shopId) url += `?shopId=${shopId}`;

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
            const err: Error & { status?: number } = new Error(getBackendErrorMessage(errorData, "Failed to update account"));
            err.status = response.status;
            (err as Error & { code?: string }).code = getErrorCode(errorData);
            throw err;
        }
        return unwrapBackendData(await response.json()) as ShopPaymentAccount;
    },

    activate: async (id: string, shopId?: string, cookie?: string, csrfToken?: string): Promise<ShopPaymentAccount> => {
        let url = getProxyUrl("PATCH", `${BASE_PATH}/accounts/${id}/activate`);
        if (shopId) url += `?shopId=${shopId}`;

        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (cookie) headers.Cookie = cookie;
        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

        const response = await fetch(url!, {
            method: "PATCH",
            headers,
            body: JSON.stringify({}),
            credentials: 'include'
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const err: Error & { status?: number } = new Error(getBackendErrorMessage(errorData, "Failed to activate account"));
            err.status = response.status;
            (err as Error & { code?: string }).code = getErrorCode(errorData);
            throw err;
        }
        return unwrapBackendData(await response.json()) as ShopPaymentAccount;
    },

    delete: async (id: string, shopId?: string, cookie?: string, csrfToken?: string): Promise<void> => {
        let url = getProxyUrl("DELETE", `${BASE_PATH}/accounts/${id}`);
        if (shopId) url += `?shopId=${shopId}`;

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
            const err: Error & { status?: number } = new Error(getBackendErrorMessage(errorData, "Failed to delete account"));
            err.status = response.status;
            (err as Error & { code?: string }).code = getErrorCode(errorData);
            throw err;
        }
    }
};
