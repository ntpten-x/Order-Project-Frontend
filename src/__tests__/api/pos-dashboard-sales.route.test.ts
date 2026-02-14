/** @jest-environment node */

import { GET } from "../../app/api/pos/dashboard/sales/route";
import { getProxyUrl } from "../../lib/proxy-utils";
import type { NextRequest } from "next/server";

jest.mock("../../lib/proxy-utils", () => ({
    getProxyUrl: jest.fn(),
}));

describe("GET /api/pos/dashboard/sales", () => {
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

    it("calls backend with date filters and returns payload", async () => {
        (getProxyUrl as jest.Mock).mockReturnValue("http://backend/pos/dashboard/sales?startDate=2026-02-01&endDate=2026-02-11");
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({ data: [{ date: "2026-02-01", total_sales: 100 }] }),
        });

        const req = makeRequest(
            "http://localhost/api/pos/dashboard/sales?startDate=2026-02-01&endDate=2026-02-11",
            "sid=abc"
        );
        const res = await GET(req);
        const body = await res.json();

        expect(getProxyUrl).toHaveBeenCalledWith("GET", "/pos/dashboard/sales?startDate=2026-02-01&endDate=2026-02-11");
        expect(fetchMock).toHaveBeenCalledWith("http://backend/pos/dashboard/sales?startDate=2026-02-01&endDate=2026-02-11", {
            headers: {
                Cookie: "sid=abc",
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });
        expect(res.status).toBe(200);
        expect(body).toEqual({ data: [{ date: "2026-02-01", total_sales: 100 }] });
    });

    it("returns upstream status when backend response is not ok", async () => {
        (getProxyUrl as jest.Mock).mockReturnValue("http://backend/pos/dashboard/sales");
        fetchMock.mockResolvedValue({
            ok: false,
            status: 502,
        });

        const req = makeRequest("http://localhost/api/pos/dashboard/sales");
        const res = await GET(req);
        const body = await res.json();

        expect(res.status).toBe(502);
        expect(body).toEqual({ error: "Failed to fetch sales summary" });
    });
});
