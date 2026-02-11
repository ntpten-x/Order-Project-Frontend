import { dashboardService } from "../../services/pos/dashboard.service";

type MockFetchResponse = {
    ok: boolean;
    json: () => Promise<unknown>;
};

describe("dashboardService contract", () => {
    const fetchMock = jest.fn<Promise<MockFetchResponse>, [string, RequestInit?]>();

    beforeEach(() => {
        jest.clearAllMocks();
        (global as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
    });

    it("getSalesSummary unwraps standardized backend payload", async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({
                success: true,
                data: [
                    {
                        date: "2026-02-11",
                        total_orders: 1,
                        total_sales: 100,
                        total_discount: 0,
                        cash_sales: 100,
                        qr_sales: 0,
                        dine_in_sales: 100,
                        takeaway_sales: 0,
                        delivery_sales: 0,
                    },
                ],
            }),
        });

        const rows = await dashboardService.getSalesSummary("2026-02-01", "2026-02-11");
        expect(fetchMock).toHaveBeenCalledWith(
            "/api/pos/dashboard/sales?startDate=2026-02-01&endDate=2026-02-11",
            expect.objectContaining({
                method: "GET",
                headers: { "Content-Type": "application/json" },
            })
        );
        expect(rows).toHaveLength(1);
        expect(rows[0].total_sales).toBe(100);
    });

    it("getTopSellingItems throws when response is not ok", async () => {
        fetchMock.mockResolvedValue({
            ok: false,
            json: async () => ({}),
        });

        await expect(dashboardService.getTopSellingItems(5)).rejects.toThrow("Failed to fetch top selling items");
    });

    it("getTopSellingItems supports legacy non-enveloped payload", async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => [
                {
                    product_id: "p1",
                    product_name: "Coffee",
                    img_url: "",
                    total_quantity: 3,
                    total_revenue: 180,
                },
            ],
        });

        const rows = await dashboardService.getTopSellingItems(5);
        expect(fetchMock).toHaveBeenCalledWith(
            "/api/pos/dashboard/top-items?limit=5",
            expect.objectContaining({
                method: "GET",
                headers: { "Content-Type": "application/json" },
            })
        );
        expect(rows[0].product_id).toBe("p1");
    });
});
