/** @jest-environment node */

import { splitSetCookieHeader } from "../../app/api/_utils/cookie-forward";

describe("cookie-forward splitSetCookieHeader", () => {
    it("keeps Expires date comma within a single cookie", () => {
        const header = [
            "token=abc; Max-Age=36000; Path=/; Expires=Thu, 19 Feb 2026 13:14:25 GMT; HttpOnly; SameSite=Lax",
            "_csrf=xyz; Path=/; HttpOnly; SameSite=Lax",
        ].join(", ");

        const result = splitSetCookieHeader(header);

        expect(result).toHaveLength(2);
        expect(result[0]).toContain("Expires=Thu, 19 Feb 2026 13:14:25 GMT");
        expect(result[1]).toBe("_csrf=xyz; Path=/; HttpOnly; SameSite=Lax");
    });
});
