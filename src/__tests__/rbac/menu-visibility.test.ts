import { canViewMenu } from "../../lib/rbac/menu-visibility";
import type { EffectiveRolePermissionRow, PermissionAction } from "../../types/api/permissions";

function makeRow(partial: Partial<EffectiveRolePermissionRow> & { resourceKey: string }): EffectiveRolePermissionRow {
    return {
        resourceKey: partial.resourceKey,
        pageLabel: partial.pageLabel ?? partial.resourceKey,
        route: partial.route ?? "/",
        canAccess: partial.canAccess ?? false,
        canView: partial.canView ?? false,
        canCreate: partial.canCreate ?? false,
        canUpdate: partial.canUpdate ?? false,
        canDelete: partial.canDelete ?? false,
        dataScope: partial.dataScope ?? "none",
    };
}

function buildContext(rows: EffectiveRolePermissionRow[]) {
    const map = new Map(rows.map((row) => [row.resourceKey, row]));

    const can = (resourceKey: string, action: PermissionAction = "access") => {
        const row = map.get(resourceKey);
        if (!row) return false;
        if (action === "access") return row.canAccess;
        if (action === "view") return row.canView;
        if (action === "create") return row.canCreate;
        if (action === "update") return row.canUpdate;
        return row.canDelete;
    };

    const canAny = (checks: Array<{ resourceKey: string; action?: PermissionAction }>) =>
        checks.some((check) => can(check.resourceKey, check.action ?? "access"));

    return { rows, can, canAny };
}

describe("menu visibility policy", () => {
    it("uses fallback page permission when explicit menu permission does not exist", () => {
        const rows = [makeRow({ resourceKey: "orders.page", canView: true })];
        const visible = canViewMenu("menu.pos.orders", buildContext(rows));
        expect(visible).toBe(true);
    });

    it("uses explicit menu permission when explicit row exists", () => {
        const rows = [
            makeRow({ resourceKey: "orders.page", canView: true }),
            makeRow({ resourceKey: "menu.pos.orders", canView: false }),
        ];
        const visible = canViewMenu("menu.pos.orders", buildContext(rows));
        expect(visible).toBe(false);
    });

    it("allows menu when explicit menu permission is granted even without fallback permission", () => {
        const rows = [makeRow({ resourceKey: "menu.pos.orders", canView: true })];
        const visible = canViewMenu("menu.pos.orders", buildContext(rows));
        expect(visible).toBe(true);
    });

    it("defaults to visible for unknown menu keys", () => {
        const visible = canViewMenu("menu.unknown.any", buildContext([]));
        expect(visible).toBe(true);
    });
});
