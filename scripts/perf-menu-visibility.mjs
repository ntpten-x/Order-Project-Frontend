import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";

const root = process.cwd();
const rulesFile = path.join(root, "src", "lib", "rbac", "menu-visibility.ts");
const source = fs.readFileSync(rulesFile, "utf8");

const keyRegex = /"(menu\.[a-zA-Z0-9_.]+)"\s*:/g;
const menuKeys = [];
let match;
while ((match = keyRegex.exec(source)) !== null) {
  menuKeys.push(match[1]);
}

const rules = Object.fromEntries(
  menuKeys.map((key) => [
    key,
    {
      explicitAnyOf: [{ resourceKey: key, action: "view" }],
      fallbackAnyOf: [{ resourceKey: "orders.page", action: "view" }],
      defaultVisible: true,
    },
  ])
);

const rows = [
  { resourceKey: "orders.page", canView: true, canAccess: true },
  { resourceKey: "products.page", canView: true, canAccess: true },
  { resourceKey: "menu.pos.orders", canView: true, canAccess: true },
  { resourceKey: "menu.main.stock", canView: false, canAccess: false },
];

const rowMap = new Map(rows.map((row) => [row.resourceKey, row]));
const rowSet = new Set(rows.map((row) => row.resourceKey));

const can = (resourceKey, action = "access") => {
  const row = rowMap.get(resourceKey);
  if (!row) return false;
  if (action === "view") return Boolean(row.canView);
  return Boolean(row.canAccess);
};
const canAny = (checks) => checks.some((check) => can(check.resourceKey, check.action ?? "access"));

function canViewMenu(menuKey) {
  const rule = rules[menuKey];
  if (!rule) return true;

  const explicitAnyOf = rule.explicitAnyOf ?? [];
  if (explicitAnyOf.length > 0 && explicitAnyOf.some((check) => rowSet.has(check.resourceKey))) {
    return canAny(explicitAnyOf);
  }

  if (rule.fallbackAnyOf && rule.fallbackAnyOf.length > 0) {
    return canAny(rule.fallbackAnyOf);
  }

  return rule.defaultVisible ?? true;
}

const iterations = Number(process.env.MENU_VIS_BENCH_ITERS || "1000000");
for (let i = 0; i < 50000; i += 1) {
  canViewMenu(menuKeys[i % menuKeys.length]);
}

const started = performance.now();
let visible = 0;
for (let i = 0; i < iterations; i += 1) {
  if (canViewMenu(menuKeys[i % menuKeys.length])) visible += 1;
}
const durationMs = performance.now() - started;
const opsPerSec = (iterations / durationMs) * 1000;
const avgUs = (durationMs * 1000) / iterations;

console.log(
  JSON.stringify(
    {
      benchmark: "menu-visibility",
      menuKeyCount: menuKeys.length,
      iterations,
      durationMs: Number(durationMs.toFixed(3)),
      opsPerSec: Number(opsPerSec.toFixed(2)),
      avgMicrosecondsPerCheck: Number(avgUs.toFixed(4)),
      visibleCount: visible,
    },
    null,
    2
  )
);
