import { getProxyUrl } from "../../lib/proxy-utils";
import { throwBackendHttpError, unwrapBackendData } from "../../utils/api/backendResponse";
import { withInflightDedup } from "../../utils/api/inflight";

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
};
