import { useEffect, useMemo, useRef } from "react";
import { message } from "antd";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import type { User } from "@/types/api/auth";

export type AccessStatus = "checking" | "authorized" | "unauthenticated" | "unauthorized";

export function getAccessStatus(
    user: User | null,
    authLoading: boolean,
    requiredRole?: string
): AccessStatus {
    if (authLoading) return "checking";
    if (!user) return "unauthenticated";
    if (requiredRole && user.role !== requiredRole) return "unauthorized";
    return "authorized";
}

type GuardOptions = {
    requiredRole?: string;
    redirectUnauthenticated?: string;
    redirectUnauthorized?: string;
    unauthorizedMessage?: string;
};

export function useRoleGuard({
    requiredRole = "Admin",
    redirectUnauthenticated = "/login",
    redirectUnauthorized = "/pos",
    unauthorizedMessage = "คุณไม่มีสิทธิ์เข้าถึงหน้านี้",
}: GuardOptions = {}) {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const status = useMemo(
        () => getAccessStatus(user, authLoading, requiredRole),
        [user, authLoading, requiredRole]
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
