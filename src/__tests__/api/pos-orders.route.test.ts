/** @jest-environment node */

import { GET } from "../../app/api/pos/orders/route";
import { ordersService } from "../../services/pos/orders.service";
import type { NextRequest } from "next/server";

jest.mock("../../services/pos/orders.service", () => ({
    ordersService: {
        getAll: jest.fn(),
    },
}));

describe("GET /api/pos/orders", () => {
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

    it("forwards query params with sort_created=new to ordersService", async () => {
        (ordersService.getAll as jest.Mock).mockResolvedValue({
            data: [{ id: "o1" }],
            total: 1,
            page: 2,
            last_page: 1,
        });

        const req = makeRequest(
            "http://localhost/api/pos/orders?page=2&limit=10&status=Paid&type=DineIn&q=abc&sort_created=new",
            "sid=123"
        );

        const res = await GET(req);
        const body = await res.json();

        expect(ordersService.getAll).toHaveBeenCalledWith(
            "sid=123",
            2,
            10,
            "Paid",
            "DineIn",
            "abc",
            "new"
        );
        expect(res.status).toBe(200);
        expect(body).toEqual({
            data: [{ id: "o1" }],
            total: 1,
            page: 2,
            last_page: 1,
        });
    });

    it("defaults sort_created to old when omitted", async () => {
        (ordersService.getAll as jest.Mock).mockResolvedValue({
            data: [],
            total: 0,
            page: 1,
            last_page: 1,
        });

        const req = makeRequest("http://localhost/api/pos/orders");
        await GET(req);

        expect(ordersService.getAll).toHaveBeenCalledWith(
            "",
            1,
            50,
            undefined,
            undefined,
            undefined,
            "old"
        );
    });
});

