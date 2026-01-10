import { LoginCredentials, LoginResponse, User } from "../types/api/auth";

const BACKEND_API = process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:3000";

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
                body: JSON.stringify(credentials),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || errorData.detail || "เข้าสู่ระบบไม่สำเร็จ");
            }

            const data: LoginResponse = await response.json();
            // Return both user and token so the API route can handle the cookie
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
                headers: headers
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
                    "Authorization": `Bearer ${token}`, // Backend expects Bearer or Cookie? 
                    // Previous code used "Cookie: token=..." in the proxy, but backend usually expects Authorization or Cookie. 
                    // Let's check backend auth middleware later. standard is usually Bearer or Cookie.
                    // The previous proxy was sending `headers: { "Cookie": \`token=${token}\` }`. 
                    // Let's stick to what worked or standarize. 
                    // Since backend extracts from cookie usually (as verified in AuthController: verify request cookies?), 
                    // Actually AuthController uses `req.user` from middleware. Middleware likely checks header or cookie.
                    // We'll send it as Cookie header to mimic browser-to-backend if that was the case, 
                    // OR if we are server-to-server, we might need to set the Cookie header manually.
                    "Cookie": `token=${token}`,
                    "Content-Type": "application/json"
                },
                cache: "no-store",
            });

            if (!response.ok) {
                throw new Error("Unauthorized");
            }

            const user: User = await response.json(); // Backend response structure for getMe is just the user object based on controller code
            return user;
        } catch (error) {
            throw error;
        }
    },

    async getCsrfToken(): Promise<string> {
        // Use Next.js API Proxy to ensure cookies (especially Set-Cookie) are handled correctly on the same domain
        // This is crucial for the browser to associate the CSRF secret with the token
        try {
            const response = await fetch("/api/csrf");
            if (!response.ok) return "";
            const data = await response.json();
            return data.csrfToken;
        } catch (error) {
            // Fallback for Server-Side usage where relative URL might fail?
            // Usually getCsrfToken is called Client-side. 
            // If called Server-side, it should probably call Backend directly but we need logic for that.
            // For now, assume Client-side usage for this method.
            console.error("Failed to fetch CSRF token", error);
            return "";
        }
    }
};
