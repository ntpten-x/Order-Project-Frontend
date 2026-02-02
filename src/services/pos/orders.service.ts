import { SalesOrder, SalesOrderSummary, CreateSalesOrderDTO, CreateOrderItemDTO } from "../../types/api/pos/salesOrder";
import { ZodError } from "zod";
import { getProxyUrl } from "../../lib/proxy-utils";
import { SalesOrderItem } from "../../types/api/pos/salesOrderItem";
import { API_ROUTES } from "../../config/api";
import { OrdersResponseSchema, OrdersSummaryResponseSchema, SalesOrderSchema } from "../../schemas/api/pos/orders.schema";

const BASE_PATH = API_ROUTES.POS.ORDERS;

const getHeaders = (cookie?: string, contentType: string = "application/json"): HeadersInit => {
    const headers: Record<string, string> = {};
    if (contentType) headers["Content-Type"] = contentType;
    if (cookie) headers.Cookie = cookie;
    return headers;
};

export const ordersService = {
    getAll: async (cookie?: string, page: number = 1, limit: number = 50, status?: string, type?: string, query?: string): Promise<{ data: SalesOrder[], total: number, page: number, last_page: number }> => {
        // Construct URL with query parameters manually or use URLSearchParams
        const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...(status && { status }),
            ...(type && { type }),
            ...(query && { q: query })
        });
        const endpoint = `${BASE_PATH}?${queryParams.toString()}`;
        const url = getProxyUrl("GET", endpoint);
        const headers = getHeaders(cookie, "");

        const response = await fetch(url!, {
            cache: "no-store",
            headers,
            credentials: "include"
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "ไม่สามารถดึงข้อมูลออเดอร์ได้");
        }

        const json = await response.json();
        try {
            return OrdersResponseSchema.parse(json) as unknown as { data: SalesOrder[], total: number, page: number, last_page: number };
        } catch (error) {
            console.error("Zod Validation Error in ordersService.getAll:", error);
            if (error instanceof ZodError) {
                console.error("Zod Issues:", error.issues);
            }
            throw error;
        }
    },

    getAllSummary: async (
        cookie?: string,
        page: number = 1,
        limit: number = 50,
        status?: string,
        type?: string,
        query?: string
    ): Promise<{ data: SalesOrderSummary[], total: number, page: number, last_page?: number }> => {
        const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...(status && { status }),
            ...(type && { type }),
            ...(query && { q: query })
        });
        const endpoint = `${BASE_PATH}/summary?${queryParams.toString()}`;
        const url = getProxyUrl("GET", endpoint);
        const headers = getHeaders(cookie, "");

        const response = await fetch(url!, {
            cache: "no-store",
            headers,
            credentials: "include"
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "ไม่สามารถดึงข้อมูลออเดอร์ได้");
        }

        const json = await response.json();
        try {
            return OrdersSummaryResponseSchema.parse(json) as unknown as { data: SalesOrderSummary[], total: number, page: number, last_page?: number };
        } catch (error) {
            console.error("Zod Validation Error in ordersService.getAllSummary:", error);
            if (error instanceof ZodError) {
                console.error("Zod Issues:", error.issues);
            }
            throw error;
        }
    },

    getStats: async (cookie?: string): Promise<{ dineIn: number, takeaway: number, delivery: number, total: number }> => {
        const url = getProxyUrl("GET", API_ROUTES.POS.CHANNELS.STATS);
        const headers = getHeaders(cookie, "");

        const response = await fetch(url!, {
            cache: "no-store",
            headers,
            credentials: "include"
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error("Order Stats Backend Error:", errorText);
            const errorData = await JSON.parse(errorText).catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "ไม่สามารถดึงข้อมูลสถิติได้");
        }
        const json = await response.json();
        return json;
    },


    getById: async (id: string, cookie?: string): Promise<SalesOrder> => {
        const url = getProxyUrl("GET", `${BASE_PATH}/${id}`);
        const headers = getHeaders(cookie, "");

        const response = await fetch(url!, {
            cache: "no-store",
            headers,
            credentials: "include"
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "ไม่สามารถดึงข้อมูลออเดอร์ได้");
        }

        const json = await response.json();
        try {
            return SalesOrderSchema.parse(json) as unknown as SalesOrder;
        } catch (error) {
            console.error("Zod Validation Error in ordersService.getById:", error);
            if (error instanceof ZodError) {
                console.error("Zod Issues:", error.issues);
            }
            throw error;
        }
    },

    create: async (data: CreateSalesOrderDTO, cookie?: string, csrfToken?: string): Promise<SalesOrder> => {
        const url = getProxyUrl("POST", `${BASE_PATH}`);
        const headers = getHeaders(cookie) as Record<string, string>;
        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

        const response = await fetch(url!, {
            method: "POST",
            headers,
            credentials: "include",
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "ไม่สามารถสร้างออเดอร์ได้");
        }
        return response.json();
    },

    update: async (id: string, data: Partial<SalesOrder>, cookie?: string, csrfToken?: string): Promise<SalesOrder> => {
        const url = getProxyUrl("PUT", `${BASE_PATH}/${id}`);
        const headers = getHeaders(cookie) as Record<string, string>;
        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

        const response = await fetch(url!, {
            method: "PUT",
            headers,
            credentials: "include",
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "ไม่สามารถแก้ไขออเดอร์ได้");
        }
        return response.json();
    },

    delete: async (id: string, cookie?: string, csrfToken?: string): Promise<void> => {
        const url = getProxyUrl("DELETE", `${BASE_PATH}/${id}`);
        const headers = getHeaders(cookie, "");
        if (csrfToken) (headers as Record<string, string>)["X-CSRF-Token"] = csrfToken;

        const response = await fetch(url!, {
            method: "DELETE",
            headers,
            credentials: "include"
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "ไม่สามารถลบออเดอร์ได้");
        }
    },

    updateItemStatus: async (itemId: string, status: string, cookie?: string, csrfToken?: string): Promise<void> => {
        const url = getProxyUrl("PATCH", `${BASE_PATH}/items/${itemId}/status`);
        const headers = getHeaders(cookie) as Record<string, string>;
        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

        const response = await fetch(url!, {
            method: "PATCH",
            headers,
            credentials: "include",
            body: JSON.stringify({ status })
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "ไม่สามารถอัปเดตสถานะรายการได้");
        }
    },

    getItems: async (status?: string, cookie?: string): Promise<SalesOrderItem[]> => {
        const query = status ? `?status=${status}` : '';
        const url = getProxyUrl("GET", `${BASE_PATH}/items${query}`);
        const headers = getHeaders(cookie, "");

        const response = await fetch(url!, {
            cache: "no-store",
            headers,
            credentials: "include"
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "ไม่สามารถดึงข้อมูลรายการได้");
        }
        return response.json();
    },

    addItem: async (orderId: string, itemData: CreateOrderItemDTO, cookie?: string, csrfToken?: string): Promise<SalesOrder> => {
        const url = getProxyUrl("POST", `${BASE_PATH}/${orderId}/items`);
        const headers = getHeaders(cookie) as Record<string, string>;
        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

        const response = await fetch(url!, {
            method: "POST",
            headers,
            credentials: "include",
            body: JSON.stringify(itemData)
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "ไม่สามารถเพิ่มรายการได้");
        }
        return response.json();
    },

    updateItem: async (itemId: string, data: { quantity?: number, notes?: string, details?: Record<string, unknown>[] }, cookie?: string, csrfToken?: string): Promise<SalesOrder> => {
        const url = getProxyUrl("PUT", `${BASE_PATH}/items/${itemId}`);
        const headers = getHeaders(cookie, "application/json") as Record<string, string>;
        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

        const response = await fetch(url!, {
            method: "PUT",
            headers,
            credentials: "include",
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "ไม่สามารถแก้ไขรายการได้");
        }
        
        return response.json();
    },

    deleteItem: async (itemId: string, cookie?: string, csrfToken?: string): Promise<SalesOrder> => {
        const url = getProxyUrl("DELETE", `${BASE_PATH}/items/${itemId}`);
        const headers = getHeaders(cookie, "");
        if (csrfToken) (headers as Record<string, string>)["X-CSRF-Token"] = csrfToken;

        const response = await fetch(url!, {
            method: "DELETE",
            headers,
            credentials: "include"
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "ไม่สามารถลบรายการได้");
        }
        return response.json();
    },

    updateStatus: async (orderId: string, status: string, csrfToken?: string): Promise<void> => {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

        // Use existing update method or create specific endpoint if backend supports patch status
        // Checking backend controller... usually generic update works if fields allowed
        // But let's assume update(id, { status }) works

        const url = getProxyUrl("PUT", `${BASE_PATH}/${orderId}`);
        const response = await fetch(url!, {
            method: "PUT",
            headers,
            body: JSON.stringify({ status }),
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error("Failed to update status");
        }
    }
};
