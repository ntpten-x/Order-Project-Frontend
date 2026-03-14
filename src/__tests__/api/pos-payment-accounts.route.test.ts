/** @jest-environment node */

import { GET } from "../../app/api/pos/payment-accounts/accounts/route";
import { proxyToBackend } from "../../app/api/_utils/proxy-to-backend";
import type { NextRequest } from "next/server";

jest.mock("../../app/api/_utils/proxy-to-backend", () => ({
    proxyToBackend: jest.fn(),
}));

describe("GET /api/pos/payment-accounts/accounts", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (proxyToBackend as jest.Mock).mockResolvedValue(new Response(null, { status: 200 }));
    });

    it("forwards the full search string to backend for pagination and filters", async () => {
        const request = {
            nextUrl: new URL(
                "http://localhost/api/pos/payment-accounts/accounts?page=3&limit=25&q=prompt&status=active&shopId=shop-1"
            ),
        } as unknown as NextRequest;

        await GET(request);

        expect(proxyToBackend).toHaveBeenCalledWith(
            request,
            expect.objectContaining({
                method: "GET",
                url: expect.stringContaining(
                    "/pos/payment-accounts/accounts?page=3&limit=25&q=prompt&status=active&shopId=shop-1"
                ),
            })
        );
    });
});
