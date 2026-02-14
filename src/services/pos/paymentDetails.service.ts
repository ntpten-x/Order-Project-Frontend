import { PaymentDetails } from "../../types/api/pos/paymentDetails";
import { getProxyUrl } from "../../lib/proxy-utils";
import { throwBackendHttpError, unwrapBackendData } from "../../utils/api/backendResponse";

const BASE_PATH = "/pos/paymentDetails";

const getHeaders = (cookie?: string, contentType: string = "application/json"): HeadersInit => {
    const headers: Record<string, string> = {};
    if (contentType) headers["Content-Type"] = contentType;
    if (cookie) headers.Cookie = cookie;
    return headers;
};

export const paymentDetailsService = {
    getAll: async (cookie?: string): Promise<PaymentDetails[]> => {
        const url = getProxyUrl("GET", BASE_PATH);
        const headers = getHeaders(cookie, "");

        const response = await fetch(url!, {
            cache: "no-store",
            headers
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "ไม่สามารถดึงข้อมูลรายละเอียดการชำระเงินได้");
        }
        return unwrapBackendData(await response.json()) as PaymentDetails[];
    },

    getById: async (id: string, cookie?: string): Promise<PaymentDetails> => {
        const url = getProxyUrl("GET", `${BASE_PATH}/getById/${id}`);
        const headers = getHeaders(cookie, "");

        const response = await fetch(url!, {
            cache: "no-store",
            headers
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "ไม่สามารถดึงข้อมูลรายละเอียดการชำระเงินได้");
        }
        return unwrapBackendData(await response.json()) as PaymentDetails;
    },

    create: async (data: Partial<PaymentDetails>, cookie?: string, csrfToken?: string): Promise<PaymentDetails> => {
        const url = getProxyUrl("POST", `${BASE_PATH}/create`);
        const headers = getHeaders(cookie) as Record<string, string>;
        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

        const response = await fetch(url!, {
            method: "POST",
            headers,
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "ไม่สามารถสร้างรายละเอียดการชำระเงินได้");
        }
        return unwrapBackendData(await response.json()) as PaymentDetails;
    },

    update: async (id: string, data: Partial<PaymentDetails>, cookie?: string, csrfToken?: string): Promise<PaymentDetails> => {
        const url = getProxyUrl("PUT", `${BASE_PATH}/update/${id}`);
        const headers = getHeaders(cookie) as Record<string, string>;
        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

        const response = await fetch(url!, {
            method: "PUT",
            headers,
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "ไม่สามารถแก้ไขรายละเอียดการชำระเงินได้");
        }
        return unwrapBackendData(await response.json()) as PaymentDetails;
    },

    delete: async (id: string, cookie?: string, csrfToken?: string): Promise<void> => {
        const url = getProxyUrl("DELETE", `${BASE_PATH}/delete/${id}`);
        const headers = getHeaders(cookie, "");
        if (csrfToken) (headers as Record<string, string>)["X-CSRF-Token"] = csrfToken;

        const response = await fetch(url!, {
            method: "DELETE",
            headers
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "ไม่สามารถลบรายละเอียดการชำระเงินได้");
        }
    }
};
