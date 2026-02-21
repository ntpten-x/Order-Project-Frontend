/** @jest-environment node */

import { NextRequest } from "next/server";
import { GET, DELETE } from "../../app/api/auth/active-branch/route";

describe("auth active-branch route", () => {
    it("GET returns active_branch_id from cookie", async () => {
        const request = new NextRequest("http://localhost/api/auth/active-branch", {
            method: "GET",
            headers: {
                cookie: "active_branch_id=branch-123",
            },
        });

        const response = await GET(request);
        const payload = await response.json();

        expect(response.status).toBe(200);
        expect(payload).toEqual({ active_branch_id: "branch-123" });
    });

    it("DELETE clears active_branch_id cookie", async () => {
        const request = new NextRequest("http://localhost/api/auth/active-branch", {
            method: "DELETE",
            headers: {
                "x-forwarded-proto": "https",
            },
        });

        const response = await DELETE(request);
        const payload = await response.json();
        const setCookie = response.headers.get("set-cookie") || "";

        expect(response.status).toBe(200);
        expect(payload).toEqual({ active_branch_id: null });
        expect(setCookie).toContain("active_branch_id=");
        expect(setCookie).toContain("Max-Age=0");
    });
});
