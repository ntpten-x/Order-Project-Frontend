import { LoginCredentials, LoginResponse, User } from "../types/api/auth";
import { API_ROUTES, API_PREFIX } from "../config/api";
import { getProxyUrl } from "../lib/proxy-utils";
import { throwBackendHttpError, unwrapBackendData } from "../utils/api/backendResponse";

export const authService = {
    login: async (credentials: LoginCredentials, csrfToken?: string, cookieHeader?: string): Promise<User> => {
        const url = getProxyUrl("POST", API_ROUTES.AUTH.LOGIN);
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };

        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;
        if (cookieHeader) headers["Cookie"] = cookieHeader;

        const response = await fetch(url!, {
            method: "POST",
            headers,
            credentials: "include",
            body: JSON.stringify(credentials),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "Login failed");
        }

        const data = unwrapBackendData<LoginResponse | { user: User }>(await response.json());
        if (data && typeof data === "object" && "user" in data && data.user) {
            return data.user;
        }
        throw new Error("Login response is missing user data");
    },

    logout: async (token?: string, csrfToken?: string, cookieHeader?: string): Promise<void> => {
        try {
            const url = getProxyUrl("POST", API_ROUTES.AUTH.LOGOUT);
            const headers: Record<string, string> = {
                "Content-Type": "application/json",
            };
            if (token) headers["Authorization"] = `Bearer ${token}`;
            if (csrfToken) headers["X-CSRF-Token"] = csrfToken;
            if (cookieHeader) headers["Cookie"] = cookieHeader;

            await fetch(url!, {
                method: "POST",
                headers,
                credentials: "include",
            });
        } catch (error) {
            console.error("Logout failed", error);
        }
    },

    switchBranch: async (
        branchId: string | null,
        csrfToken?: string,
        cookieHeader?: string
    ): Promise<{ active_branch_id: string | null }> => {
        const url = getProxyUrl("POST", API_ROUTES.AUTH.SWITCH_BRANCH);
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;
        if (cookieHeader) headers["Cookie"] = cookieHeader;

        const response = await fetch(url!, {
            method: "POST",
            headers,
            credentials: "include",
            body: JSON.stringify({ branch_id: branchId }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "Failed to switch branch");
        }

        return unwrapBackendData(await response.json()) as { active_branch_id: string | null };
    },

    getMe: async (token?: string, cookieHeader?: string): Promise<User> => {
        const url = getProxyUrl("GET", API_ROUTES.AUTH.ME);
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        if (cookieHeader) headers["Cookie"] = cookieHeader;

        const response = await fetch(url!, {
            method: "GET",
            headers,
            credentials: "include",
            cache: "no-store",
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "Unauthorized");
        }

        return unwrapBackendData(await response.json()) as User;
    },

    updateMe: async (
        payload: { name?: string; password?: string },
        csrfToken?: string,
        cookieHeader?: string
    ): Promise<User> => {
        const url = getProxyUrl("PUT", API_ROUTES.AUTH.ME);
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };
        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;
        if (cookieHeader) headers["Cookie"] = cookieHeader;

        const response = await fetch(url!, {
            method: "PUT",
            headers,
            credentials: "include",
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "Failed to update profile");
        }

        return unwrapBackendData(await response.json()) as User;
    },

    async getCsrfToken(): Promise<string> {
        try {
            const response = await fetch(`${API_PREFIX}${API_ROUTES.AUTH.CSRF}`, {
                credentials: "include",
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("CSRF token fetch failed:", response.status, errorData);
                return "";
            }
            const data = await response.json();
            if (data.success && data.csrfToken) return data.csrfToken;
            if (data.csrfToken) return data.csrfToken;
            return "";
        } catch (error) {
            console.error("Failed to fetch CSRF token", error);
            return "";
        }
    },
};
