import { User } from "../types/api/users";
import { getProxyUrl } from "../lib/proxy-utils";

const BASE_PATH = "/users";

export const userService = {
    getAllUsers: async (): Promise<User[]> => {
        const url = getProxyUrl("GET", BASE_PATH);
        const response = await fetch(url!, { cache: "no-store" });
        if (!response.ok) throw new Error("Failed to fetch users");
        return response.json();
    },

    getUserById: async (id: number): Promise<User> => {
        const url = getProxyUrl("GET", `${BASE_PATH}/${id}`);
        const response = await fetch(url!, { cache: "no-store" });
        if (!response.ok) throw new Error("Failed to fetch user");
        return response.json();
    },

    createUser: async (data: Partial<User>): Promise<User> => {
        const url = getProxyUrl("POST", BASE_PATH);
        const response = await fetch(url!, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error("Failed to create user");
        return response.json();
    },

    updateUser: async (id: number, data: Partial<User>): Promise<User> => {
        const url = getProxyUrl("PUT", `${BASE_PATH}/${id}`);
        const response = await fetch(url!, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error("Failed to update user");
        return response.json();
    },

    deleteUser: async (id: number): Promise<void> => {
        const url = getProxyUrl("DELETE", `${BASE_PATH}/${id}`);
        const response = await fetch(url!, {
            method: "DELETE",
        });
        if (!response.ok) throw new Error("Failed to delete user");
    },
};
