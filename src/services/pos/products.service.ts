import { Products } from "../../types/api/pos/products";
import { getProxyUrl } from "../../lib/proxy-utils";
import { API_ROUTES } from "../../config/api";
import { ProductSchema, ProductsResponseSchema } from "../../schemas/api/pos/products.schema";

const BASE_PATH = API_ROUTES.POS.PRODUCTS;

export const productsService = {
    findAll: async (page: number = 1, limit: number = 50, cookie?: string, searchParams?: URLSearchParams): Promise<{ data: Products[], total: number, page: number, last_page: number }> => {
        let url = getProxyUrl("GET", BASE_PATH);
        const params = new URLSearchParams(searchParams || "");
        params.append("page", page.toString());
        params.append("limit", limit.toString());

        url += `?${params.toString()}`;

        const headers: HeadersInit = {};
        if (cookie) headers.Cookie = cookie;

        const response = await fetch(url!, {
            cache: "no-store",
            credentials: 'include',
            headers
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "Failed to fetch products");
        }

        const json = await response.json();
        
        // Transform backend response format to match frontend schema
        // Backend returns: { success: true, data: [...], meta: { page, limit, total, totalPages } }
        // Frontend expects: { data: [...], total, page, last_page }
        let transformedResponse: { data: Products[], total: number, page: number, last_page: number };
        
        if (json.success && json.data && json.meta) {
            // Backend format - transform it
            transformedResponse = {
                data: json.data,
                total: json.meta.total || 0,
                page: json.meta.page || page,
                last_page: json.meta.totalPages || Math.ceil((json.meta.total || 0) / limit)
            };
        } else if (json.data && typeof json.total === 'number') {
            // Already in correct format
            transformedResponse = json;
        } else {
            throw new Error("Invalid response format from backend");
        }
        
        // Strict Validation: will throw if transformed response doesn't match schema
        return ProductsResponseSchema.parse(transformedResponse) as unknown as { data: Products[], total: number, page: number, last_page: number };
    },

    findOne: async (id: string, cookie?: string): Promise<Products> => {
        const url = getProxyUrl("GET", `${BASE_PATH}/${id}`);
        const headers: HeadersInit = {};
        if (cookie) headers.Cookie = cookie;

        const response = await fetch(url!, {
            cache: "no-store",
            credentials: 'include',
            headers
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "Failed to fetch product");
        }

        const json = await response.json();
        return ProductSchema.parse(json) as unknown as Products;
    },

    findOneByName: async (name: string, cookie?: string): Promise<Products> => {
        const url = getProxyUrl("GET", `${BASE_PATH}/name/${name}`);
        const headers: HeadersInit = {};
        if (cookie) headers.Cookie = cookie;

        const response = await fetch(url!, {
            cache: "no-store",
            credentials: 'include',
            headers
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "Failed to fetch product by name");
        }

        const json = await response.json();
        return ProductSchema.parse(json) as unknown as Products;
    },

    create: async (data: Partial<Products>, cookie?: string, csrfToken?: string): Promise<Products> => {
        const url = getProxyUrl("POST", BASE_PATH);
        const headers: Record<string, string> = { "Content-Type": "application/json" };
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
            throw new Error(errorData.error || errorData.message || "Failed to create product");
        }
        return response.json();
    },

    update: async (id: string, data: Partial<Products>, cookie?: string, csrfToken?: string): Promise<Products> => {
        const url = getProxyUrl("PUT", `${BASE_PATH}/${id}`);
        const headers: Record<string, string> = { "Content-Type": "application/json" };
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
            throw new Error(errorData.error || errorData.message || "Failed to update product");
        }
        return response.json();
    },

    delete: async (id: string, cookie?: string, csrfToken?: string): Promise<void> => {
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
            throw new Error(errorData.error || errorData.message || "Failed to delete product");
        }
    },
};
