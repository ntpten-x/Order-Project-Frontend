import { LoginCredentials, LoginResponse, User } from "../types/api/auth";
import { API_ROUTES, API_PREFIX } from "../config/api";
import { getProxyUrl } from "../lib/proxy-utils";
import { throwBackendHttpError, unwrapBackendData } from "../utils/api/backendResponse";

export const authService = {
    login: async (credentials: LoginCredentials, csrfToken?: string, cookieHeader?: string): Promise<User & { token: string }> => {
        try {
            const url = getProxyUrl("POST", API_ROUTES.AUTH.LOGIN);
            const headers: Record<string, string> = {
                "Content-Type": "application/json",
            };

            if (csrfToken) {
                headers["X-CSRF-Token"] = csrfToken;
            }
            if (cookieHeader) {
                headers["Cookie"] = cookieHeader;
            }

            const response = await fetch(url!, {
                method: "POST",
                headers: headers,
                credentials: 'include', // Ensure cookies are handled
                body: JSON.stringify(credentials),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const message =
                    errorData?.error?.message ||
                    errorData.message ||
                    errorData.detail ||
                    "Login failed";
                throw new Error(message);
            }

            const data = unwrapBackendData<LoginResponse>(await response.json());
            // Return both user and token so the API route can handle the cookie
            // Note: If using credentials: include, the backend Set-Cookie should be handled by browser automatically.
            return { ...data.user, token: data.token };
        } catch (error: unknown) {
            throw new Error((error as Error).message || "เข้าสู่ระบบไม่สำเร็จ");
        }
    },

    logout: async (token?: string, csrfToken?: string, cookieHeader?: string): Promise<void> => {
        try {
            // Check if API_ROUTES.AUTH.LOGOUT exists, otherwise define it or use literal
            // Assuming API_ROUTES structure from config/api.ts. If LOGOUT is missing, we might need to add it or use hardcoded if known.
            // Looking at config/api.ts read earlier:
            /*
            AUTH: {
                LOGIN: '/auth/login',
                ME: '/auth/me',
                CSRF: '/csrf',
            },
            */
            // It seems LOGOUT is missing from API_ROUTES in config/api.ts. I should probably add it or just use the string for now but getProxyUrl requires a path.
            // Let's use the string "/auth/logout" for now with getProxyUrl
            const url = getProxyUrl("POST", API_ROUTES.AUTH.LOGOUT);

            const headers: Record<string, string> = {
                "Content-Type": "application/json"
            };
            if (token) headers["Authorization"] = `Bearer ${token}`;
            if (csrfToken) headers["X-CSRF-Token"] = csrfToken;
            if (cookieHeader) headers["Cookie"] = cookieHeader;

            await fetch(url!, {
                method: "POST",
                headers: headers,
                credentials: 'include'
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

    getMe: async (token?: string): Promise<User> => {
        try {
            const url = getProxyUrl("GET", API_ROUTES.AUTH.ME);
            const headers: Record<string, string> = {
                "Content-Type": "application/json"
            };
            if (token) {
                headers["Authorization"] = `Bearer ${token}`;
            }
            const response = await fetch(url!, {
                method: "GET",
                headers,
                credentials: 'include',
                cache: "no-store",
            });

            if (!response.ok) {
                throw new Error("Unauthorized");
            }

            return unwrapBackendData(await response.json()) as User;
        } catch (error) {
            throw error;
        }
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
        if (csrfToken) {
            headers["X-CSRF-Token"] = csrfToken;
        }
        if (cookieHeader) {
            headers["Cookie"] = cookieHeader;
        }

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
            // Hit Next.js proxy so cookies stay on frontend origin (avoids port/domain mismatch)
            const response = await fetch(`${API_PREFIX}${API_ROUTES.AUTH.CSRF}`, {
                credentials: "include"
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("CSRF token fetch failed:", response.status, errorData);
                return "";
            }
            const data = await response.json();
            // Handle different response formats
            if (data.success && data.csrfToken) {
                return data.csrfToken;
            } else if (data.csrfToken) {
                return data.csrfToken;
            }
            return "";
        } catch (error) {
            console.error("Failed to fetch CSRF token", error);
            return "";
        }
    }
};
