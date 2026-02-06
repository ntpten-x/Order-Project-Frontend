import { useEffect, useMemo, useRef } from "react";
import { message } from "antd";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import type { User } from "../../types/api/auth";
import type { Role } from "../../lib/rbac/policy";
import { asRole } from "../../lib/rbac/policy";

export type AccessStatus = "checking" | "authorized" | "unauthenticated" | "unauthorized";

export function getAccessStatus(
    user: User | null,
    authLoading: boolean,
    allowedRoles?: Role[]
): AccessStatus {
    if (authLoading) return "checking";
    if (!user) return "unauthenticated";
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
    redirectUnauthenticated?: string;
    redirectUnauthorized?: string;
    unauthorizedMessage?: string;
};

export function useRoleGuard({
    allowedRoles,
    requiredRole = "Admin",
    redirectUnauthenticated = "/login",
    redirectUnauthorized = "/pos",
    unauthorizedMessage = "คุณไม่มีสิทธิ์เข้าถึงหน้านี้",
}: GuardOptions = {}) {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const finalAllowedRoles = useMemo<Role[] | undefined>(() => {
        if (allowedRoles && allowedRoles.length > 0) return allowedRoles;
        return requiredRole ? [requiredRole] : undefined;
    }, [allowedRoles, requiredRole]);
    const status = useMemo(
        () => getAccessStatus(user, authLoading, finalAllowedRoles),
        [user, authLoading, finalAllowedRoles]
    );

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
        }
    }, [status, router, redirectUnauthenticated, redirectUnauthorized, unauthorizedMessage]);

    return {
        status,
        isAuthorized: status === "authorized",
        isChecking: status === "checking",
        user,
    };
}
