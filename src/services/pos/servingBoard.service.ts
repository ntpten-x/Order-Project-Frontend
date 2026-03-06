import { getProxyUrl } from "../../lib/proxy-utils";
import { API_ROUTES } from "../../config/api";
import { ServingBoardGroup, ServingStatus } from "../../types/api/pos/servingBoard";
import { ServingBoardResponseSchema } from "../../schemas/api/pos/servingBoard.schema";
import { throwBackendHttpError, unwrapBackendData } from "../../utils/api/backendResponse";

const BASE_PATH = API_ROUTES.POS.SERVING_BOARD;

function buildHeaders(cookie?: string, contentType: string = "application/json"): HeadersInit {
    const headers: Record<string, string> = {};
    if (contentType) headers["Content-Type"] = contentType;
    if (cookie) headers.Cookie = cookie;
    return headers;
}

export const servingBoardService = {
    getBoard: async (cookie?: string): Promise<ServingBoardGroup[]> => {
        const url = getProxyUrl("GET", BASE_PATH);
        const response = await fetch(url!, {
            cache: "no-store",
            headers: buildHeaders(cookie, ""),
            credentials: "include",
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "ไม่สามารถโหลดกระดานเสิร์ฟได้");
        }

        const json = await response.json();
        return ServingBoardResponseSchema.parse(unwrapBackendData(json));
    },

    updateItemStatus: async (itemId: string, servingStatus: ServingStatus, cookie?: string, csrfToken?: string): Promise<void> => {
        const url = getProxyUrl("PATCH", `${BASE_PATH}/items/${itemId}`);
        const headers = buildHeaders(cookie) as Record<string, string>;
        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

        const response = await fetch(url!, {
            method: "PATCH",
            headers,
            credentials: "include",
            body: JSON.stringify({ serving_status: servingStatus }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "ไม่สามารถอัปเดตสถานะการเสิร์ฟได้");
        }
    },

    updateGroupStatus: async (groupId: string, servingStatus: ServingStatus, cookie?: string, csrfToken?: string): Promise<void> => {
        const url = getProxyUrl("PATCH", `${BASE_PATH}/groups/${groupId}`);
        const headers = buildHeaders(cookie) as Record<string, string>;
        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

        const response = await fetch(url!, {
            method: "PATCH",
            headers,
            credentials: "include",
            body: JSON.stringify({ serving_status: servingStatus }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "ไม่สามารถอัปเดตสถานะทั้งกลุ่มได้");
        }
    },
};
