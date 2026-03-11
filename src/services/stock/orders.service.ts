import { getProxyUrl } from "../../lib/proxy-utils";
import { Order, OrderStatus } from "../../types/api/stock/orders";
import { OrdersDetail } from "../../types/api/stock/ordersDetail";
import {
    normalizeBackendPaginated,
    throwBackendHttpError,
    unwrapBackendData,
} from "../../utils/api/backendResponse";

const BASE_PATH = "/stock/orders";

const getHeaders = (cookie?: string, contentType: string = "application/json"): HeadersInit => {
    const headers: Record<string, string> = {};
    if (contentType) headers["Content-Type"] = contentType;
    if (cookie) headers.Cookie = cookie;
    return headers;
};

export const ordersService = {
    createOrder: async (
        data: {
            ordered_by_id?: string;
            items: { ingredient_id: string; quantity_ordered: number }[];
            remark?: string;
        },
        cookie?: string,
        csrfToken?: string
    ): Promise<Order> => {
        const url = getProxyUrl("POST", BASE_PATH);
        const headers = getHeaders(cookie) as Record<string, string>;
        if (csrfToken) {
            headers["X-CSRF-Token"] = csrfToken;
        }

        const response = await fetch(url!, {
            method: "POST",
            headers,
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "สร้างใบซื้อไม่สำเร็จ");
        }

        return unwrapBackendData(await response.json()) as Order;
    },

    getAllOrders: async (
        cookie?: string,
        searchParams?: URLSearchParams,
        options?: { signal?: AbortSignal }
    ): Promise<{ data: Order[]; total: number; page: number; last_page: number }> => {
        let url = getProxyUrl("GET", BASE_PATH);
        if (searchParams) {
            url += `?${searchParams.toString()}`;
        }

        const headers = getHeaders(cookie, "");
        const response = await fetch(url!, {
            cache: "no-store",
            headers,
            signal: options?.signal,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "โหลดรายการใบซื้อไม่สำเร็จ");
        }

        return normalizeBackendPaginated<Order>(await response.json());
    },

    getOrderById: async (id: string, cookie?: string, options?: { signal?: AbortSignal }): Promise<Order> => {
        const url = getProxyUrl("GET", `${BASE_PATH}/${id}`);
        const headers = getHeaders(cookie, "");

        const response = await fetch(url!, {
            cache: "no-store",
            headers,
            signal: options?.signal,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "โหลดรายละเอียดใบซื้อไม่สำเร็จ");
        }

        return unwrapBackendData(await response.json()) as Order;
    },

    updateStatus: async (
        id: string,
        status: OrderStatus,
        cookie?: string,
        csrfToken?: string
    ): Promise<Order> => {
        const url = getProxyUrl("PUT", `${BASE_PATH}/${id}/status`);
        const headers = getHeaders(cookie) as Record<string, string>;
        if (csrfToken) {
            headers["X-CSRF-Token"] = csrfToken;
        }

        const response = await fetch(url!, {
            method: "PUT",
            headers,
            body: JSON.stringify({ status }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "อัปเดตสถานะใบซื้อไม่สำเร็จ");
        }

        return unwrapBackendData(await response.json()) as Order;
    },

    updateOrder: async (
        id: string,
        items: { ingredient_id: string; quantity_ordered: number }[],
        cookie?: string,
        csrfToken?: string
    ): Promise<Order> => {
        const url = getProxyUrl("PUT", `${BASE_PATH}/${id}`);
        const headers = getHeaders(cookie) as Record<string, string>;
        if (csrfToken) {
            headers["X-CSRF-Token"] = csrfToken;
        }

        const response = await fetch(url!, {
            method: "PUT",
            headers,
            body: JSON.stringify({ items }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "บันทึกการแก้ไขใบซื้อไม่สำเร็จ");
        }

        return unwrapBackendData(await response.json()) as Order;
    },

    confirmPurchase: async (
        id: string,
        items: { ingredient_id: string; actual_quantity: number; is_purchased: boolean }[],
        purchased_by_id?: string,
        cookie?: string,
        csrfToken?: string
    ): Promise<Order> => {
        const url = getProxyUrl("POST", `${BASE_PATH}/${id}/purchase`);
        const headers = getHeaders(cookie) as Record<string, string>;
        if (csrfToken) {
            headers["X-CSRF-Token"] = csrfToken;
        }

        const response = await fetch(url!, {
            method: "POST",
            headers,
            body: JSON.stringify(purchased_by_id ? { items, purchased_by_id } : { items }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "ยืนยันการตรวจรับไม่สำเร็จ");
        }

        return unwrapBackendData(await response.json()) as Order;
    },

    updatePurchaseDetail: async (
        data: {
            orders_item_id: string;
            actual_quantity: number;
            purchased_by_id: string;
            is_purchased?: boolean;
        },
        cookie?: string,
        csrfToken?: string
    ): Promise<OrdersDetail> => {
        const url = getProxyUrl("POST", "/stock/ordersDetail/update");
        const headers = getHeaders(cookie) as Record<string, string>;
        if (csrfToken) {
            headers["X-CSRF-Token"] = csrfToken;
        }

        const response = await fetch(url!, {
            method: "POST",
            headers,
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "อัปเดตรายการตรวจรับไม่สำเร็จ");
        }

        return unwrapBackendData(await response.json()) as OrdersDetail;
    },

    deleteOrder: async (id: string, cookie?: string, csrfToken?: string): Promise<void> => {
        const url = getProxyUrl("DELETE", `${BASE_PATH}/${id}`);
        const headers = getHeaders(cookie, "");
        if (csrfToken) {
            (headers as Record<string, string>)["X-CSRF-Token"] = csrfToken;
        }

        const response = await fetch(url!, {
            method: "DELETE",
            headers,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "ลบใบซื้อไม่สำเร็จ");
        }
    },
};
