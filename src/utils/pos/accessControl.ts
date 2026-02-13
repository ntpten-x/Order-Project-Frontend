import { useEffect, useRef } from "react";
import { message } from "antd";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { useEffectivePermissions } from "../../hooks/useEffectivePermissions";
import type { User } from "../../types/api/auth";
import type { Role } from "../../lib/rbac/policy";
import { asRole } from "../../lib/rbac/policy";
import { inferPermissionFromPath, type PermissionRequirement } from "../../lib/rbac/page-permissions";

export type AccessStatus = "checking" | "authorized" | "unauthenticated" | "unauthorized";

export function getAccessStatus(
    user: User | null,
    authLoading: boolean,
    allowedRoles?: Role[],
    permissionCheck?: {
        required: boolean;
        loading: boolean;
        allowed: boolean;
    }
): AccessStatus {
    if (authLoading) return "checking";
    if (permissionCheck?.loading) return "checking";
    if (!user) return "unauthenticated";
    if (permissionCheck?.required) {
        return permissionCheck.allowed ? "authorized" : "unauthorized";
    }
    if (allowedRoles && allowedRoles.length > 0) {
        const role = asRole(user.role);
        if (!role) return "unauthorized";
        if (!(allowedRoles.includes(role) || role === "Admin")) return "unauthorized";
    }
    return "authorized";
}

type GuardOptions = {
    allowedRoles?: Role[];
    requiredRole?: Role;
    requiredPermission?: PermissionRequirement;
    requiredAnyPermissions?: PermissionRequirement[];
    redirectUnauthenticated?: string;
    redirectUnauthorized?: string;
    unauthorizedMessage?: string;
};

export function useRoleGuard({
    allowedRoles,
    requiredRole,
    requiredPermission,
    requiredAnyPermissions,
    redirectUnauthenticated = "/login",
    redirectUnauthorized = "/pos",
    unauthorizedMessage = "You do not have permission to access this page.",
}: GuardOptions = {}) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, loading: authLoading } = useAuth();
    const { can, canAny, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });

    const inferredPermission: PermissionRequirement | undefined =
        requiredPermission ?? inferPermissionFromPath(pathname);
    const hasRequiredAny = Boolean(requiredAnyPermissions && requiredAnyPermissions.length > 0);

    const finalAllowedRoles: Role[] | undefined =
        inferredPermission || hasRequiredAny
            ? undefined
            : allowedRoles && allowedRoles.length > 0
                ? allowedRoles
                : requiredRole
                    ? [requiredRole]
                    : undefined;

    const permissionCheck = hasRequiredAny
        ? {
            required: true,
            loading: permissionLoading,
            allowed: canAny(
                (requiredAnyPermissions || []).map((item) => ({
                    resourceKey: item.resourceKey,
                    action: item.action ?? "view",
                }))
            ),
        }
        : inferredPermission
            ? {
                required: true,
                loading: permissionLoading,
                allowed: can(inferredPermission.resourceKey, inferredPermission.action ?? "view"),
            }
            : {
                required: false,
                loading: false,
                allowed: true,
            };

    const status = getAccessStatus(user, authLoading, finalAllowedRoles, permissionCheck);

    const notifiedRef = useRef(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.replace(redirectUnauthenticated);
            return;
        }

        if (status === "unauthorized") {
            if (!notifiedRef.current) {
                notifiedRef.current = true;
                message.error(unauthorizedMessage);
            }
            router.replace(redirectUnauthorized);
            return;
        }

        notifiedRef.current = false;
    }, [status, router, redirectUnauthenticated, redirectUnauthorized, unauthorizedMessage]);

    return {
        status,
        isAuthorized: status === "authorized",
        isChecking: status === "checking",
        user,
    };
}
