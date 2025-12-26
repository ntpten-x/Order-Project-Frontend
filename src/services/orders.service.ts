import { Order, OrderStatus } from "../types/api/orders";
import { OrdersDetail } from "../types/api/ordersDetail";
import { getProxyUrl } from "../lib/proxy-utils";

const BASE_PATH = "/orders";

export const ordersService = {
    // Order Flow
    createOrder: async (data: {
        ordered_by_id: string;
        items: { ingredient_id: string; quantity_ordered: number }[];
        remark?: string;
    }): Promise<Order> => {
        const url = getProxyUrl("POST", BASE_PATH);
        const response = await fetch(url!, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "ไม่สามารถสร้างออเดอร์ได้");
        }
        return response.json();
    },

    getAllOrders: async (): Promise<Order[]> => {
        const url = getProxyUrl("GET", BASE_PATH);
        const response = await fetch(url!, { cache: "no-store" });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "ไม่สามารถดึงข้อมูลออเดอร์ได้");
        }
        return response.json();
    },

    getOrderById: async (id: string): Promise<Order> => {
        const url = getProxyUrl("GET", `${BASE_PATH}/${id}`);
        const response = await fetch(url!, { cache: "no-store" });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "ไม่สามารถดึงข้อมูลออเดอร์ได้");
        }
        return response.json();
    },

    updateStatus: async (id: string, status: OrderStatus): Promise<Order> => {
        const url = getProxyUrl("PUT", `${BASE_PATH}/${id}/status`);
        const response = await fetch(url!, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "ไม่สามารถอัปเดตสถานะออเดอร์ได้");
        }
        return response.json();
    },

    updateOrder: async (id: string, items: { ingredient_id: string; quantity_ordered: number }[]): Promise<Order> => {
        const url = getProxyUrl("PUT", `${BASE_PATH}/${id}`);
        const response = await fetch(url!, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to update order: ${response.status} ${errorText}`);
        }
        return response.json();
    },

    confirmPurchase: async (id: string, items: { ingredient_id: string; actual_quantity: number; is_purchased: boolean }[], purchased_by_id: string): Promise<Order> => {
        const url = getProxyUrl("POST", `${BASE_PATH}/${id}/purchase`);
        const response = await fetch(url!, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items, purchased_by_id }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to confirm purchase: ${response.status} ${errorText}`);
        }
        return response.json();
    },
    updatePurchaseDetail: async (data: {
        orders_item_id: string;
        actual_quantity: number;
        purchased_by_id: string;
        is_purchased?: boolean;
    }): Promise<OrdersDetail> => {
        const url = getProxyUrl("POST", "/ordersDetail/update");
        const response = await fetch(url!, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "ไม่สามารถอัปเดตข้อมูลการซื้อได้");
        }
        return response.json();
    },

    deleteOrder: async (id: string): Promise<void> => {
        const url = getProxyUrl("DELETE", `${BASE_PATH}/${id}`);
        const response = await fetch(url!, {
            method: "DELETE",
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to delete order: ${response.status} ${errorText}`);
        }
    },
};
