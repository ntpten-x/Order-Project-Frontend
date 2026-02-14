import { request as playwrightRequest } from "@playwright/test";
import { spawn } from "node:child_process";

const FRONTEND_PORT = Number(process.env.E2E_PORT || 3100);
const BASE_URL = process.env.PERF_BASE_URL || `http://127.0.0.1:${FRONTEND_PORT}`;
const BASE_PORT = Number(process.env.PERF_PORT || new URL(BASE_URL).port || FRONTEND_PORT);
const WEB_SERVER_TIMEOUT_MS = Number(process.env.E2E_WEB_SERVER_TIMEOUT || 240000);
const USERNAME = process.env.E2E_STOCK_USERNAME_A || process.env.E2E_USERNAME || "e2e_pos_admin";
const PASSWORD = process.env.E2E_STOCK_PASSWORD_A || process.env.E2E_PASSWORD || "E2E_Pos_123!";
const ORDERS_TO_CREATE = Number(process.env.PERF_STOCK_ORDERS || 120);
const CREATE_CONCURRENCY = Number(process.env.PERF_CREATE_CONCURRENCY || 8);
const LIST_ROUNDS = Number(process.env.PERF_LIST_ROUNDS || 40);
const PERF_PROFILE = (process.env.PERF_PROFILE || "default").toLowerCase();
const DEFAULT_THRESHOLDS = PERF_PROFILE === "strict"
  ? { list: 450, update: 650, purchase: 800 }
  : { list: 900, update: 2200, purchase: 2200 };
const LIST_P95_MAX_MS = Number(process.env.PERF_LIST_P95_MS || DEFAULT_THRESHOLDS.list);
const UPDATE_P95_MAX_MS = Number(process.env.PERF_UPDATE_P95_MS || DEFAULT_THRESHOLDS.update);
const PURCHASE_P95_MAX_MS = Number(process.env.PERF_PURCHASE_P95_MS || DEFAULT_THRESHOLDS.purchase);

function unwrapData(payload) {
  if (!payload || typeof payload !== "object") return {};
  if (Array.isArray(payload)) return payload;
  return payload.data ?? payload;
}

function unwrapList(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object" && Array.isArray(payload.data)) return payload.data;
  return [];
}

function percentile(sortedNumbers, p) {
  if (!sortedNumbers.length) return 0;
  const idx = Math.min(sortedNumbers.length - 1, Math.ceil((p / 100) * sortedNumbers.length) - 1);
  return sortedNumbers[Math.max(0, idx)];
}

function summarize(label, numbers) {
  const sorted = [...numbers].sort((a, b) => a - b);
  const avg = sorted.length ? sorted.reduce((acc, n) => acc + n, 0) / sorted.length : 0;
  const p50 = percentile(sorted, 50);
  const p95 = percentile(sorted, 95);
  const max = sorted[sorted.length - 1] || 0;
  console.log(`[perf] ${label} count=${sorted.length} avg=${avg.toFixed(1)}ms p50=${p50.toFixed(1)}ms p95=${p95.toFixed(1)}ms max=${max.toFixed(1)}ms`);
  return { avg, p50, p95, max };
}

async function readJson(response) {
  return response.json().catch(() => ({}));
}

async function waitForFrontend(url, timeoutMs = WEB_SERVER_TIMEOUT_MS) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(`${url}/api/health`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`frontend health timeout at ${url}/api/health`);
}

function startFrontendServer(port) {
  const isWin = process.platform === "win32";
  const command = `npm run dev -- -p ${port}`;
  if (isWin) {
    return spawn("cmd.exe", ["/d", "/s", "/c", command], {
      stdio: "inherit",
      shell: false,
      env: { ...process.env, PORT: String(port) },
    });
  }
  return spawn("sh", ["-lc", command], {
    stdio: "inherit",
    shell: false,
    env: { ...process.env, PORT: String(port) },
  });
}

