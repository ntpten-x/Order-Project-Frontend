/** @jest-environment node */

import { NextRequest } from "next/server";
import { PUT } from "../../app/api/permissions/users/[id]/route";
import { getProxyUrl } from "../../lib/proxy-utils";

jest.mock("../../lib/proxy-utils", () => ({
    getProxyUrl: jest.fn(),
}));

describe("PUT /api/permissions/users/:id", () => {
    const fetchMock = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (global as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
        (getProxyUrl as jest.Mock).mockImplementation(
            (_method: string, path: string) => `http://backend${path}`
        );
    });

    it.each([401, 403, 409])("preserves backend status %s", async (statusCode) => {
        fetchMock.mockResolvedValue(
            new Response(
                JSON.stringify({
                    success: false,
                    error: { message: `backend-status-${statusCode}` },
                }),
                {
                    status: statusCode,
                    headers: { "content-type": "application/json" },
                }
            )
        );

        const req = new NextRequest("http://localhost/api/permissions/users/u1", {
            method: "PUT",
            headers: {
                "content-type": "application/json",
                cookie: "sid=abc",
                "x-csrf-token": "csrf123",
            },
            body: JSON.stringify({ permissions: [] }),
        });

        const res = await PUT(req, { params: { id: "u1" } });
        const payload = await res.json();

        expect(res.status).toBe(statusCode);
        expect(payload).toEqual({ error: `backend-status-${statusCode}` });
        expect(fetchMock).toHaveBeenCalledWith(
            "http://backend/permissions/users/u1",
            expect.objectContaining({
                method: "PUT",
                headers: expect.objectContaining({
                    Cookie: "sid=abc",
                    "X-CSRF-Token": "csrf123",
                }),
            })
        );
    });
});
