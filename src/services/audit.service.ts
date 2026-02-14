import { API_ROUTES } from "../config/api";
import { getProxyUrl } from "../lib/proxy-utils";
import { AuditLog, PaginatedAuditLogs } from "../types/api/audit";
import { AuditLogSchema, AuditLogsResponseSchema } from "../schemas/api/audit.schema";
import { normalizeBackendPaginated, throwBackendHttpError, unwrapBackendData } from "../utils/api/backendResponse";

const BASE_PATH = API_ROUTES.AUDIT.LOGS;

export const auditService = {
    async getLogs(cookie?: string, searchParams?: URLSearchParams): Promise<PaginatedAuditLogs> {
        let url = getProxyUrl("GET", BASE_PATH);
        if (searchParams && Array.from(searchParams.keys()).length > 0) {
            url += `?${searchParams.toString()}`;
        }

        const headers: HeadersInit = {};
        if (cookie) headers.Cookie = cookie;

        const response = await fetch(url!, {
            headers,
            cache: "no-store",
            credentials: "include",
        });

        const json = await response.json().catch(() => ({}));

        if (!response.ok) {
            throwBackendHttpError(response, json, "Failed to fetch audit logs");
        }

        const normalized = normalizeBackendPaginated<AuditLog>(json);
        const data = AuditLogsResponseSchema.parse(
            Array.isArray(normalized.data) ? normalized.data : unwrapBackendData(json)
        );

        return {
            data,
            total: normalized.total,
            page: normalized.page,
            totalPages: normalized.last_page,
        };
    },

    async getLogById(id: string, cookie?: string): Promise<AuditLog> {
        const url = getProxyUrl("GET", `${BASE_PATH}/${id}`);
        const headers: HeadersInit = {};
        if (cookie) headers.Cookie = cookie;

        const response = await fetch(url!, {
            headers,
            cache: "no-store",
            credentials: "include",
        });

        const json = await response.json().catch(() => ({}));

        if (!response.ok) {
            throwBackendHttpError(response, json, "Failed to fetch audit log");
        }

        return AuditLogSchema.parse(unwrapBackendData(json));
    },
};
