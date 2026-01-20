
import { Shift } from "../../types/api/pos/shifts";
import { getProxyUrl } from "../../lib/proxy-utils";

const BASE_PATH = "/pos/shifts";

const getHeaders = (cookie?: string, contentType: string = "application/json"): HeadersInit => {
    const headers: Record<string, string> = {};
    if (contentType) headers["Content-Type"] = contentType;
    if (cookie) headers.Cookie = cookie;
    return headers;
};

export const shiftsService = {
    openShift: async (userId: string, startAmount: number, cookie?: string, csrfToken?: string): Promise<Shift> => {
        const url = getProxyUrl("POST", `${BASE_PATH}/open`);
        const headers = getHeaders(cookie) as Record<string, string>;
        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

        const response = await fetch(url!, {
            method: "POST",
            headers,
            credentials: "include",
            body: JSON.stringify({ user_id: userId, start_amount: startAmount }),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "ไม่สามารถเปิดกะได้");
        }
        return response.json();
    },

    closeShift: async (userId: string, endAmount: number, cookie?: string, csrfToken?: string): Promise<Shift> => {
        const url = getProxyUrl("POST", `${BASE_PATH}/close`);
        const headers = getHeaders(cookie) as Record<string, string>;
        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

        const response = await fetch(url!, {
            method: "POST",
            headers,
            credentials: "include",
            body: JSON.stringify({ user_id: userId, end_amount: endAmount }),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "ไม่สามารถปิดกะได้");
        }
        return response.json();
    },

    getCurrentShift: async (userId: string, cookie?: string): Promise<Shift | null> => {
        const url = getProxyUrl("GET", `${BASE_PATH}/current?user_id=${userId}`);
        const headers = getHeaders(cookie, "");

        const response = await fetch(url!, {
            cache: "no-store",
            headers,
            credentials: "include"
        });

        // Handle 404/Null as null (No active shift)
        if (response.status === 404) return null;

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "ไม่สามารถตรวจสอบสถานะกะได้");
        }

        const data = await response.json();
        return data || null;
    }
};
