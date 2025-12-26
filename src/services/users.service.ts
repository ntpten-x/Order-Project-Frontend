import { User } from "../types/api/users";
import { getProxyUrl } from "../lib/proxy-utils";

const BASE_PATH = "/users";

export const userService = {
    getAllUsers: async (cookie?: string): Promise<User[]> => {
        const url = getProxyUrl("GET", BASE_PATH);
        const headers: HeadersInit = {};
        if (cookie) headers.Cookie = cookie;

        const response = await fetch(url!, {
            cache: "no-store",
            headers
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "ไม่สามารถดึงข้อมูลผู้ใช้ได้");
        }
        return response.json();
    },

    getUserById: async (id: string, cookie?: string): Promise<User> => {
        const url = getProxyUrl("GET", `${BASE_PATH}/${id}`);
        const headers: HeadersInit = {};
        if (cookie) headers.Cookie = cookie;

        const response = await fetch(url!, {
            cache: "no-store",
            headers
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "ไม่สามารถดึงข้อมูลผู้ใช้ได้");
        }
        return response.json();
    },

    createUser: async (data: Partial<User>, cookie?: string): Promise<User> => {
        const url = getProxyUrl("POST", BASE_PATH);
        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (cookie) headers.Cookie = cookie;

        const response = await fetch(url!, {
            method: "POST",
            headers,
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "ไม่สามารถสร้างผู้ใช้ได้");
        }
        return response.json();
    },

    updateUser: async (id: string, data: Partial<User>, cookie?: string): Promise<User> => {
        const url = getProxyUrl("PUT", `${BASE_PATH}/${id}`);
        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (cookie) headers.Cookie = cookie;

        const response = await fetch(url!, {
            method: "PUT",
            headers,
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "ไม่สามารถอัปเดตผู้ใช้ได้");
        }
        return response.json();
    },

    deleteUser: async (id: string, cookie?: string): Promise<void> => {
        const url = getProxyUrl("DELETE", `${BASE_PATH}/${id}`);
        const headers: HeadersInit = {};
        if (cookie) headers.Cookie = cookie;

        const response = await fetch(url!, {
            method: "DELETE",
            headers
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "ไม่สามารถลบผู้ใช้ได้");
        }
    },
};
