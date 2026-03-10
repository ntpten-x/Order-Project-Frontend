import http from "node:http";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";

const composeFile = "docker-compose.staging-e2e.yml";
const composeProfile = "staging-e2e";
const backendDir = process.env.BACKEND_SOURCE_DIR || "../Order-Project-Backend";
const randomSuffix = randomBytes(12).toString("hex");
const composeProject = (process.env.DOCKER_POS_PROJECT || `order-frontend-pos-${randomSuffix.slice(0, 8)}`).toLowerCase();
const composeArgsBase = ["compose", "-p", composeProject, "-f", composeFile, "--profile", composeProfile];
const stagingDbPassword = process.env.APP_DB_PASSWORD || "change-me-staging-db-password";
const stagingJwtSecret = process.env.JWT_SECRET || `staging-jwt-${randomSuffix}`;
const stagingAdminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD || `staging-admin-${randomSuffix}`;

const apiSpecs = [
  "tests/e2e-api/health.spec.ts",
];

const uiSpecs = [
  "tests/e2e/permissions-matrix.phase8.spec.ts",
  "tests/e2e/shifts-role-matrix.phase8.spec.ts",
  "tests/e2e/pos-go-live.phase7.spec.ts",
  "tests/e2e/serving-board.spec.ts",
];

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

function runCapture(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
      shell: options.shell ?? false,
      env: options.env ?? process.env,
      cwd: options.cwd ?? process.cwd(),
    });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} failed (exit ${code ?? 1})\n${stderr || stdout}`));
    });
  });
}

async function runIfPossible(command, args, env) {
  try {
    await run(command, args, { env });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[docker-pos-gate] non-fatal cleanup error: ${message}`);
  }
}

async function cleanupComposeStack(env) {
  await runIfPossible("docker", [...composeArgsBase, "down", "-v", "--remove-orphans"], env);
  await runIfPossible("docker", [...composeArgsBase, "rm", "-s", "-f", "-v"], env);
  try {
    const containers = await runCapture(
      "docker",
      ["ps", "-aq", "--filter", `label=com.docker.compose.project=${composeProject}`],
      { env }
    );
    const containerIds = containers.stdout
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter(Boolean);
    if (containerIds.length > 0) {
      await runIfPossible("docker", ["rm", "-f", ...containerIds], env);
    }
  } catch {
    // ignore cleanup discovery issues
  }
  await runIfPossible("docker", ["volume", "rm", "-f", `${composeProject}_frontend_staging_pgdata`], env);
  try {
    const networks = await runCapture(
      "docker",
      ["network", "ls", "-q", "--filter", `label=com.docker.compose.project=${composeProject}`],
      { env }
    );
    const networkIds = networks.stdout
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter(Boolean);
    if (networkIds.length > 0) {
      await runIfPossible("docker", ["network", "rm", ...networkIds], env);
    }
  } catch {
    // ignore cleanup discovery issues
  }
  await new Promise((resolve) => setTimeout(resolve, 2000));
}

async function waitForCommand(name, args, env, timeoutMs = 120000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      await run("docker", [...composeArgsBase, ...args], { stdio: "ignore", env });
      console.log(`[docker-pos-gate] ${name} is ready`);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw new Error(`Timed out waiting for ${name}`);
}

async function probeHttp(url, timeoutMs = 3000) {
  return await new Promise((resolve, reject) => {
    const req = http.get(url, { timeout: timeoutMs }, (response) => {
      response.resume();
      resolve(response.statusCode || 0);
    });
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", reject);
  });
}

async function waitForHttp(url, timeoutMs = 180000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const status = Number(await probeHttp(url));
      if ([200, 204, 401, 403].includes(status)) {
        console.log(`[docker-pos-gate] healthy: ${url} status=${status}`);
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

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, idx))];
}

function extractCookieHeader(setCookieHeaders) {
  const entries = Array.isArray(setCookieHeaders) ? setCookieHeaders : [];
  return entries
    .map((entry) => String(entry).split(";")[0])
    .filter(Boolean)
    .join("; ");
}

