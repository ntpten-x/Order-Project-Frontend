import { OrderQueue, CreateOrderQueueDTO, UpdateOrderQueueStatusDTO, QueueStatus } from "../../types/api/pos/orderQueue";
import { getProxyUrl } from "../../lib/proxy-utils";
import { API_ROUTES } from "../../config/api";
import { getCsrfTokenCached } from "../../utils/pos/csrf";
import { throwBackendHttpError, unwrapBackendData } from "../../utils/api/backendResponse";

const BASE_PATH = API_ROUTES.POS.ORDER_QUEUE;
type BackendLikePayload<T> =
    | T
    | { success: true; data: T }
    | { success: false; error?: { message?: string } };

const getHeaders = (cookie?: string, contentType: string = "application/json"): HeadersInit => {
    const headers: Record<string, string> = {};
    if (contentType) headers["Content-Type"] = contentType;
    if (cookie) headers.Cookie = cookie;
    return headers;
};

const parsePayload = async <T = unknown>(response: Response): Promise<T> => {
    return response.json().catch(() => ({} as T));
};

export const orderQueueService = {
    getAll: async (cookie?: string, status?: QueueStatus): Promise<OrderQueue[]> => {
        const queryParams = new URLSearchParams();
        if (status) queryParams.append("status", status);

        const endpoint = queryParams.toString() ? `${BASE_PATH}?${queryParams.toString()}` : BASE_PATH;
        const url = getProxyUrl("GET", endpoint);
        const headers = getHeaders(cookie, "");

        const response = await fetch(url!, {
            cache: "no-store",
            headers,
            credentials: "include",
        });

        if (!response.ok) {
            const errorData = await parsePayload(response);
            throwBackendHttpError(response, errorData, "Cannot fetch queue data");
        }

        const payload = await parsePayload<BackendLikePayload<OrderQueue[]>>(response);
        const data = unwrapBackendData<unknown>(payload);
        if (Array.isArray(data)) return data as OrderQueue[];
        return [];
    },

    addToQueue: async (data: CreateOrderQueueDTO, cookie?: string): Promise<OrderQueue> => {
        const url = getProxyUrl("POST", BASE_PATH);
        const headers = getHeaders(cookie) as Record<string, string>;
        const csrfToken = await getCsrfTokenCached();
        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

        const response = await fetch(url!, {
            method: "POST",
            headers,
            credentials: "include",
            body: JSON.stringify({
                orderId: data.orderId,
                priority: data.priority || "Normal",
            }),
        });

        if (!response.ok) {
            const errorData = await parsePayload(response);
            throwBackendHttpError(response, errorData, "Cannot add order to queue");
        }

        const payload = await parsePayload<BackendLikePayload<OrderQueue>>(response);
        return unwrapBackendData<OrderQueue>(payload);
    },

    updateStatus: async (id: string, data: UpdateOrderQueueStatusDTO, cookie?: string): Promise<OrderQueue> => {
        const url = getProxyUrl("PATCH", `${BASE_PATH}/${id}/status`);
        const headers = getHeaders(cookie) as Record<string, string>;
        const csrfToken = await getCsrfTokenCached();
        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

        const response = await fetch(url!, {
            method: "PATCH",
            headers,
            credentials: "include",
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await parsePayload(response);
            throwBackendHttpError(response, errorData, "Cannot update queue status");
        }

        const payload = await parsePayload<BackendLikePayload<OrderQueue>>(response);
        return unwrapBackendData<OrderQueue>(payload);
    },

    removeFromQueue: async (id: string, cookie?: string): Promise<void> => {
        const url = getProxyUrl("DELETE", `${BASE_PATH}/${id}`);
        const headers = getHeaders(cookie, "");
        const csrfToken = await getCsrfTokenCached();
        if (csrfToken) (headers as Record<string, string>)["X-CSRF-Token"] = csrfToken;

        const response = await fetch(url!, {
            method: "DELETE",
            headers,
            credentials: "include",
        });

        if (!response.ok) {
            const errorData = await parsePayload(response);
            throwBackendHttpError(response, errorData, "Cannot remove queue item");
        }
    },

    reorderQueue: async (cookie?: string): Promise<void> => {
        const url = getProxyUrl("POST", `${BASE_PATH}/reorder`);
        const headers = getHeaders(cookie) as Record<string, string>;
        const csrfToken = await getCsrfTokenCached();
        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

        const response = await fetch(url!, {
            method: "POST",
            headers,
            credentials: "include",
        });

        if (!response.ok) {
            const errorData = await parsePayload(response);
            throwBackendHttpError(response, errorData, "Cannot reorder queue");
        }
    },
};
