import { servingBoardService } from "../../services/pos/servingBoard.service";
import { getProxyUrl } from "../../lib/proxy-utils";
import { ServingStatus } from "../../types/api/pos/servingBoard";

jest.mock("../../lib/proxy-utils", () => ({
    getProxyUrl: jest.fn(),
}));

type MockFetchResponse = {
    ok: boolean;
    status?: number;
    json: () => Promise<unknown>;
};

describe("servingBoardService contract", () => {
    const fetchMock = jest.fn<Promise<MockFetchResponse>, [string, RequestInit?]>();

    beforeEach(() => {
        jest.clearAllMocks();
        (global as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
        (getProxyUrl as jest.Mock).mockReturnValue("http://backend/mock");
    });

    it("getBoard unwraps and validates serving board payload", async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({
                success: true,
                data: [
                    {
                        id: "g-1",
                        order_id: "o-1",
                        order_no: "ORD-001",
                        order_type: "DineIn",
                        order_status: "Pending",
                        source_title: "Dine in โต๊ะ 1",
                        source_subtitle: "ORD-001",
                        batch_created_at: "2026-03-04T10:00:00.000Z",
                        pending_count: "1",
                        served_count: "0",
                        total_items: "1",
                        items: [
                            {
                                id: "i-1",
                                product_id: "p-1",
                                display_name: "ไก่ทอด",
                                product_image_url: null,
                                quantity: "1",
                                notes: null,
                                serving_status: "PendingServe",
                            },
                        ],
                    },
                ],
            }),
        });

        const result = await servingBoardService.getBoard("sid=abc");

        expect(getProxyUrl).toHaveBeenCalledWith("GET", "/pos/orders/serve-board");
        expect(fetchMock).toHaveBeenCalledWith(
            "http://backend/mock",
            expect.objectContaining({
                cache: "no-store",
                credentials: "include",
                headers: { Cookie: "sid=abc" },
            })
        );
        expect(result[0].pending_count).toBe(1);
        expect(result[0].items[0].serving_status).toBe(ServingStatus.PendingServe);
    });

    it("updateGroupStatus sends serving_status payload", async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({ success: true }),
        });

        await servingBoardService.updateGroupStatus("g-1", ServingStatus.Served, "sid=abc", "csrf-1");

        expect(getProxyUrl).toHaveBeenCalledWith("PATCH", "/pos/orders/serve-board/groups/g-1");
        expect(fetchMock).toHaveBeenCalledWith(
            "http://backend/mock",
            expect.objectContaining({
                method: "PATCH",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: "sid=abc",
                    "X-CSRF-Token": "csrf-1",
                },
                body: JSON.stringify({ serving_status: ServingStatus.Served }),
            })
        );
    });
});
