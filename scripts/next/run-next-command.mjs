import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const command = process.argv[2];
const validCommands = new Set(["build", "analyze", "start"]);
const defaultDistDir = ".next-build";
const fallbackDistDir = ".next-build-local";
const distStateFile = path.join(process.cwd(), ".next-dist-dir");
const nextBin = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");

if (!validCommands.has(command)) {
  console.error(`Unsupported Next.js command: ${command ?? "undefined"}`);
  process.exit(1);
}

function readPersistedDistDir() {
  try {
    const value = fs.readFileSync(distStateFile, "utf8").trim();
    return value || null;
  } catch {
    return null;
  }
}

function persistDistDir(distDir) {
  fs.writeFileSync(distStateFile, `${distDir}\n`, "utf8");
}

function ensureDirectory(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function isDistDirWriteBlocked(distDir) {
  const fullDistDir = path.join(process.cwd(), distDir);
  const tracePath = path.join(fullDistDir, "trace");

  try {
    ensureDirectory(fullDistDir);
    const fd = fs.openSync(tracePath, "a");
    fs.closeSync(fd);
    return false;
  } catch (error) {
    const code = error && typeof error === "object" ? error.code : undefined;
    return code === "EPERM" || code === "EACCES";
  }
}

function resolveBuildDistDir() {
  const explicitDistDir = process.env.NEXT_DIST_DIR?.trim();
  if (explicitDistDir) {
    return explicitDistDir;
  }

  if (!isDistDirWriteBlocked(defaultDistDir)) {
    return defaultDistDir;
  }

  console.warn(
    `[next-runner] ${defaultDistDir} is write-locked. Falling back to ${fallbackDistDir} for this build.`
  );
  return fallbackDistDir;
}

function resolveStartDistDir() {
  const explicitDistDir = process.env.NEXT_DIST_DIR?.trim();
  if (explicitDistDir) {
    return explicitDistDir;
  }

  const persistedDistDir = readPersistedDistDir();
  if (persistedDistDir) {
    return persistedDistDir;
  }

  return defaultDistDir;
}

function runNext(args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [nextBin, ...args], {
      cwd: process.cwd(),
      env,
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`next ${args.join(" ")} failed with exit code ${code}`));
    });
  });
}

async function main() {
  const distDir = command === "start" ? resolveStartDistDir() : resolveBuildDistDir();
  const env = {
    ...process.env,
    NEXT_DIST_DIR: distDir,
  };

  if (command === "analyze") {
    env.ANALYZE = "true";
  }

  if (command === "start") {
    console.info(`[next-runner] Starting Next.js from ${distDir}`);
    await runNext(["start"], env);
    return;
  }

  console.info(`[next-runner] Running Next.js ${command} using ${distDir}`);
  await runNext(["build"], env);
  persistDistDir(distDir);
}

main().catch((error) => {
  console.error("[next-runner]", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
