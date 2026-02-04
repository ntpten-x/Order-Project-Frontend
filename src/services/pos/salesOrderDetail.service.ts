import { SalesOrderDetail } from "../../types/api/pos/salesOrderDetail";
import { getProxyUrl } from "../../lib/proxy-utils";
import { getBackendErrorMessage, unwrapBackendData } from "../../utils/api/backendResponse";

const BASE_PATH = "/pos/salesOrderDetail";

const getHeaders = (cookie?: string, contentType: string = "application/json"): HeadersInit => {
    const headers: Record<string, string> = {};
    if (contentType) headers["Content-Type"] = contentType;
    if (cookie) headers.Cookie = cookie;
    return headers;
};

export const salesOrderDetailService = {
    getAll: async (cookie?: string): Promise<SalesOrderDetail[]> => {
        const url = getProxyUrl("GET", BASE_PATH);
        const headers = getHeaders(cookie, "");

        const response = await fetch(url!, {
            cache: "no-store",
            headers
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(getBackendErrorMessage(errorData, "ไม่สามารถดึงข้อมูลรายละเอียดเพิ่มเติมได้"));
        }
        return unwrapBackendData(await response.json()) as SalesOrderDetail[];
    },

    getById: async (id: string, cookie?: string): Promise<SalesOrderDetail> => {
        const url = getProxyUrl("GET", `${BASE_PATH}/getById/${id}`);
        const headers = getHeaders(cookie, "");

        const response = await fetch(url!, {
            cache: "no-store",
            headers
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(getBackendErrorMessage(errorData, "ไม่สามารถดึงข้อมูลรายละเอียดเพิ่มเติมได้"));
        }
        return unwrapBackendData(await response.json()) as SalesOrderDetail;
    },

    create: async (data: Partial<SalesOrderDetail>, cookie?: string, csrfToken?: string): Promise<SalesOrderDetail> => {
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
            throw new Error(getBackendErrorMessage(errorData, "ไม่สามารถสร้างรายละเอียดเพิ่มเติมได้"));
        }
        return unwrapBackendData(await response.json()) as SalesOrderDetail;
    },

    update: async (id: string, data: Partial<SalesOrderDetail>, cookie?: string, csrfToken?: string): Promise<SalesOrderDetail> => {
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
            throw new Error(getBackendErrorMessage(errorData, "ไม่สามารถแก้ไขรายละเอียดเพิ่มเติมได้"));
        }
        return unwrapBackendData(await response.json()) as SalesOrderDetail;
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
            throw new Error(getBackendErrorMessage(errorData, "ไม่สามารถลบรายละเอียดเพิ่มเติมได้"));
        }
    }
};
