/** @jest-environment node */

import { GET } from "../../app/api/health/route";

describe("GET /api/health", () => {
    it("returns healthy payload", async () => {
        const res = await GET();
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.ok).toBe(true);
        expect(body.service).toBe("frontend");
        expect(typeof body.timestamp).toBe("string");
        expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
    });
});
