/** @jest-environment node */

import { GET } from "../../app/api/pos/orders/summary/route";
import { ordersService } from "../../services/pos/orders.service";
import type { NextRequest } from "next/server";

jest.mock("../../services/pos/orders.service", () => ({
    ordersService: {
        getAllSummary: jest.fn(),
    },
}));

describe("GET /api/pos/orders/summary", () => {
    const makeRequest = (url: string, cookie?: string) =>
        ({
            nextUrl: new URL(url),
            headers: {
                get: (key: string) => (key.toLowerCase() === "cookie" ? (cookie ?? null) : null),
            },
        }) as unknown as NextRequest;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("forwards query params and cookie to ordersService", async () => {
        (ordersService.getAllSummary as jest.Mock).mockResolvedValue({
            data: [{ id: "o1" }],
            total: 1,
            page: 2,
            last_page: 1,
        });

        const req = makeRequest(
            "http://localhost/api/pos/orders/summary?page=2&limit=10&status=Paid,Completed&type=DineIn&q=abc",
            "sid=123"
        );

        const res = await GET(req);
        const body = await res.json();

        expect(ordersService.getAllSummary).toHaveBeenCalledWith(
            "sid=123",
            2,
            10,
            "Paid,Completed",
            "DineIn",
            "abc"
        );
        expect(res.status).toBe(200);
        expect(body).toEqual({
            data: [{ id: "o1" }],
            total: 1,
            page: 2,
            last_page: 1,
        });
    });

    it("returns 500 when ordersService throws", async () => {
        (ordersService.getAllSummary as jest.Mock).mockRejectedValue(new Error("boom"));
        const req = makeRequest("http://localhost/api/pos/orders/summary");

        const res = await GET(req);
        const body = await res.json();

        expect(res.status).toBe(500);
        expect(body).toEqual({ error: "boom" });
    });
});