async function loginAndGetCookie(baseUrl, username, password) {
  const payload = JSON.stringify({ username, password });
  return await new Promise((resolve, reject) => {
    const req = http.request(
      `${baseUrl}/auth/login`,
      {
        method: "POST",
        timeout: 5000,
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8");
          if ((res.statusCode || 0) < 200 || (res.statusCode || 0) >= 300) {
            reject(new Error(`login failed status=${res.statusCode} body=${body.slice(0, 240)}`));
            return;
          }
          const cookieHeader = extractCookieHeader(res.headers["set-cookie"]);
          if (!cookieHeader.includes("token=")) {
            reject(new Error("login succeeded but token cookie was not set"));
            return;
          }
          resolve(cookieHeader);
        });
      }
    );
    req.on("timeout", () => req.destroy(new Error("login timeout")));
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

async function requestTiming(baseUrl, endpoint, cookieHeader) {
  return await new Promise((resolve) => {
    const startedAt = process.hrtime.bigint();
    let ttfbMs = 0;
    const req = http.get(
      `${baseUrl}${endpoint}`,
      {
        timeout: 5000,
        headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
      },
      (res) => {
        const statusCode = res.statusCode || 0;
        ttfbMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
        res.on("data", () => {});
        res.on("end", () => {
          const totalMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
          resolve({
            ok: statusCode >= 200 && statusCode < 400,
            statusCode,
            ttfbMs,
            totalMs,
          });
        });
      }
    );
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", () => {
      const totalMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      resolve({
        ok: false,
        statusCode: 0,
        ttfbMs: totalMs,
        totalMs,
      });
    });
  });
}

async function runOrdersSummaryPerf(baseUrl, username, password) {
  const endpoint = process.env.DOCKER_POS_PERF_ENDPOINT || "/pos/orders/summary?page=1&limit=50";
  const requests = Number(process.env.DOCKER_POS_PERF_REQUESTS || 30);
  const concurrency = Number(process.env.DOCKER_POS_PERF_CONCURRENCY || 4);
  const p95TotalMax = Number(process.env.DOCKER_POS_PERF_P95_TOTAL_MS || 800);
  const p95TtfbMax = Number(process.env.DOCKER_POS_PERF_P95_TTFB_MS || 500);
  const maxErrorRate = Number(process.env.DOCKER_POS_PERF_MAX_ERROR_RATE || 0.02);
  const cookieHeader = await loginAndGetCookie(baseUrl, username, password);
  const inFlight = new Set();
  const results = [];
  let nextIndex = 0;

  const launch = async () => {
    if (nextIndex >= requests) return;
    nextIndex += 1;
    const task = requestTiming(baseUrl, endpoint, cookieHeader).then((result) => {
      results.push(result);
      inFlight.delete(task);
    });
    inFlight.add(task);
  };

  for (let i = 0; i < Math.min(concurrency, requests); i += 1) {
    await launch();
  }

  while (inFlight.size > 0) {
    await Promise.race(inFlight);
    while (inFlight.size < concurrency && nextIndex < requests) {
      await launch();
    }
  }

  const totalMs = results.map((item) => item.totalMs);
  const ttfbMs = results.map((item) => item.ttfbMs);
  const failures = results.filter((item) => !item.ok).length;
  const errorRate = failures / Math.max(1, results.length);
  const p95Total = percentile(totalMs, 95);
  const p95Ttfb = percentile(ttfbMs, 95);

  console.log(
    `[docker-pos-gate] perf endpoint=${endpoint} req=${results.length} p95_total=${p95Total.toFixed(2)}ms p95_ttfb=${p95Ttfb.toFixed(2)}ms error_rate=${(errorRate * 100).toFixed(2)}%`
  );

  if (p95Total > p95TotalMax) {
    throw new Error(`orders summary p95 total ${p95Total.toFixed(2)}ms > ${p95TotalMax}ms`);
  }
  if (p95Ttfb > p95TtfbMax) {
    throw new Error(`orders summary p95 ttfb ${p95Ttfb.toFixed(2)}ms > ${p95TtfbMax}ms`);
  }
  if (errorRate > maxErrorRate) {
    throw new Error(`orders summary error rate ${(errorRate * 100).toFixed(2)}% > ${(maxErrorRate * 100).toFixed(2)}%`);
  }
}

