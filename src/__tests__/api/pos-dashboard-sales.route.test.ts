/** @jest-environment node */

import type { NextRequest } from "next/server";

import { GET as GET_SALES } from "../../app/api/pos/dashboard/sales/route";
import { GET as GET_ORDER_DETAIL } from "../../app/api/pos/dashboard/orders/[id]/route";
import { getProxyUrl } from "../../lib/proxy-utils";

jest.mock("../../lib/proxy-utils", () => ({
    getProxyUrl: jest.fn(),
}));

describe("dashboard proxy routes", () => {
    const fetchMock = jest.fn();

    const makeRequest = (url: string, cookie?: string) =>
        ({
            nextUrl: new URL(url),
            headers: {
                get: (key: string) => (key.toLowerCase() === "cookie" ? (cookie ?? null) : null),
            },
        }) as unknown as NextRequest;

    beforeEach(() => {
        jest.clearAllMocks();
        (global as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
    });

    it("GET /api/pos/dashboard/sales forwards filters and cache headers", async () => {
        (getProxyUrl as jest.Mock).mockReturnValue(
            "http://backend/pos/dashboard/sales?startDate=2026-02-01&endDate=2026-02-11",
        );
        fetchMock.mockResolvedValue(
            new Response(JSON.stringify({ data: [{ date: "2026-02-01", total_sales: 100 }] }), {
                status: 200,
                headers: {
                    "content-type": "application/json",
                    "cache-control": "private, max-age=0, s-maxage=15",
                    vary: "Authorization, Cookie",
                },
            }),
        );

        const req = makeRequest(
            "http://localhost/api/pos/dashboard/sales?startDate=2026-02-01&endDate=2026-02-11",
            "sid=abc",
        );
        const res = await GET_SALES(req);
        const body = await res.json();

        expect(getProxyUrl).toHaveBeenCalledWith(
            "GET",
            "/pos/dashboard/sales?startDate=2026-02-01&endDate=2026-02-11",
        );
        expect(fetchMock).toHaveBeenCalledWith(
            "http://backend/pos/dashboard/sales?startDate=2026-02-01&endDate=2026-02-11",
            {
                headers: {
                    Cookie: "sid=abc",
                    "Content-Type": "application/json",
                },
                cache: "no-store",
            },
        );
        expect(res.headers.get("cache-control")).toBe("private, max-age=0, s-maxage=15");
        expect(res.headers.get("vary")).toBe("Authorization, Cookie");
        expect(body).toEqual({ data: [{ date: "2026-02-01", total_sales: 100 }] });
    });

    it("GET /api/pos/dashboard/orders/[id] preserves upstream payload and cache headers", async () => {
        (getProxyUrl as jest.Mock).mockReturnValue("http://backend/pos/dashboard/orders/o1");
        fetchMock.mockResolvedValue(
            new Response(JSON.stringify({ success: true, data: { id: "o1", order_no: "ORD-001" } }), {
                status: 200,
                headers: {
                    "content-type": "application/json",
                    "cache-control": "private, max-age=0, s-maxage=15",
                    vary: "Authorization, Cookie",
                },
            }),
        );

        const req = makeRequest("http://localhost/api/pos/dashboard/orders/o1", "sid=abc");
        const res = await GET_ORDER_DETAIL(req, { params: { id: "o1" } });
        const body = await res.json();

        expect(getProxyUrl).toHaveBeenCalledWith("GET", "/pos/dashboard/orders/o1");
        expect(res.status).toBe(200);
        expect(res.headers.get("cache-control")).toBe("private, max-age=0, s-maxage=15");
        expect(body).toEqual({ success: true, data: { id: "o1", order_no: "ORD-001" } });
    });
});
