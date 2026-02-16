/** @jest-environment node */

import { NextRequest } from "next/server";
import { middleware } from "../../middleware";

function toBase64Url(value: string) {
    return Buffer.from(value, "utf8")
        .toString("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
}

function makeToken(role: "Admin" | "Manager" | "Employee") {
    const header = toBase64Url(JSON.stringify({ alg: "none", typ: "JWT" }));
    const payload = toBase64Url(JSON.stringify({ role }));
    return `${header}.${payload}.`;
}

function makeRequest(pathname: string, method: string, token?: string) {
    const headers: Record<string, string> = {};
    if (token) headers.cookie = `token=${token}`;
    return new NextRequest(`http://localhost${pathname}`, { method, headers });
}

describe("middleware permission policy", () => {
    it("denies unknown api route by default even with valid token", async () => {
        const req = makeRequest("/api/unknown-resource", "GET", makeToken("Admin"));
        const res = await middleware(req);
        const body = await res.json();

        expect(res.status).toBe(403);
        expect(body.error).toContain("deny-by-default");
    });

    it("allows known api route when token is present (role is checked downstream)", async () => {
        const req = makeRequest("/api/roles/getAll", "GET", makeToken("Manager"));
        const res = await middleware(req);

        expect(res.headers.get("x-middleware-next")).toBe("1");
    });

    it("allows manager access to users api", async () => {
        const req = makeRequest("/api/users", "GET", makeToken("Manager"));
        const res = await middleware(req);

        expect(res.headers.get("x-middleware-next")).toBe("1");
    });

    it("redirects protected page to login when no token is present", async () => {
        const req = makeRequest("/users", "GET");
        const res = await middleware(req);

        expect(res.status).toBe(307);
        expect(res.headers.get("location")).toContain("/login");
    });
});
