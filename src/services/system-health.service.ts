import { getProxyUrl } from "../lib/proxy-utils";
import { throwBackendHttpError, unwrapBackendData } from "../utils/api/backendResponse";
import { SystemHealthReport } from "../types/api/system-health";

const BASE_PATH = "/system/health";
const REQUEST_TIMEOUT_MS = 10_000;

export type SystemHealthQuery = {
    cookie?: string;
    method?: string;
    minSamples?: number;
};

export const systemHealthService = {
    getReport: async (query: SystemHealthQuery = {}): Promise<SystemHealthReport> => {
        const url = getProxyUrl("GET", BASE_PATH);
        const params = new URLSearchParams();
        const method = query.method?.trim().toUpperCase();
        if (method && method !== "ALL") {
            params.set("method", method);
        }
        if (Number.isFinite(query.minSamples)) {
            params.set("minSamples", String(Math.max(1, Math.trunc(query.minSamples ?? 1))));
        }
        const requestUrl = params.size > 0 ? `${url}?${params.toString()}` : url!;
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };
        if (query.cookie) headers.Cookie = query.cookie;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        let response: Response;
        try {
            response = await fetch(requestUrl, {
                method: "GET",
                headers,
                credentials: "include",
                cache: "no-store",
                signal: controller.signal,
            });
        } catch (error) {
            if (error instanceof Error && error.name === "AbortError") {
                throw new Error("System health request timed out");
            }
            throw error;
        } finally {
            clearTimeout(timeout);
        }

        if (!response.ok) {
            const errorPayload = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorPayload, "Failed to fetch system health");
        }

        return unwrapBackendData<SystemHealthReport>(await response.json());
    },
};
