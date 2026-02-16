/** @jest-environment node */

import { NextRequest } from "next/server";
import { POST } from "../../app/api/auth/login/route";
import { getProxyUrl } from "../../lib/proxy-utils";

jest.mock("../../lib/proxy-utils", () => ({
    getProxyUrl: jest.fn((_method: string, path: string) => `http://backend${path}`),
}));

describe("POST /api/auth/login", () => {
    const fetchMock = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (global as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
        (getProxyUrl as jest.Mock).mockImplementation((_method: string, path: string) => `http://backend${path}`);
    });

    it("does not expose token in response body and forwards backend cookies", async () => {
        fetchMock.mockResolvedValue(
            new Response(
                JSON.stringify({
                    success: true,
                    data: {
                        user: {
                            id: "u1",
                            username: "admin",
                            role: "Admin",
                        },
                    },
                }),
                {
                    status: 200,
                    headers: {
                        "content-type": "application/json",
                        "set-cookie": "token=abc123; HttpOnly; Path=/; SameSite=Lax",
                    },
                }
            )
        );

        const req = new NextRequest("http://localhost/api/auth/login", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "x-csrf-token": "csrf123",
                cookie: "_csrf=secret",
            },
            body: JSON.stringify({ username: "admin", password: "123456" }),
        });

        const res = await POST(req);
        const payload = await res.json();

        expect(res.status).toBe(200);
        expect(payload).toEqual({
            message: "Login successful",
            user: {
                id: "u1",
                username: "admin",
                role: "Admin",
            },
        });
        expect((payload as Record<string, unknown>).token).toBeUndefined();
        expect(res.headers.get("set-cookie")).toContain("token=abc123");

        expect(fetchMock).toHaveBeenCalledWith(
            "http://backend/auth/login",
            expect.objectContaining({
                method: "POST",
                headers: expect.objectContaining({
                    "X-CSRF-Token": "csrf123",
                    Cookie: "_csrf=secret",
                }),
            })
        );
    });
});