function killProcessTree(child) {
  return new Promise((resolve) => {
    if (!child || child.exitCode !== null) {
      resolve();
      return;
    }

    if (process.platform === "win32") {
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

async function getCsrf(context) {
  let lastError = null;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      const response = await context.get("/api/csrf");
      if (!response.ok()) throw new Error(`csrf failed: ${response.status()}`);
      const payload = await readJson(response);
      const token = payload.csrfToken || payload?.data?.csrfToken;
      if (!token) throw new Error("csrf token missing");
      return token;
    } catch (error) {
      lastError = error;
      const message = String((error && error.message) || error);
      const isConnectionError = message.includes("ECONNREFUSED") || message.includes("ECONNRESET");
      if (!isConnectionError || attempt === 5) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 600));
    }
  }
  throw lastError || new Error("csrf request failed");
}

async function login(context) {
  const csrf = await getCsrf(context);
  const response = await context.post("/api/auth/login", {
    headers: { "X-CSRF-Token": csrf },
    data: { username: USERNAME, password: PASSWORD },
  });
  if (!response.ok()) throw new Error(`login failed: ${response.status()}`);
  const me = await context.get("/api/auth/me");
  if (!me.ok()) throw new Error(`me failed: ${me.status()}`);
  const mePayload = unwrapData(await readJson(me));
  return { userId: mePayload.id, csrf };
}

async function timed(action) {
  const start = performance.now();
  const result = await action();
  return { durationMs: performance.now() - start, result };
}

async function runWithConcurrency(items, concurrency, worker) {
  const results = [];
  let cursor = 0;

  async function runWorker() {
    while (cursor < items.length) {
      const current = cursor;
      cursor += 1;
      const item = items[current];
      results[current] = await worker(item, current);
    }
  }

  await Promise.all(Array.from({ length: Math.max(1, concurrency) }, () => runWorker()));
  return results;
}

