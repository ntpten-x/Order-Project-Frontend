/** @jest-environment node */

import { NextRequest } from "next/server";
import { GET } from "../../app/api/system/health/route";
import { getProxyUrl } from "../../lib/proxy-utils";

jest.mock("../../lib/proxy-utils", () => ({
    getProxyUrl: jest.fn(),
}));

describe("GET /api/system/health", () => {
    const fetchMock = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (global as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
        (getProxyUrl as jest.Mock).mockReturnValue("http://backend/system/health");
    });

    it("forwards request to backend and returns payload", async () => {
        fetchMock.mockResolvedValue(
            new Response(
                JSON.stringify({
                    success: true,
                    data: { overallLevel: "ok", checkedAt: "2026-02-16T00:00:00.000Z" },
                }),
                {
                    status: 200,
                    headers: { "content-type": "application/json" },
                }
            )
        );

        const req = new NextRequest("http://localhost/api/system/health", {
            method: "GET",
            headers: { cookie: "token=abc" },
        });

        const res = await GET(req);
        const body = await res.json();

        expect(fetchMock).toHaveBeenCalledWith(
            "http://backend/system/health",
            expect.objectContaining({
                method: "GET",
                headers: expect.objectContaining({
                    Cookie: "token=abc",
                    Accept: "application/json",
                }),
            })
        );
        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.overallLevel).toBe("ok");
    });
});
