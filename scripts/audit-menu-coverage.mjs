import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcRoot = path.join(root, "src");
const rulesFile = path.join(srcRoot, "lib", "rbac", "menu-visibility.ts");
const reportPath = path.join(root, "logs", "menu-coverage-report.json");

const targetFiles = [
  path.join(srcRoot, "components", "BottomNavigation.tsx"),
  path.join(srcRoot, "components", "pos", "POSBottomNavigation.tsx"),
  path.join(srcRoot, "components", "stock", "StockBottomNavigation.tsx"),
  path.join(srcRoot, "components", "users", "UsersBottomNavigation.tsx"),
  path.join(srcRoot, "components", "branch", "BranchBottomNavigation.tsx"),
  path.join(srcRoot, "app", "(main)", "page.tsx"),
];

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function collectMenuKeysFromContent(content) {
  const keys = new Set();
  const regex = /menu\.[a-zA-Z0-9_.]+/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    keys.add(match[0]);
  }
  return keys;
}

function collectRuleKeys(content) {
  const keys = new Set();
  const regex = /"(menu\.[a-zA-Z0-9_.]+)"\s*:/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    keys.add(match[1]);
  }
  return keys;
}

function collectPermissionChecks(content) {
  const keys = new Set();
  const regex = /can\(\s*["'`]([a-zA-Z0-9_.-]+)["'`]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    keys.add(match[1]);
  }
  return keys;
}

const rulesContent = read(rulesFile);
const ruleKeys = collectRuleKeys(rulesContent);

const usedMenuKeys = new Set();
const permissionKeys = new Set();
const scannedFiles = [];

for (const file of targetFiles) {
  if (!fs.existsSync(file)) continue;
  const content = read(file);
  collectMenuKeysFromContent(content).forEach((key) => usedMenuKeys.add(key));
  collectPermissionChecks(content).forEach((key) => permissionKeys.add(key));
  scannedFiles.push(path.relative(root, file).replace(/\\/g, "/"));
}

const missingInRules = [...usedMenuKeys].filter((key) => !ruleKeys.has(key)).sort();
const unusedRuleKeys = [...ruleKeys].filter((key) => !usedMenuKeys.has(key)).sort();

const report = {
  generatedAt: new Date().toISOString(),
  scannedFiles,
  menuKeys: {
    usedCount: usedMenuKeys.size,
    ruleCount: ruleKeys.size,
    missingInRules,
    unusedRuleKeys,
  },
  permissionChecks: {
    uniqueResourceKeys: [...permissionKeys].sort(),
  },
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");

if (missingInRules.length > 0) {
  console.error("[menu-coverage] FAIL missing menu keys in rules:");
  for (const key of missingInRules) {
    console.error(`- ${key}`);
  }
  console.error(`[menu-coverage] report: ${path.relative(root, reportPath)}`);
  process.exit(1);
}

console.log(`[menu-coverage] PASS used=${usedMenuKeys.size} rules=${ruleKeys.size}`);
console.log(`[menu-coverage] report: ${path.relative(root, reportPath)}`);
