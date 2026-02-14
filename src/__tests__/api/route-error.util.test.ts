/** @jest-environment node */

import { handleApiRouteError } from "../../app/api/_utils/route-error";
import { BackendHttpError } from "../../utils/api/backendResponse";

describe("handleApiRouteError", () => {
    it.each([401, 403, 409])("uses status from BackendHttpError: %s", async (statusCode) => {
        const res = handleApiRouteError(new BackendHttpError(statusCode, `backend-${statusCode}`));
        const payload = await res.json();

        expect(res.status).toBe(statusCode);
        expect(payload).toEqual({ error: `backend-${statusCode}` });
    });

    it("infers 403 for forbidden message", async () => {
        const res = handleApiRouteError(new Error("Forbidden to access this resource"));
        const payload = await res.json();

        expect(res.status).toBe(403);
        expect(payload).toEqual({ error: "Forbidden to access this resource" });
    });

    it("falls back to 500 for unknown errors", async () => {
        const res = handleApiRouteError({ foo: "bar" }, "fallback-message");
        const payload = await res.json();

        expect(res.status).toBe(500);
        expect(payload).toEqual({ error: "fallback-message" });
    });
});
