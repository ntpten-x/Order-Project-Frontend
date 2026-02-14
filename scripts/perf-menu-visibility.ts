import { performance } from "node:perf_hooks";
import { MENU_VISIBILITY_RULES, canViewMenu } from "../src/lib/rbac/menu-visibility";
import type { EffectiveRolePermissionRow, PermissionAction } from "../src/types/api/permissions";

function makeRow(resourceKey: string, view = true): EffectiveRolePermissionRow {
    return {
        resourceKey,
        pageLabel: resourceKey,
        route: "/",
        canAccess: view,
        canView: view,
        canCreate: false,
        canUpdate: false,
        canDelete: false,
        dataScope: view ? "branch" : "none",
    };
}

const rows: EffectiveRolePermissionRow[] = [
    makeRow("orders.page"),
    makeRow("products.page"),
    makeRow("shifts.page"),
    makeRow("shop_profile.page"),
    makeRow("stock.orders.page", false),
    makeRow("stock.ingredients.page", false),
    makeRow("stock.ingredients_unit.page", false),
];

const byResource = new Map(rows.map((row) => [row.resourceKey, row]));
const can = (resourceKey: string, action: PermissionAction = "access") => {
    const row = byResource.get(resourceKey);
    if (!row) return false;
    if (action === "access") return row.canAccess;
    if (action === "view") return row.canView;
    if (action === "create") return row.canCreate;
    if (action === "update") return row.canUpdate;
    return row.canDelete;
};
const canAny = (checks: Array<{ resourceKey: string; action?: PermissionAction }>) =>
    checks.some((check) => can(check.resourceKey, check.action ?? "access"));

const menuKeys = Object.keys(MENU_VISIBILITY_RULES);
const iterations = Number(process.env.MENU_VIS_BENCH_ITERS || "500000");

const warmupRuns = 50000;
for (let i = 0; i < warmupRuns; i += 1) {
    canViewMenu(menuKeys[i % menuKeys.length], { rows, can, canAny });
}

const startedAt = performance.now();
let visibleCount = 0;
for (let i = 0; i < iterations; i += 1) {
    if (canViewMenu(menuKeys[i % menuKeys.length], { rows, can, canAny })) {
        visibleCount += 1;
    }
}
const durationMs = performance.now() - startedAt;
const opsPerSec = (iterations / durationMs) * 1000;
const avgUs = (durationMs * 1000) / iterations;

console.log(
    JSON.stringify(
        {
            benchmark: "menu-visibility",
            iterations,
            menuKeys: menuKeys.length,
            durationMs: Number(durationMs.toFixed(3)),
            opsPerSec: Number(opsPerSec.toFixed(2)),
            avgMicrosecondsPerCheck: Number(avgUs.toFixed(4)),
            visibleCount,
        },
        null,
        2
    )
);
