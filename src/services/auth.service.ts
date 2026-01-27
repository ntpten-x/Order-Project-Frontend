import { LoginCredentials, LoginResponse, User } from "../types/api/auth";
import { API_ROUTES, API_PREFIX } from "../config/api";
import { getProxyUrl } from "../lib/proxy-utils";

// 4000 is the usual backend port if not specified
const BACKEND_API = process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:4000";

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
                throw new Error(errorData.message || errorData.detail || "เข้าสู่ระบบไม่สำเร็จ");
            }

            const data: LoginResponse = await response.json();
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
            const url = getProxyUrl("POST", "/auth/logout");

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

    getMe: async (token: string): Promise<User> => {
        try {
            const url = getProxyUrl("GET", API_ROUTES.AUTH.ME);
            const response = await fetch(url!, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                credentials: 'include',
                cache: "no-store",
            });

            if (!response.ok) {
                throw new Error("Unauthorized");
            }

            const user: User = await response.json();
            return user;
        } catch (error) {
            throw error;
        }
    },

    async getCsrfToken(): Promise<string> {
        try {
            // Hit Next.js proxy so cookies stay on frontend origin (avoids port/domain mismatch)
            const response = await fetch(`${API_PREFIX}${API_ROUTES.AUTH.CSRF}`, {
                credentials: "include"
            });
            if (!response.ok) return "";
            const data = await response.json();
            return data.csrfToken;
        } catch (error) {
            console.error("Failed to fetch CSRF token", error);
            return "";
        }
    }
};
