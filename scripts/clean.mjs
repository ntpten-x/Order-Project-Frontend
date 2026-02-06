import fs from "node:fs";
import path from "node:path";

const targets = [
  ".next",
  ".swc",
  ".turbo",
  path.join("node_modules", ".cache"),
];

for (const target of targets) {
  fs.rmSync(path.join(process.cwd(), target), { recursive: true, force: true });
}

console.log(`Cleaned: ${targets.join(", ")}`);

