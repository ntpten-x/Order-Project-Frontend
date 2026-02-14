"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { permissionsService } from "../services/permissions.service";
import { EffectiveRolePermissionRow, PermissionAction } from "../types/api/permissions";

type UseEffectivePermissionsOptions = {
    enabled?: boolean;
};

function normalizePath(path: string): string {
    if (!path) return "/";
    if (path === "/") return path;
    return path.endsWith("/") ? path.slice(0, -1) : path;
}

function hasActionPermission(row: EffectiveRolePermissionRow | undefined, action: PermissionAction): boolean {
    if (!row) return false;
    if (action === "access") return row.canAccess;
    if (action === "view") return row.canView;
    if (action === "create") return row.canCreate;
    if (action === "update") return row.canUpdate;
    return row.canDelete;
}

export function useEffectivePermissions(options?: UseEffectivePermissionsOptions) {
    const enabled = options?.enabled ?? true;
    const { user } = useAuth();
    const [rows, setRows] = useState<EffectiveRolePermissionRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasResolvedInitial, setHasResolvedInitial] = useState(false);

    useEffect(() => {
        if (!enabled || !user?.id) {
            setRows([]);
            setError(null);
            setLoading(false);
            setHasResolvedInitial(false);
            return;
        }

        let active = true;
        setHasResolvedInitial(false);
        setLoading(true);
        setError(null);

        permissionsService
            .getUserEffectivePermissions(user.id)
            .then((data) => {
                if (!active) return;
                setRows(data.permissions ?? []);
            })
            .catch((err) => {
                if (!active) return;
                setRows([]);
                setError(err instanceof Error ? err.message : "Failed to load effective permissions");
            })
            .finally(() => {
                if (active) {
                    setLoading(false);
                    setHasResolvedInitial(true);
                }
            });

        return () => {
            active = false;
        };
    }, [enabled, user?.id]);

    const isInitialLoading = enabled && Boolean(user?.id) && !hasResolvedInitial;

    const byResource = useMemo(() => {
        const map = new Map<string, EffectiveRolePermissionRow>();
        for (const row of rows) {
            map.set(row.resourceKey, row);
        }
        return map;
    }, [rows]);

    const can = useCallback(
        (resourceKey: string, action: PermissionAction = "access"): boolean => {
            if (user?.role === "Admin") return true;
            return hasActionPermission(byResource.get(resourceKey), action);
        },
        [byResource, user?.role]
    );

    const canAny = useCallback(
        (checks: Array<{ resourceKey: string; action?: PermissionAction }>): boolean => {
            if (user?.role === "Admin") return true;
            return checks.some((check) => can(check.resourceKey, check.action ?? "access"));
        },
        [can, user?.role]
    );

    const canPath = useCallback(
        (path: string, action: PermissionAction = "access"): boolean => {
            if (user?.role === "Admin") return true;
            const normalizedPath = normalizePath(path);
            for (const row of rows) {
                const route = normalizePath(row.route || "");
                if (!route || route === "/") continue;
                if (normalizedPath === route || normalizedPath.startsWith(`${route}/`)) {
                    return hasActionPermission(row, action);
                }
            }
            return false;
        },
        [rows, user?.role]
    );

    return {
        rows,
        loading: loading || isInitialLoading,
        error,
        can,
        canAny,
        canPath,
    };
}
