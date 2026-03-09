import fs from "node:fs";
import path from "node:path";

const targets = [
  ".next",
  ".next-build",
  ".swc",
  ".turbo",
  path.join("node_modules", ".cache"),
];

const cleaned = [];
const skipped = [];

for (const target of targets) {
  const fullPath = path.join(process.cwd(), target);

  try {
    fs.rmSync(fullPath, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 100,
    });
    cleaned.push(target);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    skipped.push(`${target} (${message})`);
  }
}

console.log(`Cleaned: ${cleaned.join(", ") || "none"}`);

if (skipped.length > 0) {
  console.warn(`Skipped: ${skipped.join(", ")}`);
}
