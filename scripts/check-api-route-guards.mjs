import fs from "fs";
import path from "path";

const apiRoot = path.resolve(process.cwd(), "src/app/api");

const allowNoGuard = new Set([
  "src/app/api/auth/logout/route.ts",
  "src/app/api/health/route.ts",
]);

function getRouteFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getRouteFiles(full));
      continue;
    }
    if (entry.isFile() && entry.name === "route.ts") {
      files.push(full);
    }
  }

  return files;
}

const routes = getRouteFiles(apiRoot);
const violations = [];
const hardcoded500 = [];

for (const file of routes) {
  const content = fs.readFileSync(file, "utf8");
  const relPath = path.relative(process.cwd(), file).replace(/\\/g, "/");

  if (/status\s*:\s*500/.test(content)) {
    hardcoded500.push(relPath);
  }

  if (allowNoGuard.has(relPath)) continue;

  const hasProxy = /\bproxyToBackend\s*\(/.test(content);
  const hasRouteError = /\bhandleApiRouteError\s*\(/.test(content);
  if (!hasProxy && !hasRouteError) {
    violations.push(relPath);
  }
}

if (hardcoded500.length > 0) {
  console.error("[api-route-guards] hardcoded status 500 found:");
  for (const file of hardcoded500) {
    console.error(` - ${file}`);
  }
}

if (violations.length > 0) {
  console.error("[api-route-guards] missing proxy/route-error guard:");
  for (const file of violations) {
    console.error(` - ${file}`);
  }
}

if (hardcoded500.length > 0 || violations.length > 0) {
  process.exit(1);
}

console.log(`[api-route-guards] passed (${routes.length} routes checked).`);
