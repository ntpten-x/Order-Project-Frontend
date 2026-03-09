import { getProxyUrl } from "../../lib/proxy-utils";
import { throwBackendHttpError, unwrapBackendData } from "../../utils/api/backendResponse";
import { withInflightDedup } from "../../utils/api/inflight";
import { getCsrfTokenCached } from "../../utils/pos/csrf";

export type TakeawayQrInfo = {
    token: string;
    customer_path: string;
    qr_code_expires_at?: string | null;
    shop_name?: string | null;
};

const BASE_PATH = "/pos/takeaway-qr";

export const takeawayQrService = {
    getInfo: async (cookie?: string): Promise<TakeawayQrInfo> =>
        withInflightDedup(`takeawayQr:get:${cookie ?? "client"}`, async () => {
            const response = await fetch(getProxyUrl("GET", BASE_PATH)!, {
                cache: "no-store",
                headers: cookie ? { Cookie: cookie } : undefined,
                credentials: "include",
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throwBackendHttpError(response, errorData, "Unable to load takeaway QR");
            }

            return unwrapBackendData(await response.json()) as TakeawayQrInfo;
        }),
    rotate: async (cookie?: string, csrfToken?: string): Promise<TakeawayQrInfo> => {
        const token = csrfToken?.trim() || (!cookie ? await getCsrfTokenCached() : "");
        const headers: Record<string, string> = {
            ...(cookie ? { Cookie: cookie } : {}),
        };
        if (token) {
            headers["X-CSRF-Token"] = token;
        }

        const response = await fetch(getProxyUrl("POST", `${BASE_PATH}/rotate`)!, {
            method: "POST",
            cache: "no-store",
            headers,
            credentials: "include",
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throwBackendHttpError(response, errorData, "Unable to rotate takeaway QR");
        }

        return unwrapBackendData(await response.json()) as TakeawayQrInfo;
    },
};
