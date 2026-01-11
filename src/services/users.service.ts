import { User } from "../types/api/users";
import { getProxyUrl } from "../lib/proxy-utils";

const BASE_PATH = "/users";

export const userService = {
    getAllUsers: async (cookie?: string, searchParams?: URLSearchParams): Promise<User[]> => {
        let url = getProxyUrl("GET", BASE_PATH);
        if (searchParams) {
            url += `?${searchParams.toString()}`;
        }

        const headers: HeadersInit = {};
        if (cookie) headers.Cookie = cookie;

        const response = await fetch(url!, {
            headers,
            credentials: 'include',
            cache: 'no-store'
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const detailedError = errorData.errors?.map((e: { message: string }) => e.message).join(", ");
            throw new Error(detailedError || errorData.error || errorData.message || "ไม่สามารถดึงข้อมูลผู้ใช้ได้");
        }
        return response.json();
    },

    getUserById: async (id: string, cookie?: string): Promise<User> => {
        const url = getProxyUrl("GET", `${BASE_PATH}/${id}`);
        const headers: HeadersInit = {};
        if (cookie) headers.Cookie = cookie;

        const response = await fetch(url!, {
            headers,
            credentials: 'include',
            cache: 'no-store'
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const detailedError = errorData.errors?.map((e: { message: string }) => e.message).join(", ");
            throw new Error(detailedError || errorData.error || errorData.message || "ไม่สามารถดึงข้อมูลผู้ใช้ได้");
        }
        return response.json();
    },

    createUser: async (data: Partial<User>, cookie?: string, csrfToken?: string): Promise<User> => {
        const url = getProxyUrl("POST", BASE_PATH);
        const headers: Record<string, string> = {
            "Content-Type": "application/json"
        };
        if (cookie) headers.Cookie = cookie;
        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

        const response = await fetch(url!, {
            method: "POST",
            headers,
            body: JSON.stringify(data),
            credentials: 'include'
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const detailedError = errorData.errors?.map((e: { message: string }) => e.message).join(", ");
            throw new Error(detailedError || errorData.error || errorData.message || "ไม่สามารถสร้างผู้ใช้ได้");
        }
        return response.json();
    },

    updateUser: async (id: string, data: Partial<User>, cookie?: string, csrfToken?: string): Promise<User> => {
        const url = getProxyUrl("PUT", `${BASE_PATH}/${id}`);
        const headers: Record<string, string> = {
            "Content-Type": "application/json"
        };
        if (cookie) headers.Cookie = cookie;
        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

        const response = await fetch(url!, {
            method: "PUT",
            headers,
            body: JSON.stringify(data),
            credentials: 'include'
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const detailedError = errorData.errors?.map((e: { message: string }) => e.message).join(", ");
            throw new Error(detailedError || errorData.error || errorData.message || "ไม่สามารถอัปเดตผู้ใช้ได้");
        }
        return response.json();
    },

    deleteUser: async (id: string, cookie?: string, csrfToken?: string): Promise<void> => {
        const url = getProxyUrl("DELETE", `${BASE_PATH}/${id}`);
        const headers: Record<string, string> = {};
        if (cookie) headers.Cookie = cookie;
        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

        const response = await fetch(url!, {
            method: "DELETE",
            headers,
            credentials: 'include'
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const detailedError = errorData.errors?.map((e: { message: string }) => e.message).join(", ");
            throw new Error(detailedError || errorData.error || errorData.message || "ไม่สามารถลบผู้ใช้ได้");
        }
    },
};
