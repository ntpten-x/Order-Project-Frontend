import { ordersService } from "../../services/pos/orders.service";
import { getProxyUrl } from "../../lib/proxy-utils";

jest.mock("../../lib/proxy-utils", () => ({
    getProxyUrl: jest.fn(),
}));

type MockFetchResponse = {
    ok: boolean;
    status?: number;
    json: () => Promise<unknown>;
    text?: () => Promise<string>;
};

describe("ordersService contract", () => {
    const fetchMock = jest.fn<Promise<MockFetchResponse>, [string, RequestInit?]>();
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        (global as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
        (getProxyUrl as jest.Mock).mockReturnValue("http://backend/mock");
        consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    it("getAllSummary parses standardized paginated payload and coerces numbers", async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({
                success: true,
                data: [
                    {
                        id: "o1",
                        order_no: "ORD-001",
                        order_type: "DineIn",
                        status: "Completed",
                        create_date: "2026-02-11T10:00:00.000Z",
                        total_amount: "123.50",
                        items_count: "2",
                    },
                ],
                meta: { page: 2, limit: 10, total: 1, totalPages: 1 },
            }),
        });

        const result = await ordersService.getAllSummary("sid=abc", 2, 10, "Paid,Completed", "DineIn", "ORD");

        expect(getProxyUrl).toHaveBeenCalledWith("GET", "/pos/orders/summary?page=2&limit=10&status=Paid%2CCompleted&type=DineIn&q=ORD");
        expect(fetchMock).toHaveBeenCalledWith(
            "http://backend/mock",
            expect.objectContaining({
                cache: "no-store",
                credentials: "include",
                headers: { Cookie: "sid=abc" },
            })
        );
        expect(result.total).toBe(1);
        expect(result.page).toBe(2);
        expect(result.data[0].total_amount).toBe(123.5);
        expect(result.data[0].items_count).toBe(2);
    });

    it("getAllSummary rejects invalid payload shape", async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({
                success: true,
                data: [{ id: "o1", status: "INVALID_STATUS" }],
                meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
            }),
        });

        await expect(ordersService.getAllSummary()).rejects.toThrow();
    });

    it("getAllSummary supports legacy non-enveloped paginated payload", async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({
                data: [
                    {
                        id: "o2",
                        order_no: "ORD-002",
                        order_type: "TakeAway",
                        status: "Paid",
                        create_date: "2026-02-11T11:00:00.000Z",
                        total_amount: "200",
                    },
                ],
                total: 1,
                page: 1,
                last_page: 1,
            }),
        });

        const result = await ordersService.getAllSummary();
        expect(result.total).toBe(1);
        expect(result.data[0].order_no).toBe("ORD-002");
        expect(result.data[0].total_amount).toBe(200);
    });

    it("getStats unwraps standardized payload", async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({
                success: true,
                data: { dineIn: 1, takeaway: 2, delivery: 3, total: 6 },
            }),
            text: async () => "",
        });

        const stats = await ordersService.getStats("sid=xyz");
        expect(stats).toEqual({ dineIn: 1, takeaway: 2, delivery: 3, total: 6 });
    });

    it("getStats returns backend error message when request fails", async () => {
        fetchMock.mockResolvedValue({
            ok: false,
            status: 400,
            text: async () => JSON.stringify({ success: false, error: { message: "Custom backend message" } }),
            json: async () => ({}),
        });

        await expect(ordersService.getStats()).rejects.toThrow("Custom backend message");
    });

    it("getStats falls back to default message for non-JSON error text", async () => {
        fetchMock.mockResolvedValue({
            ok: false,
            status: 500,
            text: async () => "gateway-timeout",
            json: async () => ({}),
        });

        await expect(ordersService.getStats()).rejects.toThrow();
    });
});