async function main() {
  const noProxy = "127.0.0.1,localhost";
  const composeEnv = {
    ...process.env,
    BACKEND_SOURCE_DIR: backendDir,
    APP_DB_PASSWORD: stagingDbPassword,
    JWT_SECRET: stagingJwtSecret,
    BOOTSTRAP_ADMIN_PASSWORD: stagingAdminPassword,
    NO_PROXY: noProxy,
    no_proxy: noProxy,
    HTTP_PROXY: "",
    HTTPS_PROXY: "",
    ALL_PROXY: "",
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
  const backendTestEnv = {
    ...backendEnv,
    NODE_ENV: "test",
  };
  const skipPerfSmoke = process.env.DOCKER_POS_SKIP_PERF !== "0";

  await cleanupComposeStack(composeEnv);

  try {
    console.log("[docker-pos-gate] starting postgres + redis");
    await run("docker", [...composeArgsBase, "up", "-d", "db", "redis"], { env: composeEnv });
    await waitForCommand("postgres", ["exec", "-T", "db", "pg_isready", "-U", "postgres", "-d", "order_project"], composeEnv);
    await waitForCommand("redis", ["exec", "-T", "redis", "redis-cli", "ping"], composeEnv);
    await waitForCommand(
      "app-db-role",
      [
        "exec",
        "-T",
        "db",
        "sh",
        "-lc",
        "PGPASSWORD=\"$APP_DB_PASSWORD\" psql -h 127.0.0.1 -U \"$APP_DB_USER\" -d \"$APP_DB_NAME\" -c 'SELECT 1' >/dev/null",
      ],
      composeEnv
    );

    console.log("[docker-pos-gate] backend security/governance bootstrap");
    await runNpm(["--prefix", backendDir, "run", "security:db-role:check"], backendEnv);
    await runNpm(["--prefix", backendDir, "run", "migration:run"], backendEnv);
    await runNpm(["--prefix", backendDir, "run", "security:rbac:bootstrap"], backendEnv);
    await runNpm(["--prefix", backendDir, "run", "route:guard"], backendEnv);
    await runNpm(["--prefix", backendDir, "run", "scope:audit"], backendEnv);
    await runNpm(["--prefix", backendDir, "run", "policy:cache:guard"], backendEnv);
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

    console.log("[docker-pos-gate] backend integration/branch-isolation checks");
    await runNpm(["--prefix", backendDir, "run", "test:integration:pos-flow"], backendTestEnv);
    await runNpm(["--prefix", backendDir, "run", "test:integration:serving-board"], backendTestEnv);
    await run("npx", ["vitest", "run", "src/tests/integration/rls.test.ts"], {
      cwd: backendDir,
      env: backendTestEnv,
      shell: process.platform === "win32",
    });

    console.log("[docker-pos-gate] starting docker api + web");
    await run("docker", [...composeArgsBase, "up", "-d", "--build", "api", "web"], { env: composeEnv });
    await waitForHttp("http://127.0.0.1:8102/health");
    await waitForHttp("http://127.0.0.1:8101/api/health");

    console.log("[docker-pos-gate] playwright api checks");
    await run("npx", ["playwright", "test", "--config", "playwright.api.docker.config.ts", ...apiSpecs], {
      env: e2eEnv,
      shell: process.platform === "win32",
    });

    console.log("[docker-pos-gate] playwright pos ui checks");
    await run("npx", ["playwright", "test", "--config", "playwright.docker.config.ts", ...uiSpecs], {
      env: e2eEnv,
      shell: process.platform === "win32",
    });

    if (skipPerfSmoke) {
      console.log("[docker-pos-gate] skipping perf smoke (DOCKER_POS_SKIP_PERF enabled)");
    } else {
      console.log("[docker-pos-gate] docker perf smoke");
      await runOrdersSummaryPerf("http://127.0.0.1:8102", e2eEnv.E2E_USERNAME, e2eEnv.E2E_PASSWORD);
    }
  } finally {
    console.log("[docker-pos-gate] stopping stack and removing volumes");
    await cleanupComposeStack(composeEnv);
  }
}

main().catch((error) => {
  console.error(`[docker-pos-gate] failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
