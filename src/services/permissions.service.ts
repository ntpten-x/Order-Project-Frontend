import { getProxyUrl } from "../lib/proxy-utils";
import {
    EffectiveRolePermissionsResponse,
    EffectiveUserPermissionsResponse,
    PermissionAuditItem,
    PermissionOverrideApprovalItem,
    PermissionOverrideApprovalsQuery,
    ReviewOverrideApprovalPayload,
    ReviewOverrideApprovalResult,
    SimulatePermissionPayload,
    SimulatePermissionResult,
    UpdateUserPermissionsPayload,
    UpdateUserPermissionsResult,
} from "../types/api/permissions";
import { normalizeBackendPaginated, throwBackendHttpError, unwrapBackendData } from "../utils/api/backendResponse";

const BASE_PATH = "/permissions";
const EFFECTIVE_CACHE_TTL_MS = 5 * 60 * 1000;
const AUDIT_CACHE_TTL_MS = 30 * 1000;
const APPROVAL_CACHE_TTL_MS = 15 * 1000;

type PermissionAuditsQuery = {
    targetType?: "role" | "user";
    targetId?: string;
    actionType?: string;
    actorUserId?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
};

type Paginated<T> = { data: T[]; total: number; page: number; last_page: number };

type CacheEntry<T> = {
    value: T;
    expiresAt: number;
};

const roleEffectiveCache = new Map<string, CacheEntry<EffectiveRolePermissionsResponse>>();
const userEffectiveCache = new Map<string, CacheEntry<EffectiveUserPermissionsResponse>>();
const auditsCache = new Map<string, CacheEntry<Paginated<PermissionAuditItem>>>();
const approvalsCache = new Map<string, CacheEntry<Paginated<PermissionOverrideApprovalItem>>>();

function readCache<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
    const hit = cache.get(key);
    if (!hit) return null;
    if (Date.now() > hit.expiresAt) {
        cache.delete(key);
        return null;
    }
    return hit.value;
}

