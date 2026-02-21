import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";

const composeFile = "docker-compose.staging-e2e.yml";
const composeProfile = "staging-e2e";
const backendDir = process.env.BACKEND_SOURCE_DIR || "../Order-Project-Backend";
const composeArgsBase = ["compose", "-f", composeFile, "--profile", composeProfile];
const randomSuffix = randomBytes(12).toString("hex");
const stagingDbPassword = process.env.APP_DB_PASSWORD || "change-me-staging-db-password";
const stagingJwtSecret = process.env.JWT_SECRET || `staging-jwt-${randomSuffix}`;
const stagingAdminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD || `staging-admin-${randomSuffix}`;

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: options.stdio ?? "inherit",
      shell: options.shell ?? false,
      env: options.env ?? process.env,
      cwd: options.cwd ?? process.cwd(),
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} failed (exit ${code ?? 1})`));
    });
  });
}

async function runIfPossible(command, args, env) {
  try {
    await run(command, args, { env });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[staging-e2e] non-fatal cleanup error: ${message}`);
  }
}

async function waitForCommand(name, args, env, timeoutMs = 120000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      await run("docker", [...composeArgsBase, ...args], { stdio: "ignore", env });
      console.log(`[staging-e2e] ${name} is ready`);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw new Error(`Timed out waiting for ${name}`);
}

async function waitForHttp(url, timeoutMs = 180000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url, { method: "GET" });
      if (response.ok) {
        console.log(`[staging-e2e] healthy: ${url}`);
        return;
      }
    } catch {
      // keep polling
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function runNpm(args, env) {
  await run("npm", args, { env, shell: process.platform === "win32" });
}

async function ensureUser(baseEnv, username, password, role, displayName) {
  const env = {
    ...baseEnv,
    E2E_USERNAME: username,
    E2E_PASSWORD: password,
    E2E_ROLE: role,
    E2E_DISPLAY_NAME: displayName,
  };
  await runNpm(["--prefix", backendDir, "run", "ensure:e2e-user"], env);
}

async function main() {
  const composeEnv = {
    ...process.env,
    BACKEND_SOURCE_DIR: backendDir,
    APP_DB_PASSWORD: stagingDbPassword,
    JWT_SECRET: stagingJwtSecret,
    BOOTSTRAP_ADMIN_PASSWORD: stagingAdminPassword,
  };

  const backendEnv = {
    ...composeEnv,
    NODE_ENV: "development",
    DATABASE_HOST: "127.0.0.1",
    DATABASE_PORT: "55433",
    DATABASE_USER: "order_app",
    DATABASE_PASSWORD: stagingDbPassword,
    DATABASE_NAME: "order_project",
    DATABASE_SSL: "false",
    TYPEORM_SYNC: "false",
    ALLOW_TYPEORM_SYNC_WITH_NON_OWNER: "0",
    ENFORCE_DB_ROLE_POLICY: "1",
    ALLOW_SUPERUSER_DB_ROLE: "0",
    ALLOW_BYPASSRLS: "0",
    REDIS_URL: "redis://127.0.0.1:56380",
    RATE_LIMIT_REDIS_URL: "redis://127.0.0.1:56380",
    JWT_SECRET: stagingJwtSecret,
    RUN_RBAC_BASELINE_ON_START: "true",
    BOOTSTRAP_ADMIN_USERNAME: "admin",
    BOOTSTRAP_ADMIN_PASSWORD: stagingAdminPassword,
    BOOTSTRAP_ADMIN_NAME: "System Administrator",
  };

  const e2eEnv = {
    ...composeEnv,
    CI: "1",
    E2E_BASE_URL: "http://127.0.0.1:8101",
    E2E_USERNAME: "e2e_pos_admin",
    E2E_PASSWORD: "E2E_Pos_123!",
    E2E_USERNAME_REQUESTER: "e2e_pos_admin",
    E2E_PASSWORD_REQUESTER: "E2E_Pos_123!",
    E2E_USERNAME_APPROVER: "e2e_pos_admin_approver",
    E2E_PASSWORD_APPROVER: "E2E_Pos_Approver_123!",
    E2E_ADMIN_USERNAME: "admin",
    E2E_ADMIN_PASSWORD: "123456",
    E2E_MANAGER_USERNAME: "user1",
    E2E_MANAGER_PASSWORD: "123456",
    E2E_EMPLOYEE_USERNAME: "emp",
    E2E_EMPLOYEE_PASSWORD: "123456",
  };

  await runIfPossible("docker", [...composeArgsBase, "down", "-v", "--remove-orphans"], composeEnv);

  try {
    console.log("[staging-e2e] starting postgres + redis (clean)");
    await run("docker", [...composeArgsBase, "up", "-d", "db", "redis"], { env: composeEnv });
    await waitForCommand("postgres", ["exec", "-T", "db", "pg_isready", "-U", "postgres", "-d", "order_project"], composeEnv);
    await waitForCommand("redis", ["exec", "-T", "redis", "redis-cli", "ping"], composeEnv);

    console.log("[staging-e2e] applying backend migration/bootstrap/seeds");
    await runNpm(["--prefix", backendDir, "run", "security:db-role:check"], backendEnv);
    await runNpm(["--prefix", backendDir, "run", "migration:run"], backendEnv);
    await runNpm(["--prefix", backendDir, "run", "security:rbac:bootstrap"], backendEnv);
    await runNpm(["--prefix", backendDir, "run", "ensure:e2e-permission-baseline"], backendEnv);
    await runNpm(["--prefix", backendDir, "run", "ensure:e2e-domain-baseline"], backendEnv);

    await ensureUser(backendEnv, "admin", "123456", "Admin", "Admin");
    await ensureUser(backendEnv, "user1", "123456", "Manager", "Manager");
    await ensureUser(backendEnv, "emp", "123456", "Employee", "Employee");
    await ensureUser(backendEnv, "e2e_pos_admin", "E2E_Pos_123!", "Admin", "E2E POS Admin");
    await ensureUser(
      backendEnv,
      "e2e_pos_admin_approver",
      "E2E_Pos_Approver_123!",
      "Admin",
      "E2E POS Approver"
    );

    console.log("[staging-e2e] starting api + web");
    await run("docker", [...composeArgsBase, "up", "-d", "--build", "api", "web"], { env: composeEnv });
    await waitForHttp("http://127.0.0.1:8102/health");
    await waitForHttp("http://127.0.0.1:8101/api/health");

    console.log("[staging-e2e] running playwright api e2e");
    await runNpm(["run", "test:e2e:api:docker"], e2eEnv);

    console.log("[staging-e2e] running playwright ui e2e");
    await runNpm(["run", "test:e2e:docker"], e2eEnv);
  } finally {
    console.log("[staging-e2e] stopping stack and removing volumes");
    await runIfPossible("docker", [...composeArgsBase, "down", "-v", "--remove-orphans"], composeEnv);
  }
}

main().catch((error) => {
  console.error(`[staging-e2e] failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
