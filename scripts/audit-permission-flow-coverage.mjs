import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcRoot = path.join(root, "src");
const outputPath = path.join(root, "logs", "permission-flow-coverage.md");

const includeExtensions = new Set([".ts", ".tsx"]);
const skipDirs = new Set(["node_modules", ".next", "dist", "coverage"]);

function walk(dir, acc = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (skipDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, acc);
      continue;
    }
    if (entry.isFile() && includeExtensions.has(path.extname(entry.name))) {
      acc.push(full);
    }
  }
  return acc;
}

function findAll(content, regex) {
  const values = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    values.push(match[1]);
  }
  return values;
}

const files = walk(srcRoot);
const rows = [];
const uniqueKeys = new Set();

for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  const canKeys = findAll(content, /can\(\s*["'`]([^"'`]+)["'`]/g);
  const canAnyKeys = findAll(content, /resourceKey:\s*["'`]([^"'`]+)["'`]/g);
  const menuKeys = findAll(content, /(menu\.[a-zA-Z0-9_.]+)/g);
  const all = [...canKeys, ...canAnyKeys, ...menuKeys];
  if (all.length === 0) continue;

  all.forEach((key) => uniqueKeys.add(key));
  rows.push({
    file: path.relative(root, file).replace(/\\/g, "/"),
    count: all.length,
    keys: Array.from(new Set(all)).sort(),
  });
}

rows.sort((a, b) => b.count - a.count || a.file.localeCompare(b.file));

const lines = [
  "# Permission Flow Coverage",
  "",
  `Generated: ${new Date().toISOString()}`,
  `Files with permission/menu checks: ${rows.length}`,
  `Unique keys discovered: ${uniqueKeys.size}`,
  "",
  "## File Coverage",
  "",
];

for (const row of rows) {
  lines.push(`- ${row.file} (${row.count})`);
  lines.push(`  - ${row.keys.join(", ")}`);
}

lines.push("", "## Unique Keys", "");
for (const key of Array.from(uniqueKeys).sort()) {
  lines.push(`- ${key}`);
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, lines.join("\n"), "utf8");

console.log(`[permission-flow] files=${rows.length} unique_keys=${uniqueKeys.size}`);
console.log(`[permission-flow] report: ${path.relative(root, outputPath)}`);
