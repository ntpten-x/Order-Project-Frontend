import { User } from "../types/api/users";
import { getProxyUrl } from "../lib/proxy-utils";

const BASE_PATH = "/users";

export const userService = {
    getAllUsers: async (): Promise<User[]> => {
        const url = getProxyUrl("GET", BASE_PATH);
        const response = await fetch(url!, { cache: "no-store" });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "ไม่สามารถดึงข้อมูลผู้ใช้ได้");
        }
        return response.json();
    },

    getUserById: async (id: string): Promise<User> => {
        const url = getProxyUrl("GET", `${BASE_PATH}/${id}`);
        const response = await fetch(url!, { cache: "no-store" });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "ไม่สามารถดึงข้อมูลผู้ใช้ได้");
        }
        return response.json();
    },

    createUser: async (data: Partial<User>): Promise<User> => {
        const url = getProxyUrl("POST", BASE_PATH);
        const response = await fetch(url!, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "ไม่สามารถสร้างผู้ใช้ได้");
        }
        return response.json();
    },

    updateUser: async (id: string, data: Partial<User>): Promise<User> => {
        const url = getProxyUrl("PUT", `${BASE_PATH}/${id}`);
        const response = await fetch(url!, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "ไม่สามารถอัปเดตผู้ใช้ได้");
        }
        return response.json();
    },

    deleteUser: async (id: string): Promise<void> => {
        const url = getProxyUrl("DELETE", `${BASE_PATH}/${id}`);
        const response = await fetch(url!, {
            method: "DELETE",
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "ไม่สามารถลบผู้ใช้ได้");
        }
    },
};
