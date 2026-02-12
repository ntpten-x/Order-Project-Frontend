/** @jest-environment node */

import { NextRequest } from "next/server";
import { GET } from "../../app/api/permissions/audits/route";
import { getProxyUrl } from "../../lib/proxy-utils";

jest.mock("../../lib/proxy-utils", () => ({
    getProxyUrl: jest.fn(),
}));

describe("GET /api/permissions/audits", () => {
    const fetchMock = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (global as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
        (getProxyUrl as jest.Mock).mockReturnValue("http://backend/permissions/audits");
    });

    it("forwards query and preserves backend status", async () => {
        fetchMock.mockResolvedValue(
            new Response(
                JSON.stringify({ success: false, error: { message: "Forbidden from backend" } }),
                {
                    status: 403,
                    headers: { "content-type": "application/json" },
                }
            )
        );

        const req = new NextRequest(
            "http://localhost/api/permissions/audits?targetType=user&targetId=u1&actionType=update_overrides&page=2&limit=20",
            {
                method: "GET",
                headers: { cookie: "sid=abc" },
            }
        );

        const res = await GET(req);
        const payload = await res.json();

        expect(fetchMock).toHaveBeenCalledWith(
            "http://backend/permissions/audits?targetType=user&targetId=u1&actionType=update_overrides&page=2&limit=20",
            expect.objectContaining({
                method: "GET",
                headers: expect.objectContaining({ Cookie: "sid=abc" }),
            })
        );
        expect(res.status).toBe(403);
        expect(payload).toEqual({ error: "Forbidden from backend" });
    });
});
