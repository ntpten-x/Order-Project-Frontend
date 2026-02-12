import fs from "fs";
import path from "path";
import { inferPermissionFromPath } from "../../lib/rbac/page-permissions";

function toRoutePath(filePath: string, root: string): string {
  const relative = path.relative(root, filePath).replace(/\\/g, "/");
  const withoutPage = relative.replace(/(^|\/)page\.tsx$/, "");
  if (!withoutPage) return "/";
  const normalizedDynamic = withoutPage
    .replace(/\[\.\.\.[^\]]+\]/g, "dynamic")
    .replace(/\[[^\]]+\]/g, "id");
  return `/${normalizedDynamic}`;
}

function getPageFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getPageFiles(full));
      continue;
    }
    if (entry.isFile() && entry.name === "page.tsx") {
      files.push(full);
    }
  }

  return files;
}

describe("page permission mapping coverage", () => {
  it("maps all main pages to a permission resource", () => {
    const root = path.resolve(process.cwd(), "src/app/(main)");
    const pageFiles = getPageFiles(root);
    const missing: string[] = [];

    for (const file of pageFiles) {
      const routePath = toRoutePath(file, root);
      const mapped = inferPermissionFromPath(routePath);
      if (!mapped) {
        missing.push(routePath);
      }
    }

    expect(missing).toEqual([]);
  });
});
