import { Branch, CreateBranchInput, UpdateBranchInput } from "../types/api/branch";
import { API_ROUTES } from "../config/api";
import { getProxyUrl } from "../lib/proxy-utils";
import { BranchSchema, BranchesResponseSchema } from "../schemas/api/branch.schema";

const BASE_PATH = API_ROUTES.POS.BRANCH;

export const branchService = {
    getAll: async (cookie?: string): Promise<Branch[]> => {
        const url = getProxyUrl("GET", BASE_PATH);
        const headers: HeadersInit = {};
        if (cookie) headers.Cookie = cookie;

        const response = await fetch(url!, {
            cache: "no-store",
            credentials: 'include',
            headers
        });
        if (!response.ok) throw new Error('Failed to fetch branches');

        const json = await response.json();
        return BranchesResponseSchema.parse(json) as unknown as Branch[];
    },

    getById: async (id: string, cookie?: string): Promise<Branch> => {
        const url = getProxyUrl("GET", `${BASE_PATH}/${id}`);
        const headers: HeadersInit = {};
        if (cookie) headers.Cookie = cookie;

        const response = await fetch(url!, {
            cache: "no-store",
            credentials: 'include',
            headers
        });
        if (!response.ok) throw new Error('Failed to fetch branch');

        const json = await response.json();
        return BranchSchema.parse(json) as unknown as Branch;
    },

    create: async (data: CreateBranchInput, cookie?: string, csrfToken?: string): Promise<Branch> => {
        const url = getProxyUrl("POST", BASE_PATH);
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (cookie) headers.Cookie = cookie;
        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

        const response = await fetch(url!, {
            method: 'POST',
            body: JSON.stringify(data),
            headers,
            credentials: 'include'
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || 'Failed to create branch');
        }
        return response.json();
    },

    update: async (id: string, data: UpdateBranchInput, cookie?: string, csrfToken?: string): Promise<Branch> => {
        const url = getProxyUrl("PUT", `${BASE_PATH}/${id}`);
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (cookie) headers.Cookie = cookie;
        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

        const response = await fetch(url!, {
            method: 'PUT',
            body: JSON.stringify(data),
            headers,
            credentials: 'include'
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || 'Failed to update branch');
        }
        return response.json();
    },

    delete: async (id: string, cookie?: string, csrfToken?: string): Promise<void> => {
        const url = getProxyUrl("DELETE", `${BASE_PATH}/${id}`);
        const headers: Record<string, string> = {};
        if (cookie) headers.Cookie = cookie;
        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

        const response = await fetch(url!, {
            method: 'DELETE',
            headers,
            credentials: 'include'
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || 'Failed to delete branch');
        }
    }
};
