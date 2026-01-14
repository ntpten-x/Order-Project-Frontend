import { LoginCredentials, LoginResponse, User } from "../types/api/auth";

// 4000 is the usual backend port if not specified
const BACKEND_API = process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:4000";

export const authService = {
    login: async (credentials: LoginCredentials, csrfToken?: string, cookieHeader?: string): Promise<User & { token: string }> => {
        try {
            const headers: Record<string, string> = {
                "Content-Type": "application/json",
            };

            if (csrfToken) {
                headers["X-CSRF-Token"] = csrfToken;
            }
            if (cookieHeader) {
                headers["Cookie"] = cookieHeader;
            }

            const response = await fetch(`${BACKEND_API}/auth/login`, {
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
            const headers: Record<string, string> = {
                "Content-Type": "application/json"
            };
            if (token) headers["Authorization"] = `Bearer ${token}`;
            if (csrfToken) headers["X-CSRF-Token"] = csrfToken;
            if (cookieHeader) headers["Cookie"] = cookieHeader;

            await fetch(`${BACKEND_API}/auth/logout`, {
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
            const response = await fetch(`${BACKEND_API}/auth/me`, {
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
            // Fetch directly from backend to ensure the cookie is set on the correct domain/port context
            const response = await fetch(`${BACKEND_API}/csrf-token`, {
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