async function main() {
  console.log(`[perf] base url: ${BASE_URL}`);
  console.log(`[perf] profile: ${PERF_PROFILE} thresholds(list/update/purchase p95)=${LIST_P95_MAX_MS}/${UPDATE_P95_MAX_MS}/${PURCHASE_P95_MAX_MS}ms`);
  console.log(`[perf] creating ${ORDERS_TO_CREATE} stock orders`);

  let frontendProcess = null;
  try {
    try {
      await waitForFrontend(BASE_URL, 3000);
    } catch {
      console.log(`[perf] frontend not ready, starting dev server on port ${BASE_PORT}`);
      frontendProcess = startFrontendServer(BASE_PORT);
      await waitForFrontend(BASE_URL, WEB_SERVER_TIMEOUT_MS);
    }

    const context = await playwrightRequest.newContext({ baseURL: BASE_URL });
    const createdOrderIds = [];

    try {
      const { userId, csrf } = await login(context);

      const ingredientsResp = await context.get("/api/stock/ingredients?page=1&limit=50&status=active");
      if (!ingredientsResp.ok()) throw new Error(`ingredients failed: ${ingredientsResp.status()}`);
      const ingredients = unwrapList(await readJson(ingredientsResp));
      if (ingredients.length < 2) {
        throw new Error("need at least 2 active ingredients for perf test");
      }
      const itemA = ingredients[0];
      const itemB = ingredients[1];

      const createSamples = Array.from({ length: ORDERS_TO_CREATE }, (_, idx) => idx + 1);
      const createDurations = [];

      await runWithConcurrency(createSamples, CREATE_CONCURRENCY, async (idx) => {
        const payload = {
          ordered_by_id: userId,
          remark: `perf-seed-${Date.now()}-${idx}`,
          items: [
            { ingredient_id: itemA.id, quantity_ordered: 2 + (idx % 4) },
            { ingredient_id: itemB.id, quantity_ordered: 1 + (idx % 3) },
          ],
        };

        const { durationMs, result: response } = await timed(() =>
          context.post("/api/stock/orders", {
            headers: { "X-CSRF-Token": csrf },
            data: payload,
          })
        );

        createDurations.push(durationMs);

        if (!response.ok()) {
          throw new Error(`create order failed: ${response.status()}`);
        }
        const data = unwrapData(await readJson(response));
        createdOrderIds.push(data.id);
        return data.id;
      });

      summarize("create orders", createDurations);

      const listDurations = [];
      for (let i = 0; i < LIST_ROUNDS; i += 1) {
        const page = 1 + (i % 8);
        const { durationMs, result: response } = await timed(() =>
          context.get(`/api/stock/orders?status=pending&page=${page}&limit=20&sort_created=new`)
        );
        if (!response.ok()) throw new Error(`list pending failed: ${response.status()}`);
        listDurations.push(durationMs);
      }

      const listSummary = summarize("list+pagination", listDurations);

      const updateTargets = createdOrderIds.slice(0, Math.min(createdOrderIds.length, 30));
      const updateDurations = [];

      await runWithConcurrency(updateTargets, 6, async (orderId, index) => {
        const qty = 5 + (index % 5);
        const { durationMs, result: response } = await timed(() =>
          context.put(`/api/stock/orders/${orderId}`, {
            headers: { "X-CSRF-Token": csrf },
            data: {
              items: [
                { ingredient_id: itemA.id, quantity_ordered: qty },
                { ingredient_id: itemB.id, quantity_ordered: 2 },
              ],
            },
          })
        );
        updateDurations.push(durationMs);
        if (![200, 409].includes(response.status())) {
          throw new Error(`update failed for ${orderId}: ${response.status()}`);
        }
      });

      const updateSummary = summarize("concurrent updates", updateDurations);

      const purchaseTargets = createdOrderIds.slice(0, Math.min(createdOrderIds.length, 24));
      const purchaseDurations = [];

      await runWithConcurrency(purchaseTargets, 6, async (orderId, index) => {
        const actualA = 2 + (index % 5);
        const actualB = index % 2 === 0 ? 1 : 0;
        const { durationMs, result: response } = await timed(() =>
          context.post(`/api/stock/orders/${orderId}/purchase`, {
            headers: { "X-CSRF-Token": csrf },
            data: {
              purchased_by_id: userId,
              items: [
                { ingredient_id: itemA.id, actual_quantity: actualA, is_purchased: true },
                { ingredient_id: itemB.id, actual_quantity: actualB, is_purchased: actualB > 0 },
              ],
            },
          })
        );
        purchaseDurations.push(durationMs);
        if (![200, 409].includes(response.status())) {
          throw new Error(`purchase failed for ${orderId}: ${response.status()}`);
        }
      });

      const purchaseSummary = summarize("concurrent purchases", purchaseDurations);

      const failedChecks = [];
      if (listSummary.p95 > LIST_P95_MAX_MS) failedChecks.push(`list p95 ${listSummary.p95.toFixed(1)}ms > ${LIST_P95_MAX_MS}ms`);
      if (updateSummary.p95 > UPDATE_P95_MAX_MS) failedChecks.push(`update p95 ${updateSummary.p95.toFixed(1)}ms > ${UPDATE_P95_MAX_MS}ms`);
      if (purchaseSummary.p95 > PURCHASE_P95_MAX_MS) failedChecks.push(`purchase p95 ${purchaseSummary.p95.toFixed(1)}ms > ${PURCHASE_P95_MAX_MS}ms`);

      if (failedChecks.length) {
        throw new Error(`performance thresholds failed: ${failedChecks.join("; ")}`);
      }

      console.log("[perf] PASS - stock performance is within thresholds");
    } finally {
      for (const orderId of createdOrderIds) {
        try {
          const token = await getCsrf(context);
          await context.delete(`/api/stock/orders/${orderId}`, {
            headers: { "X-CSRF-Token": token },
          });
        } catch {
        }
      }
      await context.dispose();
    }
  } finally {
    if (frontendProcess) {
      await killProcessTree(frontendProcess);
    }
  }
}

main().catch((error) => {
  console.error(`[perf] FAIL: ${error.message}`);
  process.exit(1);
});
