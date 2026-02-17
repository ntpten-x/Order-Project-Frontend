/** @jest-environment node */

import { NextRequest } from "next/server";
import { proxyToBackend } from "../../app/api/_utils/proxy-to-backend";

describe("proxyToBackend forwarded ip hardening", () => {
    const fetchMock = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (global as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
        delete process.env.TRUST_PROXY_CHAIN;
    });

    afterEach(() => {
        delete process.env.TRUST_PROXY_CHAIN;
    });

    it("does not forward x-forwarded-for when trusted proxy chain is not configured", async () => {
        fetchMock.mockResolvedValue(
            new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { "content-type": "application/json" },
            })
        );

        const req = new NextRequest("http://localhost/api/system/health", {
            method: "GET",
            headers: {
                cookie: "sid=abc",
                "x-forwarded-for": "198.51.100.5, 10.0.0.2",
            },
        });

        await proxyToBackend(req, { url: "http://backend/system/health", method: "GET" });

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const options = fetchMock.mock.calls[0]?.[1] as RequestInit;
        expect(options.headers).toEqual(
            expect.not.objectContaining({
                "X-Forwarded-For": expect.any(String),
            })
        );
    });

    it("forwards sanitized x-forwarded-for when trusted proxy chain is configured", async () => {
        process.env.TRUST_PROXY_CHAIN = "1";
        fetchMock.mockResolvedValue(
            new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { "content-type": "application/json" },
            })
        );

        const req = new NextRequest("http://localhost/api/system/health", {
            method: "GET",
            headers: {
                "x-forwarded-for": "198.51.100.5, bad-token, 2001:db8::7",
            },
        });

        await proxyToBackend(req, { url: "http://backend/system/health", method: "GET" });

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const options = fetchMock.mock.calls[0]?.[1] as RequestInit;
        expect(options.headers).toEqual(
            expect.objectContaining({
                "X-Forwarded-For": "198.51.100.5, 2001:db8::7",
            })
        );
    });

    it("falls back to request.ip when trusted proxy chain is configured without x-forwarded-for", async () => {
        process.env.TRUST_PROXY_CHAIN = "1";
        fetchMock.mockResolvedValue(
            new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { "content-type": "application/json" },
            })
        );

        const req = new NextRequest("http://localhost/api/system/health", {
            method: "GET",
        });
        Object.defineProperty(req, "ip", {
            configurable: true,
            value: "203.0.113.10",
        });

        await proxyToBackend(req, { url: "http://backend/system/health", method: "GET" });

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const options = fetchMock.mock.calls[0]?.[1] as RequestInit;
        expect(options.headers).toEqual(
            expect.objectContaining({
                "X-Forwarded-For": "203.0.113.10",
            })
        );
    });
});
