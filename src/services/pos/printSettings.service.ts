import { getProxyUrl } from "../../lib/proxy-utils";
import {
    throwBackendHttpError,
    unwrapBackendData,
} from "../../utils/api/backendResponse";
import { BranchPrintSettings } from "../../types/api/pos/printSettings";

const BASE_PATH = "/pos/print-settings";

const getHeaders = (cookie?: string, contentType: string = "application/json"): HeadersInit => {
    const headers: Record<string, string> = {};
    if (contentType) headers["Content-Type"] = contentType;
    if (cookie) headers.Cookie = cookie;
    return headers;
};

export const printSettingsService = {
    getSettings: async (cookie?: string): Promise<BranchPrintSettings> => {
        const url = getProxyUrl("GET", BASE_PATH);
        const response = await fetch(url!, {
            cache: "no-store",
            credentials: "include",
            headers: getHeaders(cookie, ""),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "Unable to load print settings");
        }

        return unwrapBackendData(await response.json()) as BranchPrintSettings;
    },

    updateSettings: async (
        payload: BranchPrintSettings,
        cookie?: string,
        csrfToken?: string
    ): Promise<BranchPrintSettings> => {
        const url = getProxyUrl("PUT", BASE_PATH);
        const headers = getHeaders(cookie) as Record<string, string>;
        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

        const response = await fetch(url!, {
            method: "PUT",
            credentials: "include",
            headers,
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "Unable to save print settings");
        }

        return unwrapBackendData(await response.json()) as BranchPrintSettings;
    },
};

