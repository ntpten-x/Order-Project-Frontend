/** @jest-environment node */

import { NextRequest } from "next/server";
import { GET as GET_CURRENT } from "../../app/api/pos/shifts/current/route";
import { GET as GET_CURRENT_SUMMARY } from "../../app/api/pos/shifts/current/summary/route";
import { GET as GET_HISTORY } from "../../app/api/pos/shifts/history/route";
import { POST as POST_OPEN } from "../../app/api/pos/shifts/open/route";
import { POST as POST_CLOSE } from "../../app/api/pos/shifts/close/route";
import { POST as POST_CLOSE_PREVIEW } from "../../app/api/pos/shifts/close/preview/route";
import { GET as GET_SUMMARY_BY_ID } from "../../app/api/pos/shifts/summary/[id]/route";
import { getProxyUrl } from "../../lib/proxy-utils";

jest.mock("../../lib/proxy-utils", () => ({
    getProxyUrl: jest.fn((_method: string, path: string) => `http://backend${path}`),
}));

describe("POS shift proxy routes", () => {
    const fetchMock = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (global as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
        (getProxyUrl as jest.Mock).mockImplementation((_method: string, path: string) => `http://backend${path}`);
    });

    it("GET /api/pos/shifts/current maps backend 404 to null payload", async () => {
        fetchMock.mockResolvedValue(
            new Response(null, { status: 404 })
        );

        const req = new NextRequest("http://localhost/api/pos/shifts/current", {
            method: "GET",
            headers: { cookie: "sid=abc" },
        });
        const res = await GET_CURRENT(req);
        const payload = await res.json();

        expect(res.status).toBe(404);
        expect(payload).toBeNull();
    });

    it("GET /api/pos/shifts/current maps backend success:null to 404 null payload", async () => {
        fetchMock.mockResolvedValue(
            new Response(
                JSON.stringify({ success: true, data: null }),
                { status: 200, headers: { "content-type": "application/json" } }
            )
        );

        const req = new NextRequest("http://localhost/api/pos/shifts/current", {
            method: "GET",
            headers: { cookie: "sid=abc" },
        });
        const res = await GET_CURRENT(req);
        const payload = await res.json();

        expect(res.status).toBe(404);
        expect(payload).toBeNull();
    });

    it("GET /api/pos/shifts/current preserves backend error payload/status", async () => {
        fetchMock.mockResolvedValue(
            new Response(
                JSON.stringify({ success: false, error: { message: "forbidden-current" } }),
                { status: 403, headers: { "content-type": "application/json" } }
            )
        );

        const req = new NextRequest("http://localhost/api/pos/shifts/current", {
            method: "GET",
            headers: { cookie: "sid=abc" },
        });
        const res = await GET_CURRENT(req);
        const payload = await res.json();

        expect(res.status).toBe(403);
        expect(payload).toEqual({ success: false, error: { message: "forbidden-current" } });
    });

    it("GET summary routes preserve backend payload/status", async () => {
        fetchMock
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({ success: false, error: { message: "summary-forbidden" } }),
                    { status: 403, headers: { "content-type": "application/json" } }
                )
            )
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({ success: false, error: { message: "summary-not-found" } }),
                    { status: 404, headers: { "content-type": "application/json" } }
                )
            );

        const reqCurrent = new NextRequest("http://localhost/api/pos/shifts/current/summary", {
            method: "GET",
            headers: { cookie: "sid=abc" },
        });
        const resCurrent = await GET_CURRENT_SUMMARY(reqCurrent);
        const payloadCurrent = await resCurrent.json();

        const reqById = new NextRequest("http://localhost/api/pos/shifts/summary/s1", {
            method: "GET",
            headers: { cookie: "sid=abc" },
        });
        const resById = await GET_SUMMARY_BY_ID(reqById, { params: { id: "s1" } });
        const payloadById = await resById.json();

        expect(resCurrent.status).toBe(403);
        expect(payloadCurrent).toEqual({ success: false, error: { message: "summary-forbidden" } });
        expect(resById.status).toBe(404);
        expect(payloadById).toEqual({ success: false, error: { message: "summary-not-found" } });
    });

    it("GET /api/pos/shifts/history forwards query and preserves backend payload/status", async () => {
        fetchMock.mockResolvedValue(
            new Response(
                JSON.stringify({ success: false, error: { message: "history-fail" } }),
                { status: 409, headers: { "content-type": "application/json" } }
            )
        );

        const req = new NextRequest(
            "http://localhost/api/pos/shifts/history?page=2&limit=20&status=OPEN&q=user1",
            {
                method: "GET",
                headers: { cookie: "sid=abc" },
            }
        );

        const res = await GET_HISTORY(req);
        const payload = await res.json();

        expect(fetchMock).toHaveBeenCalledWith(
            "http://backend/pos/shifts/history?page=2&limit=20&status=OPEN&q=user1",
            expect.objectContaining({
                headers: expect.objectContaining({ Cookie: "sid=abc" }),
            })
        );
        expect(res.status).toBe(409);
        expect(payload).toEqual({ success: false, error: { message: "history-fail" } });
    });

    it("POST open/close/preview routes preserve backend status and forward csrf/cookie", async () => {
        fetchMock
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({ success: false, error: { message: "open-forbidden" } }),
                    { status: 403, headers: { "content-type": "application/json" } }
                )
            )
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({ success: false, error: { message: "close-preview-conflict" } }),
                    { status: 409, headers: { "content-type": "application/json" } }
                )
            )
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({ success: false, error: { message: "close-conflict" } }),
                    { status: 409, headers: { "content-type": "application/json" } }
                )
            );

        const openReq = new NextRequest("http://localhost/api/pos/shifts/open", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                cookie: "sid=abc",
                "x-csrf-token": "csrf123",
            },
            body: JSON.stringify({ start_amount: 100 }),
        });

        const closeReq = new NextRequest("http://localhost/api/pos/shifts/close", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                cookie: "sid=abc",
                "x-csrf-token": "csrf123",
            },
            body: JSON.stringify({ end_amount: 80 }),
        });

        const closePreviewReq = new NextRequest("http://localhost/api/pos/shifts/close/preview", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                cookie: "sid=abc",
                "x-csrf-token": "csrf123",
            },
            body: JSON.stringify({ end_amount: 80 }),
        });

        const openRes = await POST_OPEN(openReq);
        const closePreviewRes = await POST_CLOSE_PREVIEW(closePreviewReq);
        const closeRes = await POST_CLOSE(closeReq);
        const openPayload = await openRes.json();
        const closePreviewPayload = await closePreviewRes.json();
        const closePayload = await closeRes.json();

        expect(openRes.status).toBe(403);
        expect(openPayload).toEqual({ success: false, error: { message: "open-forbidden" } });
        expect(closePreviewRes.status).toBe(409);
        expect(closePreviewPayload).toEqual({ success: false, error: { message: "close-preview-conflict" } });
        expect(closeRes.status).toBe(409);
        expect(closePayload).toEqual({ success: false, error: { message: "close-conflict" } });

        expect(fetchMock).toHaveBeenNthCalledWith(
            1,
            "http://backend/pos/shifts/open",
            expect.objectContaining({
                method: "POST",
                headers: expect.objectContaining({
                    Cookie: "sid=abc",
                    "X-CSRF-Token": "csrf123",
                }),
            })
        );
        expect(fetchMock).toHaveBeenNthCalledWith(
            2,
            "http://backend/pos/shifts/close/preview",
            expect.objectContaining({
                method: "POST",
                headers: expect.objectContaining({
                    Cookie: "sid=abc",
                    "X-CSRF-Token": "csrf123",
                }),
            })
        );
        expect(fetchMock).toHaveBeenNthCalledWith(
            3,
            "http://backend/pos/shifts/close",
            expect.objectContaining({
                method: "POST",
                headers: expect.objectContaining({
                    Cookie: "sid=abc",
                    "X-CSRF-Token": "csrf123",
                }),
            })
        );
    });
});
