/** @jest-environment node */

import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { GET } from "../../app/api/csrf/route";

jest.mock("next/headers", () => ({
    cookies: jest.fn(),
}));

describe("GET /api/csrf", () => {
    const fetchMock = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (global as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
        process.env.BACKEND_API_INTERNAL = "http://backend";

        (cookies as jest.Mock).mockReturnValue({
            getAll: () => [{ name: "token", value: "abc123" }],
        });
    });

    it("forwards backend Set-Cookie when retry request succeeds", async () => {
        fetchMock
            .mockResolvedValueOnce(
                new Response("failed", {
                    status: 500,
                    headers: { "content-type": "text/plain" },
                })
            )
            .mockResolvedValueOnce(
                new Response(JSON.stringify({ csrfToken: "retry-token" }), {
                    status: 200,
                    headers: {
                        "content-type": "application/json",
                        "set-cookie": "_csrf=retry-token; HttpOnly; Path=/; SameSite=Lax",
                    },
                })
            );

        const request = new NextRequest("http://localhost/api/csrf", { method: "GET" });
        const response = await GET(request);
        const payload = await response.json();

        expect(response.status).toBe(200);
        expect(payload).toEqual({ csrfToken: "retry-token" });
        expect(response.headers.get("set-cookie")).toContain("_csrf=retry-token");
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });
});
