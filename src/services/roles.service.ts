import { Role } from "../types/api/roles";
import { getProxyUrl } from "../lib/proxy-utils";

const BASE_PATH = "/roles";

export const roleService = {
    getAllRoles: async (cookie?: string): Promise<Role[]> => {
        const url = getProxyUrl("GET", BASE_PATH);
        const headers: Record<string, string> = {
            "Content-Type": "application/json"
        };
        if (cookie) headers["Cookie"] = cookie;

        const response = await fetch(url!, {
            method: "GET",
            headers,
            credentials: "include", // For Client-side CORS
            cache: "no-store",
        });
        if (!response.ok) throw new Error("Failed to fetch roles");
        return response.json();
    },

    getRoleById: async (id: string, cookie?: string): Promise<Role> => {
        const url = getProxyUrl("GET", `${BASE_PATH}/${id}`);
        const headers: Record<string, string> = {
            "Content-Type": "application/json"
        };
        if (cookie) headers["Cookie"] = cookie;

        const response = await fetch(url!, {
            method: "GET",
            headers,
            credentials: "include",
            cache: "no-store"
        });
        if (!response.ok) throw new Error("Failed to fetch role");
        return response.json();
    },

    createRole: async (data: Partial<Role>, csrfToken?: string, cookie?: string): Promise<Role> => {
        const url = getProxyUrl("POST", BASE_PATH);
        const headers: Record<string, string> = {
            "Content-Type": "application/json"
        };
        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;
        if (cookie) headers["Cookie"] = cookie;

        const response = await fetch(url!, {
            method: "POST",
            headers,
            credentials: "include",
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || "Failed to create role");
        }
        return response.json();
    },

    updateRole: async (id: string, data: Partial<Role>, csrfToken?: string, cookie?: string): Promise<Role> => {
        const url = getProxyUrl("PUT", `${BASE_PATH}/${id}`);
        const headers: Record<string, string> = {
            "Content-Type": "application/json"
        };
        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;
        if (cookie) headers["Cookie"] = cookie;

        const response = await fetch(url!, {
            method: "PUT",
            headers,
            credentials: "include",
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || "Failed to update role");
        }
        return response.json();
    },

    deleteRole: async (id: string, csrfToken?: string, cookie?: string): Promise<void> => {
        const url = getProxyUrl("DELETE", `${BASE_PATH}/${id}`);
        const headers: Record<string, string> = {
            "Content-Type": "application/json"
        };
        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;
        if (cookie) headers["Cookie"] = cookie;

        const response = await fetch(url!, {
            method: "DELETE",
            headers,
            credentials: "include",
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || "Failed to delete role");
        }
    },
};
