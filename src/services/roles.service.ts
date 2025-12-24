import { Role } from "../types/api/roles";
import { getProxyUrl } from "../lib/proxy-utils";

const BASE_PATH = "/roles";

export const roleService = {
    getAllRoles: async (): Promise<Role[]> => {
        const url = getProxyUrl("GET", BASE_PATH);
        const response = await fetch(url!, { cache: "no-store" });
        if (!response.ok) throw new Error("Failed to fetch roles");
        return response.json();
    },

    getRoleById: async (id: number): Promise<Role> => {
        const url = getProxyUrl("GET", `${BASE_PATH}/${id}`);
        const response = await fetch(url!, { cache: "no-store" });
        if (!response.ok) throw new Error("Failed to fetch role");
        return response.json();
    },

    createRole: async (data: Partial<Role>): Promise<Role> => {
        const url = getProxyUrl("POST", BASE_PATH);
        const response = await fetch(url!, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error("Failed to create role");
        return response.json();
    },

    updateRole: async (id: number, data: Partial<Role>): Promise<Role> => {
        const url = getProxyUrl("PUT", `${BASE_PATH}/${id}`);
        const response = await fetch(url!, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error("Failed to update role");
        return response.json();
    },

    deleteRole: async (id: number): Promise<void> => {
        const url = getProxyUrl("DELETE", `${BASE_PATH}/${id}`);
        const response = await fetch(url!, {
            method: "DELETE",
        });
        if (!response.ok) throw new Error("Failed to delete role");
    },
};
