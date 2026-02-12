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

async function ensureE2eUser({ backendDir, env, username, password, role, displayName }) {
  await runCommand("npm", ["--prefix", backendDir, "run", "ensure:e2e-user"], {
    env: {
      ...env,
      E2E_USERNAME: username,
      E2E_PASSWORD: password,
      E2E_ROLE: role,
      E2E_DISPLAY_NAME: displayName,
      E2E_RESET_USER_OVERRIDES: "true",
    },
  });
}

async function ensurePermissionBaseline({ backendDir, env }) {
  await runCommand("npm", ["--prefix", backendDir, "run", "ensure:e2e-permission-baseline"], {
    env: {
      ...env,
    },
  });
}

async function main() {
  const backendDir = "../Order-Project-Backend";
  const backendPort = Number(await getFreePort());
  const frontendPort = Number(await getFreePort());
  const backendUrl = `http://127.0.0.1:${backendPort}`;
  const dbHost = process.env.DATABASE_HOST || "localhost";
  const dbPort = process.env.DATABASE_PORT || "5433";
  const dbSsl = process.env.DATABASE_SSL || "false";
  const redisUrl = process.env.REDIS_URL || "";
  const rateLimitRedisUrl = process.env.RATE_LIMIT_REDIS_URL || "";
  const redisDisabled = process.env.REDIS_DISABLED || "true";
  const rateLimitRedisDisabled = process.env.RATE_LIMIT_REDIS_DISABLED || "true";

  const adminUsername = process.env.E2E_ADMIN_USERNAME || process.env.E2E_USERNAME || "admin";
  const adminPassword = process.env.E2E_ADMIN_PASSWORD || process.env.E2E_PASSWORD || "123456";
  const managerUsername = process.env.E2E_MANAGER_USERNAME || "user1";
  const managerPassword = process.env.E2E_MANAGER_PASSWORD || "123456";
  const employeeUsername = process.env.E2E_EMPLOYEE_USERNAME || "emp";
  const employeePassword = process.env.E2E_EMPLOYEE_PASSWORD || "123456";

  const requesterUsername = process.env.E2E_USERNAME_REQUESTER || "e2e_pos_admin_requester";
  const requesterPassword = process.env.E2E_PASSWORD_REQUESTER || "E2E_Pos_Requester_123!";
  const approverUsername = process.env.E2E_USERNAME_APPROVER || "e2e_pos_admin_approver";
  const approverPassword = process.env.E2E_PASSWORD_APPROVER || "E2E_Pos_Approver_123!";

  if (requesterUsername.toLowerCase() === approverUsername.toLowerCase()) {
    throw new Error("E2E requester and approver usernames must be different for two-person approval test");
  }

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
  console.log(`[phase8] database target ${dbHost}:${dbPort} ssl=${dbSsl}`);
  if (redisDisabled === "true" || rateLimitRedisDisabled === "true") {
    console.log(
      `[phase8] redis disabled for deterministic e2e (REDIS_DISABLED=${redisDisabled}, RATE_LIMIT_REDIS_DISABLED=${rateLimitRedisDisabled})`
    );
  }

  console.log("[phase8] ensure permission baseline");
  await ensurePermissionBaseline({
    backendDir,
    env: baseEnv,
  });

  console.log("[phase8] ensure admin user");
  await ensureE2eUser({
    backendDir,
    env: baseEnv,
    username: adminUsername,
    password: adminPassword,
    role: "Admin",
    displayName: "E2E Admin",
  });

  console.log("[phase8] ensure manager user");
  await ensureE2eUser({
    backendDir,
    env: baseEnv,
    username: managerUsername,
    password: managerPassword,
    role: "Manager",
    displayName: "E2E Manager",
  });

  console.log("[phase8] ensure employee user");
  await ensureE2eUser({
    backendDir,
    env: baseEnv,
    username: employeeUsername,
    password: employeePassword,
    role: "Employee",
    displayName: "E2E Employee",
  });

  console.log("[phase8] ensure requester admin user");
  await ensureE2eUser({
    backendDir,
    env: baseEnv,
    username: requesterUsername,
    password: requesterPassword,
    role: "Admin",
    displayName: "E2E Requester",
  });

  console.log("[phase8] ensure approver admin user");
  await ensureE2eUser({
    backendDir,
    env: baseEnv,
    username: approverUsername,
    password: approverPassword,
    role: "Admin",
    displayName: "E2E Approver",
  });

  const backendEnv = {
    ...baseEnv,
    PORT: String(backendPort),
  };

  console.log(`[phase8] start backend on ${backendUrl}`);
  const backend = startCommand("npx", ["ts-node", "app.ts"], {
    cwd: backendDir,
    env: backendEnv,
  });

  try {
    await waitForHealth(backendUrl, 120000);

    const e2eEnv = {
      ...baseEnv,
      CI: "1",
      E2E_PORT: String(frontendPort),
      E2E_WEB_SERVER_TIMEOUT: "240000",
      NEXT_PUBLIC_BACKEND_API: backendUrl,
      E2E_USERNAME_REQUESTER: requesterUsername,
      E2E_PASSWORD_REQUESTER: requesterPassword,
      E2E_USERNAME_APPROVER: approverUsername,
      E2E_PASSWORD_APPROVER: approverPassword,
      E2E_ADMIN_USERNAME: adminUsername,
      E2E_ADMIN_PASSWORD: adminPassword,
      E2E_MANAGER_USERNAME: managerUsername,
      E2E_MANAGER_PASSWORD: managerPassword,
      E2E_EMPLOYEE_USERNAME: employeeUsername,
      E2E_EMPLOYEE_PASSWORD: employeePassword,
    };

    console.log("[phase8] run permissions matrix e2e");
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
        "tests/e2e/permissions-matrix.phase8.spec.ts",
      ],
      { env: e2eEnv }
    );

    console.log("[phase8] run shifts role matrix e2e");
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
        "tests/e2e/shifts-role-matrix.phase8.spec.ts",
      ],
      { env: e2eEnv }
    );

    console.log("[phase8] PASS");
  } finally {
    await killProcessTree(backend);
  }
}

main().catch((error) => {
  console.error(`[phase8] failed: ${error.message}`);
  process.exit(1);
});
