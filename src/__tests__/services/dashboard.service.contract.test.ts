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
                    display_name: "Coffee",
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

    it("getOverview unwraps standardized backend payload", async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({
                success: true,
                data: {
                    summary: {
                        period_start: "2026-02-01",
                        period_end: "2026-02-14",
                        total_sales: 1200,
                        total_orders: 10,
                        total_discount: 20,
                        average_order_value: 120,
                        cash_sales: 500,
                        qr_sales: 700,
                        dine_in_sales: 600,
                        takeaway_sales: 300,
                        delivery_sales: 300,
                    },
                    daily_sales: [],
                    top_items: [],
                    recent_orders: [],
                },
            }),
        });

        const data = await dashboardService.getOverview("2026-02-01", "2026-02-14", 7, 8);
        expect(fetchMock).toHaveBeenCalledWith(
            "/api/pos/dashboard/overview?startDate=2026-02-01&endDate=2026-02-14&topLimit=7&recentLimit=8",
            expect.objectContaining({
                method: "GET",
                headers: { "Content-Type": "application/json" },
            })
        );
        expect(data.summary.total_sales).toBe(1200);
    });

    it("getOverview forwards optional startAt/endAt query params", async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({
                success: true,
                data: {
                    summary: {
                        period_start: "2026-02-01T02:30:00.000Z",
                        period_end: "2026-02-14T11:45:00.000Z",
                        total_sales: 800,
                        total_orders: 6,
                        total_discount: 10,
                        average_order_value: 133.33,
                        cash_sales: 200,
                        qr_sales: 600,
                        dine_in_sales: 300,
                        takeaway_sales: 250,
                        delivery_sales: 250,
                    },
                    daily_sales: [],
                    top_items: [],
                    recent_orders: [],
                },
            }),
        });

        await dashboardService.getOverview(
            "2026-02-01",
            "2026-02-14",
            7,
            8,
            {
                startAt: "2026-02-01T02:30:00.000Z",
                endAt: "2026-02-14T11:45:00.000Z",
            }
        );

        expect(fetchMock).toHaveBeenCalledWith(
            "/api/pos/dashboard/overview?startDate=2026-02-01&endDate=2026-02-14&topLimit=7&recentLimit=8&startAt=2026-02-01T02%3A30%3A00.000Z&endAt=2026-02-14T11%3A45%3A00.000Z",
            expect.objectContaining({
                method: "GET",
                headers: { "Content-Type": "application/json" },
            })
        );
    });

    it("getSalesSummary forwards optional startAt/endAt query params", async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({
                success: true,
                data: [],
            }),
        });

        await dashboardService.getSalesSummary("2026-02-01", "2026-02-11", {
            startAt: "2026-02-01T08:00:00.000Z",
            endAt: "2026-02-11T18:30:00.000Z",
        });

        expect(fetchMock).toHaveBeenCalledWith(
            "/api/pos/dashboard/sales?startDate=2026-02-01&endDate=2026-02-11&startAt=2026-02-01T08%3A00%3A00.000Z&endAt=2026-02-11T18%3A30%3A00.000Z",
            expect.objectContaining({
                method: "GET",
                headers: { "Content-Type": "application/json" },
            })
        );
    });

    it("getOrderDetail unwraps standardized backend payload", async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({
                success: true,
                data: {
                    id: "o1",
                    order_no: "ORD-001",
                    order_type: "DineIn",
                    status: "Paid",
                    sub_total: 100,
                    discount_amount: 0,
                    vat: 0,
                    total_amount: 100,
                    create_date: "2026-02-14T10:00:00.000Z",
                    update_date: "2026-02-14T10:00:00.000Z",
                    items: [],
                    payments: [],
                },
            }),
        });

        const data = await dashboardService.getOrderDetail("o1");
        expect(fetchMock).toHaveBeenCalledWith(
            "/api/pos/dashboard/orders/o1",
            expect.objectContaining({
                method: "GET",
                headers: { "Content-Type": "application/json" },
            }),
        );
        expect(data.id).toBe("o1");
        expect(data.order_no).toBe("ORD-001");
    });
});