function writeCache<T>(cache: Map<string, CacheEntry<T>>, key: string, value: T, ttlMs: number) {
    cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

function invalidatePermissionCache(opts?: { userId?: string; roleId?: string }) {
    if (opts?.userId) userEffectiveCache.delete(`user:${opts.userId}`);
    if (opts?.roleId) roleEffectiveCache.delete(`role:${opts.roleId}`);

    if (!opts?.userId && !opts?.roleId) {
        userEffectiveCache.clear();
        roleEffectiveCache.clear();
    }

    auditsCache.clear();
    approvalsCache.clear();
}

function auditCacheKey(params?: PermissionAuditsQuery) {
    return JSON.stringify({
        targetType: params?.targetType || "",
        targetId: params?.targetId || "",
        actionType: params?.actionType || "",
        actorUserId: params?.actorUserId || "",
        from: params?.from || "",
        to: params?.to || "",
        page: params?.page || 1,
        limit: params?.limit || 0,
    });
}

function approvalsCacheKey(params?: PermissionOverrideApprovalsQuery) {
    return JSON.stringify({
        status: params?.status || "",
        targetUserId: params?.targetUserId || "",
        requestedByUserId: params?.requestedByUserId || "",
        page: params?.page || 1,
        limit: params?.limit || 0,
    });
}

export const permissionsService = {
    getRoleEffectivePermissions: async (roleId: string, cookie?: string): Promise<EffectiveRolePermissionsResponse> => {
        const cacheKey = `role:${roleId}`;
        if (!cookie) {
            const cached = readCache(roleEffectiveCache, cacheKey);
            if (cached) return cached;
        }

        const url = getProxyUrl("GET", `${BASE_PATH}/roles/${roleId}/effective`);
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };
        if (cookie) headers["Cookie"] = cookie;

        const response = await fetch(url!, {
            method: "GET",
            headers,
            credentials: "include",
            cache: "no-store",
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "Failed to fetch role permissions");
        }

        const data = unwrapBackendData(await response.json()) as EffectiveRolePermissionsResponse;
        if (!cookie) {
            writeCache(roleEffectiveCache, cacheKey, data, EFFECTIVE_CACHE_TTL_MS);
        }
        return data;
    },

    getUserEffectivePermissions: async (userId: string, cookie?: string): Promise<EffectiveUserPermissionsResponse> => {
        const cacheKey = `user:${userId}`;
        if (!cookie) {
            const cached = readCache(userEffectiveCache, cacheKey);
            if (cached) return cached;
        }

        const url = getProxyUrl("GET", `${BASE_PATH}/users/${userId}/effective`);
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };
        if (cookie) headers["Cookie"] = cookie;

        const response = await fetch(url!, {
            method: "GET",
            headers,
            credentials: "include",
            cache: "no-store",
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "Failed to fetch user permissions");
        }

        const data = unwrapBackendData(await response.json()) as EffectiveUserPermissionsResponse;
        if (!cookie) {
            writeCache(userEffectiveCache, cacheKey, data, EFFECTIVE_CACHE_TTL_MS);
        }
        return data;
    },

    updateUserPermissions: async (
        userId: string,
        payload: UpdateUserPermissionsPayload,
        csrfToken?: string,
        cookie?: string
    ): Promise<UpdateUserPermissionsResult> => {
        const url = getProxyUrl("PUT", `${BASE_PATH}/users/${userId}`);
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };
        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;
        if (cookie) headers["Cookie"] = cookie;

        const response = await fetch(url!, {
            method: "PUT",
            headers,
            credentials: "include",
            cache: "no-store",
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "Failed to update user permissions");
        }

        const data = unwrapBackendData(await response.json()) as UpdateUserPermissionsResult;
        if (data.updated && !data.approvalRequired) {
            invalidatePermissionCache({ userId });
        }
        if (!data.updated && data.approvalRequired) {
            auditsCache.clear();
            approvalsCache.clear();
        }
        return data;
    },

    simulatePermission: async (
        payload: SimulatePermissionPayload,
        cookie?: string
    ): Promise<SimulatePermissionResult> => {
        const url = getProxyUrl("POST", `${BASE_PATH}/simulate`);
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };
        if (cookie) headers["Cookie"] = cookie;

        const response = await fetch(url!, {
            method: "POST",
            headers,
            credentials: "include",
            cache: "no-store",
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "Failed to simulate permission");
        }

        return unwrapBackendData(await response.json()) as SimulatePermissionResult;
    },

    getPermissionAudits: async (
        params?: PermissionAuditsQuery,
        cookie?: string
    ): Promise<Paginated<PermissionAuditItem>> => {
        const cacheKey = auditCacheKey(params);
        if (!cookie) {
            const cached = readCache(auditsCache, cacheKey);
            if (cached) return cached;
        }

        const url = getProxyUrl("GET", `${BASE_PATH}/audits`);
        const query = new URLSearchParams();
        if (params?.targetType) query.set("targetType", params.targetType);
        if (params?.targetId) query.set("targetId", params.targetId);
        if (params?.actionType) query.set("actionType", params.actionType);
        if (params?.actorUserId) query.set("actorUserId", params.actorUserId);
        if (params?.from) query.set("from", params.from);
        if (params?.to) query.set("to", params.to);
        if (params?.page) query.set("page", String(params.page));
        if (params?.limit) query.set("limit", String(params.limit));

        const headers: Record<string, string> = {};
        if (cookie) headers["Cookie"] = cookie;

        const response = await fetch(query.toString() ? `${url}?${query}` : url!, {
            method: "GET",
            headers,
            credentials: "include",
            cache: "no-store",
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "Failed to fetch permission audits");
        }

        const data = normalizeBackendPaginated<PermissionAuditItem>(await response.json());
        if (!cookie) {
            writeCache(auditsCache, cacheKey, data, AUDIT_CACHE_TTL_MS);
        }
        return data;
    },

    getOverrideApprovals: async (
        params?: PermissionOverrideApprovalsQuery,
        cookie?: string
    ): Promise<Paginated<PermissionOverrideApprovalItem>> => {
        const cacheKey = approvalsCacheKey(params);
        if (!cookie) {
            const cached = readCache(approvalsCache, cacheKey);
            if (cached) return cached;
        }

        const url = getProxyUrl("GET", `${BASE_PATH}/approvals`);
        const query = new URLSearchParams();
        if (params?.status) query.set("status", params.status);
        if (params?.targetUserId) query.set("targetUserId", params.targetUserId);
        if (params?.requestedByUserId) query.set("requestedByUserId", params.requestedByUserId);
        if (params?.page) query.set("page", String(params.page));
        if (params?.limit) query.set("limit", String(params.limit));

        const headers: Record<string, string> = {};
        if (cookie) headers["Cookie"] = cookie;

        const response = await fetch(query.toString() ? `${url}?${query}` : url!, {
            method: "GET",
            headers,
            credentials: "include",
            cache: "no-store",
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "Failed to fetch override approvals");
        }

        const data = normalizeBackendPaginated<PermissionOverrideApprovalItem>(await response.json());
        if (!cookie) {
            writeCache(approvalsCache, cacheKey, data, APPROVAL_CACHE_TTL_MS);
        }
        return data;
    },

    approveOverride: async (
        approvalId: string,
        payload?: ReviewOverrideApprovalPayload,
        csrfToken?: string,
        cookie?: string
    ): Promise<ReviewOverrideApprovalResult> => {
        const url = getProxyUrl("POST", `${BASE_PATH}/approvals/${approvalId}/approve`);
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };
        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;
        if (cookie) headers["Cookie"] = cookie;

        const response = await fetch(url!, {
            method: "POST",
            headers,
            credentials: "include",
            cache: "no-store",
            body: JSON.stringify(payload ?? {}),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "Failed to approve override request");
        }

        const data = unwrapBackendData(await response.json()) as ReviewOverrideApprovalResult;
        invalidatePermissionCache({ userId: data.targetUserId });
        return data;
    },

    rejectOverride: async (
        approvalId: string,
        payload: ReviewOverrideApprovalPayload,
        csrfToken?: string,
        cookie?: string
    ): Promise<ReviewOverrideApprovalResult> => {
        const url = getProxyUrl("POST", `${BASE_PATH}/approvals/${approvalId}/reject`);
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };
        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;
        if (cookie) headers["Cookie"] = cookie;

        const response = await fetch(url!, {
            method: "POST",
            headers,
            credentials: "include",
            cache: "no-store",
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "Failed to reject override request");
        }

        const data = unwrapBackendData(await response.json()) as ReviewOverrideApprovalResult;
        auditsCache.clear();
        approvalsCache.clear();
        return data;
    },

    clearCache: () => {
        invalidatePermissionCache();
    },
};
