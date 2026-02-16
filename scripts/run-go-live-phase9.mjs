import { spawn } from "node:child_process";
import net from "node:net";

const isWin = process.platform === "win32";

function runCommand(command, args, opts = {}) {
  const runCommandName = isWin ? "cmd.exe" : command;
  const runArgs = isWin ? ["/d", "/s", "/c", `${command} ${args.join(" ")}`] : args;
  return new Promise((resolve, reject) => {
    const child = spawn(runCommandName, runArgs, {
      stdio: "inherit",
      shell: false,
      ...opts,
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} failed (exit ${code})`));
    });
  });
}

function startCommand(command, args, opts = {}) {
  const runCommandName = isWin ? "cmd.exe" : command;
  const runArgs = isWin ? ["/d", "/s", "/c", `${command} ${args.join(" ")}`] : args;
  return spawn(runCommandName, runArgs, {
    stdio: "inherit",
    shell: false,
    ...opts,
  });
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      if (!addr || typeof addr === "string") {
        server.close(() => reject(new Error("could not allocate port")));
        return;
      }
      const { port } = addr;
      server.close((err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(port);
      });
    });
  });
}

async function waitForHealth(url, timeoutMs = 120000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${url}/health`);
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`backend health timeout: ${url}/health`);
}

function killProcessTree(child) {
  return new Promise((resolve) => {
    if (!child || child.exitCode !== null) {
      resolve();
      return;
    }

    if (isWin) {
      const killer = spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
        stdio: "ignore",
      });
      killer.on("exit", () => resolve());
      killer.on("error", () => resolve());
      return;
    }

    child.once("exit", () => resolve());
    child.kill("SIGTERM");
    setTimeout(() => {
      if (child.exitCode === null) child.kill("SIGKILL");
    }, 3000);
  });
}

async function main() {
  const backendDir = "../Order-Project-Backend";
  const backendPort = Number(await getFreePort());
  const frontendPort = Number(await getFreePort());
  const perfPort = Number(await getFreePort());
  const backendUrl = `http://127.0.0.1:${backendPort}`;
  const dbHost = process.env.DATABASE_HOST || "localhost";
  const dbPort = process.env.DATABASE_PORT || "5433";
  const dbSsl = process.env.DATABASE_SSL || "false";
  const redisUrl = process.env.REDIS_URL || "";
  const rateLimitRedisUrl = process.env.RATE_LIMIT_REDIS_URL || "";
  const redisDisabled = process.env.REDIS_DISABLED || "true";
  const rateLimitRedisDisabled = process.env.RATE_LIMIT_REDIS_DISABLED || "true";

  const baseEnv = {
    ...process.env,
    DATABASE_HOST: dbHost,
    DATABASE_PORT: dbPort,
    DATABASE_SSL: dbSsl,
    REDIS_URL: redisUrl,
    RATE_LIMIT_REDIS_URL: rateLimitRedisUrl,
    REDIS_DISABLED: redisDisabled,
    RATE_LIMIT_REDIS_DISABLED: rateLimitRedisDisabled,
    SOCKET_REDIS_ADAPTER_ENABLED: process.env.SOCKET_REDIS_ADAPTER_ENABLED || "false",
    ALLOW_BYPASSRLS: process.env.ALLOW_BYPASSRLS || "1",
    NO_PROXY: "127.0.0.1,localhost",
    no_proxy: "127.0.0.1,localhost",
    HTTP_PROXY: "",
    HTTPS_PROXY: "",
    ALL_PROXY: "",
  };

  console.log(`[phase9] database target ${dbHost}:${dbPort} ssl=${dbSsl}`);

  console.log("[phase9] ensure e2e baseline users");
  await runCommand("npm", ["--prefix", backendDir, "run", "ensure:e2e-user"], {
    env: {
      ...baseEnv,
      E2E_USERNAME: process.env.E2E_USERNAME || "e2e_pos_admin",
      E2E_PASSWORD: process.env.E2E_PASSWORD || "E2E_Pos_123!",
      E2E_ROLE: process.env.E2E_ROLE || "Admin",
      E2E_DISPLAY_NAME: process.env.E2E_DISPLAY_NAME || "E2E Admin",
      E2E_RESET_USER_OVERRIDES: "true",
    },
  });

  const secondUsername = process.env.E2E_STOCK_USERNAME_B || process.env.E2E_USERNAME_APPROVER || "e2e_pos_admin_approver";
  const secondPassword = process.env.E2E_STOCK_PASSWORD_B || process.env.E2E_PASSWORD_APPROVER || "E2E_Pos_Approver_123!";

  await runCommand("npm", ["--prefix", backendDir, "run", "ensure:e2e-user"], {
    env: {
      ...baseEnv,
      E2E_USERNAME: secondUsername,
      E2E_PASSWORD: secondPassword,
      E2E_ROLE: "Admin",
      E2E_DISPLAY_NAME: "E2E Stock Approver",
      E2E_RESET_USER_OVERRIDES: "true",
    },
  });

  const backendEnv = {
    ...baseEnv,
    PORT: String(backendPort),
  };

  console.log(`[phase9] start backend on ${backendUrl}`);
  const backend = startCommand("npx", ["ts-node", "app.ts"], {
    cwd: backendDir,
    env: backendEnv,
  });

  try {
    await waitForHealth(backendUrl, 120000);

    const testEnv = {
      ...baseEnv,
      CI: "1",
      E2E_PORT: String(frontendPort),
      PERF_PORT: String(perfPort),
      E2E_WEB_SERVER_TIMEOUT: "240000",
      NEXT_PUBLIC_BACKEND_API: backendUrl,
      BACKEND_API_INTERNAL: backendUrl,
      E2E_STOCK_USERNAME_A: process.env.E2E_STOCK_USERNAME_A || process.env.E2E_USERNAME || "e2e_pos_admin",
      E2E_STOCK_PASSWORD_A: process.env.E2E_STOCK_PASSWORD_A || process.env.E2E_PASSWORD || "E2E_Pos_123!",
      E2E_STOCK_USERNAME_B: secondUsername,
      E2E_STOCK_PASSWORD_B: secondPassword,
      PERF_BASE_URL: `http://127.0.0.1:${perfPort}`,
    };

    console.log("[phase9] run stock e2e cases");
    await runCommand(
      "npx",
      [
        "playwright",
        "test",
        "--config",
        "playwright.config.ts",
        "--project=chromium",
        "--workers=1",
        "--retries=1",
        "--reporter=list",
        "tests/e2e/stock-go-live.phase9.spec.ts",
      ],
      { env: testEnv }
    );

    console.log("[phase9] run stock performance benchmark");
    await runCommand("node", ["scripts/perf-stock-phase9.mjs"], { env: testEnv });

    console.log("[phase9] PASS");
  } finally {
    await killProcessTree(backend);
  }
}

main().catch((error) => {
  console.error(`[phase9] failed: ${error.message}`);
  process.exit(1);
});
