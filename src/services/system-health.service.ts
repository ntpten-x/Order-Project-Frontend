import { getProxyUrl } from "../lib/proxy-utils";
import { throwBackendHttpError, unwrapBackendData } from "../utils/api/backendResponse";
import { SystemHealthReport } from "../types/api/system-health";

const BASE_PATH = "/system/health";

export const systemHealthService = {
    getReport: async (cookie?: string): Promise<SystemHealthReport> => {
        const url = getProxyUrl("GET", BASE_PATH);
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };
        if (cookie) headers.Cookie = cookie;

        const response = await fetch(url!, {
            method: "GET",
            headers,
            credentials: "include",
            cache: "no-store",
        });

        if (!response.ok) {
            const errorPayload = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorPayload, "Failed to fetch system health");
        }

        return unwrapBackendData<SystemHealthReport>(await response.json());
    },
};
