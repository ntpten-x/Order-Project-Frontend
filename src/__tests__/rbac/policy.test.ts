import { findRouteRule } from "../../lib/rbac/permission-matrix";
import { requiredRolesForPath } from "../../lib/rbac/policy";

describe("rbac policy resolver", () => {
    it("marks login as public", () => {
        const policy = requiredRolesForPath("/login", "GET");
        expect(policy.isPublic).toBe(true);
        expect(policy.deniedByDefault).toBe(false);
        expect(policy.resourceKey).toBe("public.login");
    });

    it("resolves users api to admin and manager roles", () => {
        const policy = requiredRolesForPath("/api/users", "GET");
        expect(policy.deniedByDefault).toBe(false);
        expect(policy.allowed).toEqual(["Admin", "Manager"]);
        expect(policy.resourceKey).toBe("api.users");
    });

    it("applies deny-by-default for unknown api routes", () => {
        const policy = requiredRolesForPath("/api/internal/new-route", "GET");
        expect(policy.deniedByDefault).toBe(true);
        expect(policy.allowed).toEqual([]);
        expect(policy.resourceKey).toBe("api.unknown");
    });

    it("prefers specific match over broad /pos prefix", () => {
        const matched = findRouteRule("/pos/products/manage/create", "GET");
        expect(matched?.resourceKey).toBe("page.pos.products.manage");
    });

    it("uses method-specific table rules", () => {
        const readRule = findRouteRule("/api/pos/tables", "GET");
        const writeRule = findRouteRule("/api/pos/tables", "POST");

        expect(readRule?.resourceKey).toBe("api.pos.tables");
        expect(writeRule?.resourceKey).toBe("api.pos.tables.manage");
    });
});
