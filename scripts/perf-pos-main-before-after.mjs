#!/usr/bin/env node
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium, request as playwrightRequest } from "playwright";

const projectRoot = process.cwd();
const backendDir = process.env.PERF_BACKEND_DIR
  ? path.resolve(projectRoot, process.env.PERF_BACKEND_DIR)
  : path.resolve(projectRoot, "..", "Order-Project-Backend");
const frontendDir = projectRoot;
const changedFiles = [
  "src/providers/QueryProvider.tsx",
  "src/contexts/SocketContext.tsx",
  "src/hooks/pos/usePrefetching.ts",
  "src/hooks/pos/useOrderSocketEvents.ts",
  "src/hooks/pos/useListState.ts",
  "src/utils/channels/channelStats.utils.ts",
  "src/utils/pos/invalidateProfiler.ts",
];

const backendPort = Number(process.env.PERF_BACKEND_PORT || 3000);
const frontendPort = Number(process.env.PERF_FRONTEND_PORT || 3310);
const reconnectCycles = Number(process.env.PERF_RECONNECT_CYCLES || 3);
const profilePath = process.env.PERF_PROFILE_PATH || "/pos/orders";
const compareMode = (process.env.PERF_COMPARE_MODE || "debounce-toggle").toLowerCase();
const burstOrderCount = Number(process.env.PERF_BURST_ORDER_COUNT || 6);
const burstUpdateRounds = Number(process.env.PERF_BURST_UPDATE_ROUNDS || 4);
const burstIntervalMs = Number(process.env.PERF_BURST_INTERVAL_MS || 40);
const burstSettleMs = Number(process.env.PERF_BURST_SETTLE_MS || 5000);
const username = process.env.PERF_USERNAME || process.env.E2E_USERNAME || "e2e_pos_admin";
const password = process.env.PERF_PASSWORD || process.env.E2E_PASSWORD || "E2E_Pos_123!";

const backendBaseUrl = `http://127.0.0.1:${backendPort}`;
const frontendBaseUrl = `http://127.0.0.1:${frontendPort}`;
const isWin = process.platform === "win32";

function quoteArg(arg) {
  if (!/[\s"]/u.test(arg)) return arg;
  return `"${arg.replace(/"/g, '\\"')}"`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForCondition(predicate, timeoutMs, intervalMs = 200) {
  const startAt = Date.now();
  while (Date.now() - startAt < timeoutMs) {
    if (predicate()) return true;
    await sleep(intervalMs);
  }
  return false;
}

function run(command, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const runCommandName = isWin ? "cmd.exe" : command;
    const runArgs = isWin
      ? ["/d", "/s", "/c", `${command} ${args.map((arg) => quoteArg(String(arg))).join(" ")}`]
      : args;
    const child = spawn(runCommandName, runArgs, {
      stdio: ["ignore", "pipe", "pipe"],
      shell: false,
      ...opts,
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
      reject(new Error(`${command} ${args.join(" ")} failed (${code})\n${stderr || stdout}`));
    });
  });
}

function start(command, args, opts = {}) {
  const runCommandName = isWin ? "cmd.exe" : command;
  const runArgs = isWin
    ? ["/d", "/s", "/c", `${command} ${args.map((arg) => quoteArg(String(arg))).join(" ")}`]
    : args;
  return spawn(runCommandName, runArgs, {
    stdio: "inherit",
    shell: false,
    ...opts,
  });
}

async function killTree(child) {
  if (!child || child.exitCode !== null) return;
  if (process.platform === "win32") {
    await run("taskkill", ["/pid", String(child.pid), "/t", "/f"]).catch(() => undefined);
    return;
  }
  child.kill("SIGTERM");
  await sleep(1200);
  if (child.exitCode === null) {
    child.kill("SIGKILL");
  }
}

async function waitForHttp(url, timeoutMs = 150000) {
  const startAt = Date.now();
  while (Date.now() - startAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok || response.status === 401 || response.status === 403) return;
    } catch {
      // keep waiting
    }
    await sleep(1000);
  }
  throw new Error(`timeout waiting for ${url}`);
}

async function getPatchContent() {
  const { stdout } = await run("git", ["diff", "--", ...changedFiles], { cwd: frontendDir });
  return stdout;
}

async function checkoutHeadState() {
  await run("git", ["checkout", "--", ...changedFiles], { cwd: frontendDir });
}

async function applyPatchFile(patchFile) {
  await run("git", ["apply", "--whitespace=nowarn", patchFile], { cwd: frontendDir });
}

async function ensureE2EUser() {
  console.log("[perf] ensuring e2e user");
  await run("npm", ["run", "ensure:e2e-user"], { cwd: backendDir });
}

async function startBackend() {
  const allowedOrigins = [
    frontendBaseUrl,
    `http://localhost:${frontendPort}`,
    `http://127.0.0.1:${frontendPort}`,
  ]
    .filter(Boolean)
    .join(",");

  const backend = start("npm", ["run", "dev"], {
    cwd: backendDir,
    env: {
      ...process.env,
      PORT: String(backendPort),
      RATE_LIMIT_ORDER_MAX: process.env.RATE_LIMIT_ORDER_MAX || "500",
      FRONTEND_ALLOWED_ORIGINS: process.env.FRONTEND_ALLOWED_ORIGINS || allowedOrigins,
    },
  });
  await waitForHttp(`${backendBaseUrl}/health`, 180000);
  return backend;
}

async function startFrontend() {
  const frontend = start("npm", ["run", "dev", "--", "-p", String(frontendPort)], {
    cwd: frontendDir,
    env: {
      ...process.env,
      NEXT_PUBLIC_BACKEND_API: backendBaseUrl,
      BACKEND_API_INTERNAL: backendBaseUrl,
      NEXT_PUBLIC_SOCKET_URL: backendBaseUrl,
      NEXT_PUBLIC_SOCKET_PATH: "/socket.io",
      NEXT_PUBLIC_SOCKET_TRANSPORTS: process.env.NEXT_PUBLIC_SOCKET_TRANSPORTS || "polling,websocket",
    },
  });
  await waitForHttp(`${frontendBaseUrl}/login`, 180000);
  return frontend;
}

async function createLoggedInState() {
  const api = await playwrightRequest.newContext({
    baseURL: frontendBaseUrl,
    ignoreHTTPSErrors: true,
  });
  try {
    const csrfRes = await api.get("/api/csrf");
    if (!csrfRes.ok()) {
      throw new Error(`csrf failed: ${csrfRes.status()}`);
    }
    const csrfPayload = await csrfRes.json().catch(() => ({}));
    const csrfToken = csrfPayload?.csrfToken ?? csrfPayload?.data?.csrfToken;
    if (!csrfToken) {
      throw new Error("csrf token missing");
    }

    const loginRes = await api.post("/api/auth/login", {
      headers: { "X-CSRF-Token": String(csrfToken) },
      data: { username, password },
    });
    if (!loginRes.ok()) {
      const body = await loginRes.text().catch(() => "");
      throw new Error(`login failed: ${loginRes.status()} ${body.slice(0, 200)}`);
    }

    const meRes = await api.get("/api/auth/me");
    if (!meRes.ok()) {
      throw new Error(`me failed: ${meRes.status()}`);
    }
    const mePayload = await meRes.json().catch(() => ({}));
    const meData =
      mePayload && typeof mePayload === "object" && "data" in mePayload ? mePayload.data : mePayload;

    const activeBranchRes = await api.get("/api/auth/active-branch");
    let activeBranchId = null;
    if (activeBranchRes.ok()) {
      const activePayload = await activeBranchRes.json().catch(() => ({}));
      if (typeof activePayload?.active_branch_id === "string") {
        activeBranchId = activePayload.active_branch_id;
      }
    }

    if (!activeBranchId) {
      let fallbackBranchId =
        (typeof meData?.branch_id === "string" && meData.branch_id) ||
        (typeof meData?.branch?.id === "string" && meData.branch.id) ||
        null;

      if (!fallbackBranchId) {
        const productsRes = await api.get("/api/pos/products?page=1&limit=1");
        if (productsRes.ok()) {
          const productsPayload = await productsRes.json().catch(() => ({}));
          const productsData =
            productsPayload && typeof productsPayload === "object" && "data" in productsPayload
              ? productsPayload.data
              : productsPayload;
          if (Array.isArray(productsData) && productsData.length > 0) {
            const firstProduct = productsData.find((item) => typeof item?.branch_id === "string");
            fallbackBranchId = typeof firstProduct?.branch_id === "string" ? firstProduct.branch_id : null;
          }
        }
      }

      if (fallbackBranchId) {
        const switchRes = await api.post("/api/auth/switch-branch", {
          headers: { "X-CSRF-Token": String(csrfToken) },
          data: { branch_id: fallbackBranchId },
        });
        if (!switchRes.ok()) {
          const body = await switchRes.text().catch(() => "");
          throw new Error(`switch branch failed: ${switchRes.status()} ${body.slice(0, 200)}`);
        }
      }
    }

    return await api.storageState();
  } finally {
    await api.dispose();
  }
}

async function expectOk(response, label) {
  if (response.ok()) {
    return await response.json().catch(() => ({}));
  }
  const body = await response.text().catch(() => "");
  throw new Error(`${label} failed ${response.status()} ${body.slice(0, 240)}`);
}

function extractData(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object" && "data" in payload) {
    return payload.data;
  }
  return payload;
}

function extractList(payload) {
  const data = extractData(payload);
  if (Array.isArray(data)) return data;
  return [];
}

function isActiveProduct(product) {
  return Boolean(product?.id) && product?.is_active !== false;
}

async function getCsrfToken(api) {
  const payload = await expectOk(await api.get("/api/csrf"), "csrf");
  const token = payload?.csrfToken ?? payload?.data?.csrfToken;
  if (!token) throw new Error("csrf token missing");
  return String(token);
}

async function ensureOpenShift(api, csrfToken) {
  const current = await api.get("/api/pos/shifts/current");
  if (current.status() !== 404) {
    await expectOk(current, "shift current");
    return;
  }

  const open = await api.post("/api/pos/shifts/open", {
    headers: { "X-CSRF-Token": csrfToken },
    data: { start_amount: 0 },
  });
  if (![200, 201, 400, 409].includes(open.status())) {
    await expectOk(open, "shift open");
  }
}

async function pickBurstProduct(api) {
  const payload = await expectOk(
    await api.get("/api/pos/products?page=1&limit=100"),
    "list products"
  );
  const products = extractList(payload);
  const active = products.find((item) => isActiveProduct(item));
  if (!active) {
    throw new Error("no active product available for burst profile");
  }
  return active;
}

async function createOrderForBurst(api, csrfToken, product, index) {
  const unitPrice = Number(product?.price ?? 0);
  if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
    throw new Error(`invalid product price for ${product?.id}`);
  }

  const orderNo = `PERF-BURST-${Date.now()}-${index}-${Math.floor(Math.random() * 10000)}`;
  const payload = {
    order_no: orderNo,
    order_type: "TakeAway",
    sub_total: unitPrice,
    discount_amount: 0,
    vat: 0,
    total_amount: unitPrice,
    received_amount: 0,
    change_amount: 0,
    status: "Pending",
    discount_id: null,
    payment_method_id: null,
    table_id: null,
    delivery_id: null,
    delivery_code: null,
    items: [
      {
        product_id: String(product.id),
        quantity: 1,
        price: unitPrice,
        total_price: unitPrice,
        discount_amount: 0,
        notes: `PERF burst ${index}`,
        status: "Cooking",
        details: [],
      },
    ],
  };

  const createdPayload = await expectOk(
    await api.post("/api/pos/orders", {
      headers: { "X-CSRF-Token": csrfToken },
      data: payload,
    }),
    "create order burst"
  );
  const created = extractData(createdPayload) || {};
  const orderId = String(created?.id || "");
  if (!orderId) {
    throw new Error("create order response missing id");
  }

  const orderPayload = await expectOk(await api.get(`/api/pos/orders/${orderId}`), "fetch order detail");
  const order = extractData(orderPayload) || {};
  const items = Array.isArray(order?.items) ? order.items : [];
  const firstItem = items.find((item) => item?.id);
  if (!firstItem) {
    throw new Error(`order ${orderId} missing item`);
  }

  return {
    orderId,
    itemId: String(firstItem.id),
    unitPrice,
  };
}

async function prepareOrderSocketBurstTargets(api) {
  const csrfToken = await getCsrfToken(api);
  await ensureOpenShift(api, csrfToken);
  const product = await pickBurstProduct(api);

  const createdOrders = [];
  for (let i = 0; i < burstOrderCount; i += 1) {
    const created = await createOrderForBurst(api, csrfToken, product, i + 1);
    createdOrders.push(created);
  }

  return { csrfToken, createdOrders };
}

async function triggerOrderSocketBurst(api, burstTargets) {
  const { csrfToken, createdOrders } = burstTargets;
  const counters = {
    itemUpdateRequests: 0,
    itemStatusPatchRequests: 0,
  };

  for (let round = 0; round < burstUpdateRounds; round += 1) {
    const nextQuantity = round % 2 === 0 ? 2 : 1;
    const nextStatus = round % 2 === 0 ? "Pending" : "Cooking";

    await Promise.all(
      createdOrders.flatMap(({ itemId, unitPrice }) => [
        api.put(`/api/pos/orders/items/${itemId}`, {
          headers: { "X-CSRF-Token": csrfToken },
          data: {
            quantity: nextQuantity,
            price: unitPrice,
            total_price: unitPrice * nextQuantity,
            notes: `PERF round ${round + 1}`,
            details: [],
          },
        }),
        api.patch(`/api/pos/orders/items/${itemId}/status`, {
          headers: { "X-CSRF-Token": csrfToken },
          data: { status: nextStatus },
        }),
      ])
    ).then(async (responses) => {
      await Promise.all(
        responses.map(async (response, idx) => {
          const label = idx % 2 === 0 ? "item update burst" : "item status burst";
          await expectOk(response, label);
          if (idx % 2 === 0) counters.itemUpdateRequests += 1;
          else counters.itemStatusPatchRequests += 1;
        })
      );
    });

    if (burstIntervalMs > 0) {
      await sleep(burstIntervalMs);
    }
  }

  return {
    ordersCreated: createdOrders.length,
    ...counters,
    totalMutations: counters.itemUpdateRequests + counters.itemStatusPatchRequests,
  };
}

function emptyInvalidateSnapshot() {
  return {
    requestedTotal: 0,
    executedTotal: 0,
    requestedByKey: {},
    executedByKey: {},
  };
}

function normalizeInvalidateSnapshot(raw) {
  if (!raw || typeof raw !== "object") return emptyInvalidateSnapshot();
  return {
    requestedTotal: Number(raw.requestedTotal || 0),
    executedTotal: Number(raw.executedTotal || 0),
    requestedByKey:
      raw.requestedByKey && typeof raw.requestedByKey === "object" ? { ...raw.requestedByKey } : {},
    executedByKey:
      raw.executedByKey && typeof raw.executedByKey === "object" ? { ...raw.executedByKey } : {},
  };
}

function diffCounterMap(beforeMap, afterMap) {
  const keys = new Set([
    ...Object.keys(beforeMap || {}),
    ...Object.keys(afterMap || {}),
  ]);
  const diff = {};
  for (const key of keys) {
    diff[key] = Number(afterMap?.[key] || 0) - Number(beforeMap?.[key] || 0);
  }
  return diff;
}

function sumCounterMap(counterMap) {
  return Object.values(counterMap || {}).reduce((sum, value) => sum + Number(value || 0), 0);
}

function createMetrics(label) {
  return {
    label,
    totalRequests: 0,
    apiRequests: 0,
    ordersSummaryRequests: 0,
    ordersListRequests: 0,
    channelStatsRequests: 0,
    api2xx: 0,
    api4xx: 0,
    api5xx: 0,
    failedRequests: 0,
    socketConnections: 0,
    socketFramesIn: 0,
    socketFramesOut: 0,
    reconnectCycles,
    reconnectApiRequests: 0,
    reconnectSocketFramesIn: 0,
    reconnectSocketFramesOut: 0,
    burstApiRequests: 0,
    burstOrdersSummaryRequests: 0,
    burstOrdersListRequests: 0,
    burstChannelStatsRequests: 0,
    burstSocketFramesIn: 0,
    burstSocketFramesOut: 0,
    burstOrdersCreated: 0,
    burstMutationRequests: 0,
    burstItemUpdateRequests: 0,
    burstItemStatusPatchRequests: 0,
    invalidateMetricsAvailable: false,
    burstInvalidateRequested: 0,
    burstInvalidateExecuted: 0,
    burstInvalidateSuppressed: 0,
    burstInvalidateRequestedByKey: {},
    burstInvalidateExecutedByKey: {},
    socketClientState: {},
    burstSocketEventsTotal: 0,
    burstSocketEventsByName: {},
    uniqueApiPaths: new Set(),
  };
}

async function runProfile(label, options = {}) {
  const { disableDebounce = false } = options;
  const storageState = await createLoggedInState();
  const api = await playwrightRequest.newContext({
    baseURL: frontendBaseUrl,
    ignoreHTTPSErrors: true,
    storageState,
  });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    baseURL: frontendBaseUrl,
    ignoreHTTPSErrors: true,
    storageState,
  });
  await context.addInitScript((shouldDisable) => {
    window.__POS_PERF_DISABLE_INVALIDATE_DEBOUNCE__ = shouldDisable === true;
  }, disableDebounce);
  const page = await context.newPage();
  const metrics = createMetrics(label);

  let reconnectStartApi = 0;
  let reconnectStartFramesIn = 0;
  let reconnectStartFramesOut = 0;
  let burstStartApi = 0;
  let burstStartFramesIn = 0;
  let burstStartFramesOut = 0;
  let burstStartOrdersSummary = 0;
  let burstStartOrdersList = 0;
  let burstStartChannelStats = 0;
  let burstStartInvalidate = emptyInvalidateSnapshot();
  let burstStartSocketEvents = {};

  const resetInvalidateMetrics = async () => {
    await page
      .evaluate(() => {
        window.__POS_PERF_INVALIDATE_METRICS__ = {
          requestedTotal: 0,
          executedTotal: 0,
          requestedByKey: {},
          executedByKey: {},
        };
      })
      .catch(() => undefined);
  };

  const readInvalidateMetrics = async () => {
    const raw = await page
      .evaluate(() => {
        return window.__POS_PERF_INVALIDATE_METRICS__ ?? null;
      })
      .catch(() => null);
    return normalizeInvalidateSnapshot(raw);
  };

  const resetSocketEvents = async () => {
    await page
      .evaluate(() => {
        window.__POS_PERF_SOCKET_EVENTS__ = {};
      })
      .catch(() => undefined);
  };

  const readSocketEvents = async () => {
    const raw = await page
      .evaluate(() => {
        return window.__POS_PERF_SOCKET_EVENTS__ ?? {};
      })
      .catch(() => ({}));
    if (!raw || typeof raw !== "object") return {};
    return { ...raw };
  };

  const readSocketClientState = async () => {
    const raw = await page
      .evaluate(() => {
        return window.__POS_PERF_SOCKET_STATE__ ?? {};
      })
      .catch(() => ({}));
    if (!raw || typeof raw !== "object") return {};
    return { ...raw };
  };

  const trackRequest = (request) => {
    const url = request.url();
    metrics.totalRequests += 1;
    if (!url.includes("/api/")) return;
    metrics.apiRequests += 1;
    try {
      const parsed = new URL(url);
      metrics.uniqueApiPaths.add(parsed.pathname);
      if (parsed.pathname.includes("/api/pos/orders/summary")) {
        metrics.ordersSummaryRequests += 1;
      }
      if (parsed.pathname === "/api/pos/orders") {
        metrics.ordersListRequests += 1;
      }
      if (parsed.pathname.includes("/api/pos/orders/stats")) {
        metrics.channelStatsRequests += 1;
      }
    } catch {
      // ignore parse errors
    }
  };

  const trackResponse = (response) => {
    const url = response.url();
    if (!url.includes("/api/")) return;
    const status = response.status();
    if (status >= 500) metrics.api5xx += 1;
    else if (status >= 400) metrics.api4xx += 1;
    else if (status >= 200 && status < 300) metrics.api2xx += 1;
  };

  page.on("request", trackRequest);
  page.on("response", trackResponse);
  page.on("requestfailed", (request) => {
    if (request.url().includes("/api/")) {
      metrics.failedRequests += 1;
    }
  });
  page.on("websocket", (ws) => {
    if (!ws.url().includes("/socket.io")) return;
    metrics.socketConnections += 1;
    ws.on("framereceived", () => {
      metrics.socketFramesIn += 1;
    });
    ws.on("framesent", () => {
      metrics.socketFramesOut += 1;
    });
  });

  try {
    const warmupCsrfToken = await getCsrfToken(api);
    await ensureOpenShift(api, warmupCsrfToken);

    await page.goto(`${frontendBaseUrl}${profilePath}`, { waitUntil: "domcontentloaded" });
    await sleep(3000);
    await waitForCondition(() => metrics.socketConnections > 0, 15000);
    await sleep(2000);
    metrics.socketClientState = await readSocketClientState();
    await resetInvalidateMetrics();
    await resetSocketEvents();

    reconnectStartApi = metrics.apiRequests;
    reconnectStartFramesIn = metrics.socketFramesIn;
    reconnectStartFramesOut = metrics.socketFramesOut;

    for (let i = 0; i < reconnectCycles; i += 1) {
      await context.setOffline(true);
      await sleep(900);
      await context.setOffline(false);
      await sleep(2300);
    }
    await sleep(3000);

    const burstTargets = await prepareOrderSocketBurstTargets(api);

    burstStartApi = metrics.apiRequests;
    burstStartFramesIn = metrics.socketFramesIn;
    burstStartFramesOut = metrics.socketFramesOut;
    burstStartOrdersSummary = metrics.ordersSummaryRequests;
    burstStartOrdersList = metrics.ordersListRequests;
    burstStartChannelStats = metrics.channelStatsRequests;
    burstStartInvalidate = await readInvalidateMetrics();
    burstStartSocketEvents = await readSocketEvents();

    const burst = await triggerOrderSocketBurst(api, burstTargets);
    metrics.burstOrdersCreated = burst.ordersCreated;
    metrics.burstMutationRequests = burst.totalMutations;
    metrics.burstItemUpdateRequests = burst.itemUpdateRequests;
    metrics.burstItemStatusPatchRequests = burst.itemStatusPatchRequests;

    await sleep(burstSettleMs);
    const burstEndInvalidate = await readInvalidateMetrics();
    metrics.invalidateMetricsAvailable = true;
    metrics.burstInvalidateRequested =
      burstEndInvalidate.requestedTotal - burstStartInvalidate.requestedTotal;
    metrics.burstInvalidateExecuted =
      burstEndInvalidate.executedTotal - burstStartInvalidate.executedTotal;
    metrics.burstInvalidateSuppressed =
      metrics.burstInvalidateRequested - metrics.burstInvalidateExecuted;
    metrics.burstInvalidateRequestedByKey = diffCounterMap(
      burstStartInvalidate.requestedByKey,
      burstEndInvalidate.requestedByKey
    );
    metrics.burstInvalidateExecutedByKey = diffCounterMap(
      burstStartInvalidate.executedByKey,
      burstEndInvalidate.executedByKey
    );

    const burstEndSocketEvents = await readSocketEvents();
    metrics.burstSocketEventsByName = diffCounterMap(burstStartSocketEvents, burstEndSocketEvents);
    metrics.burstSocketEventsTotal = sumCounterMap(metrics.burstSocketEventsByName);
  } finally {
    await api.dispose();
    await context.close();
    await browser.close();
  }

  metrics.reconnectApiRequests = metrics.apiRequests - reconnectStartApi;
  metrics.reconnectSocketFramesIn = metrics.socketFramesIn - reconnectStartFramesIn;
  metrics.reconnectSocketFramesOut = metrics.socketFramesOut - reconnectStartFramesOut;
  metrics.burstApiRequests = metrics.apiRequests - burstStartApi;
  metrics.burstSocketFramesIn = metrics.socketFramesIn - burstStartFramesIn;
  metrics.burstSocketFramesOut = metrics.socketFramesOut - burstStartFramesOut;
  metrics.burstOrdersSummaryRequests = metrics.ordersSummaryRequests - burstStartOrdersSummary;
  metrics.burstOrdersListRequests = metrics.ordersListRequests - burstStartOrdersList;
  metrics.burstChannelStatsRequests = metrics.channelStatsRequests - burstStartChannelStats;
  metrics.uniqueApiPaths = Array.from(metrics.uniqueApiPaths).sort();
  return metrics;
}

function summarize(before, after) {
  const percent = (oldValue, newValue) => {
    if (!oldValue) return 0;
    return ((newValue - oldValue) / oldValue) * 100;
  };

  return {
    reconnectApiRequestsDelta: after.reconnectApiRequests - before.reconnectApiRequests,
    reconnectApiRequestsDeltaPct: percent(before.reconnectApiRequests, after.reconnectApiRequests),
    totalApiRequestsDelta: after.apiRequests - before.apiRequests,
    totalApiRequestsDeltaPct: percent(before.apiRequests, after.apiRequests),
    socketFramesInDelta: after.reconnectSocketFramesIn - before.reconnectSocketFramesIn,
    socketFramesOutDelta: after.reconnectSocketFramesOut - before.reconnectSocketFramesOut,
    burstApiRequestsDelta: after.burstApiRequests - before.burstApiRequests,
    burstApiRequestsDeltaPct: percent(before.burstApiRequests, after.burstApiRequests),
    burstOrdersSummaryRequestsDelta:
      after.burstOrdersSummaryRequests - before.burstOrdersSummaryRequests,
    burstOrdersListRequestsDelta: after.burstOrdersListRequests - before.burstOrdersListRequests,
    burstChannelStatsRequestsDelta:
      after.burstChannelStatsRequests - before.burstChannelStatsRequests,
    burstSocketFramesInDelta: after.burstSocketFramesIn - before.burstSocketFramesIn,
    burstSocketFramesOutDelta: after.burstSocketFramesOut - before.burstSocketFramesOut,
    burstInvalidateRequestedDelta:
      after.burstInvalidateRequested - before.burstInvalidateRequested,
    burstInvalidateExecutedDelta: after.burstInvalidateExecuted - before.burstInvalidateExecuted,
    burstInvalidateSuppressedDelta:
      after.burstInvalidateSuppressed - before.burstInvalidateSuppressed,
    burstSocketEventsTotalDelta: after.burstSocketEventsTotal - before.burstSocketEventsTotal,
  };
}

async function main() {
  const outDir = path.resolve(frontendDir, "test-results", "perf-pos-main");
  await fs.mkdir(outDir, { recursive: true });
  const patchFile = path.join(os.tmpdir(), `perf-pos-main-${Date.now()}.patch`);
  const useGitCompare = compareMode === "git";
  let patchContent = "";
  if (useGitCompare) {
    patchContent = await getPatchContent();
    await fs.writeFile(patchFile, patchContent, "utf8");
  }

  let backend;
  let frontend;
  let before;
  let after;
  try {
    backend = await startBackend();
    await ensureE2EUser();
    if (useGitCompare) {
      console.log("[perf] profiling baseline (HEAD)");
      await checkoutHeadState();
      frontend = await startFrontend();
      before = await runProfile("before");
      await killTree(frontend);
      frontend = undefined;

      console.log("[perf] profiling optimized (working tree)");
      if (patchContent.trim().length > 0) {
        await applyPatchFile(patchFile);
      }
      frontend = await startFrontend();
      after = await runProfile("after");
      await killTree(frontend);
      frontend = undefined;
    } else {
      console.log("[perf] profiling before (debounce disabled)");
      frontend = await startFrontend();
      before = await runProfile("before", { disableDebounce: true });

      console.log("[perf] profiling after (debounce enabled)");
      after = await runProfile("after", { disableDebounce: false });
      await killTree(frontend);
      frontend = undefined;
    }
  } finally {
    if (frontend) await killTree(frontend);
    if (backend) await killTree(backend);
    if (useGitCompare && patchContent.trim().length > 0) {
      const currentDiff = await getPatchContent();
      if (currentDiff.trim().length === 0) {
        await applyPatchFile(patchFile).catch(() => undefined);
      }
    }
    await fs.rm(patchFile, { force: true }).catch(() => undefined);
  }

  if (!before || !after) {
    throw new Error("profiling did not produce both before and after results");
  }

  const diff = summarize(before, after);
  const report = {
    generatedAt: new Date().toISOString(),
    frontendBaseUrl,
    backendBaseUrl,
    compareMode: useGitCompare ? "git" : "debounce-toggle",
    profilePath,
    reconnectCycles,
    burstConfig: {
      orderCount: burstOrderCount,
      updateRounds: burstUpdateRounds,
      intervalMs: burstIntervalMs,
      settleMs: burstSettleMs,
    },
    before,
    after,
    diff,
  };

  const jsonPath = path.join(outDir, "pos-main-before-after.json");
  await fs.writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  const mdPath = path.join(outDir, "pos-main-before-after.md");
  const lines = [
    "# POS Main Profiling (Before vs After)",
    "",
    `- Generated at: ${report.generatedAt}`,
    `- Frontend: \`${frontendBaseUrl}\``,
    `- Backend: \`${backendBaseUrl}\``,
    `- Compare mode: \`${report.compareMode}\``,
    `- Profile route: \`${profilePath}\``,
    `- Reconnect cycles: ${reconnectCycles}`,
    `- Burst: ${burstOrderCount} orders x ${burstUpdateRounds} rounds (interval ${burstIntervalMs}ms, settle ${burstSettleMs}ms)`,
    `- Socket client state before burst (before run): \`${JSON.stringify(before.socketClientState)}\``,
    `- Socket client state before burst (after run): \`${JSON.stringify(after.socketClientState)}\``,
    "",
    "## Before (Reconnect)",
    `- API requests (total): ${before.apiRequests}`,
    `- API requests during reconnect cycles: ${before.reconnectApiRequests}`,
    `- Socket frames in during reconnect cycles: ${before.reconnectSocketFramesIn}`,
    `- Socket frames out during reconnect cycles: ${before.reconnectSocketFramesOut}`,
    "",
    "## After (Reconnect)",
    `- API requests (total): ${after.apiRequests}`,
    `- API requests during reconnect cycles: ${after.reconnectApiRequests}`,
    `- Socket frames in during reconnect cycles: ${after.reconnectSocketFramesIn}`,
    `- Socket frames out during reconnect cycles: ${after.reconnectSocketFramesOut}`,
    "",
    "## Delta (Reconnect)",
    `- API requests during reconnect: ${diff.reconnectApiRequestsDelta} (${diff.reconnectApiRequestsDeltaPct.toFixed(2)}%)`,
    `- API requests total: ${diff.totalApiRequestsDelta} (${diff.totalApiRequestsDeltaPct.toFixed(2)}%)`,
    `- Socket frames in during reconnect: ${diff.socketFramesInDelta}`,
    `- Socket frames out during reconnect: ${diff.socketFramesOutDelta}`,
    "",
    "## Before (Socket Burst)",
    `- Burst mutation requests (driver): ${before.burstMutationRequests}`,
    `- Burst orders created: ${before.burstOrdersCreated}`,
    `- API requests during burst window: ${before.burstApiRequests}`,
    `- Orders summary requests during burst: ${before.burstOrdersSummaryRequests}`,
    `- Orders list requests during burst: ${before.burstOrdersListRequests}`,
    `- Channel stats requests during burst: ${before.burstChannelStatsRequests}`,
    `- Invalidate requested during burst: ${before.burstInvalidateRequested}`,
    `- Invalidate executed during burst: ${before.burstInvalidateExecuted}`,
    `- Invalidate suppressed during burst: ${before.burstInvalidateSuppressed}`,
    `- Socket events received during burst: ${before.burstSocketEventsTotal}`,
    `- Socket frames in during burst: ${before.burstSocketFramesIn}`,
    `- Socket frames out during burst: ${before.burstSocketFramesOut}`,
    "",
    "## After (Socket Burst)",
    `- Burst mutation requests (driver): ${after.burstMutationRequests}`,
    `- Burst orders created: ${after.burstOrdersCreated}`,
    `- API requests during burst window: ${after.burstApiRequests}`,
    `- Orders summary requests during burst: ${after.burstOrdersSummaryRequests}`,
    `- Orders list requests during burst: ${after.burstOrdersListRequests}`,
    `- Channel stats requests during burst: ${after.burstChannelStatsRequests}`,
    `- Invalidate requested during burst: ${after.burstInvalidateRequested}`,
    `- Invalidate executed during burst: ${after.burstInvalidateExecuted}`,
    `- Invalidate suppressed during burst: ${after.burstInvalidateSuppressed}`,
    `- Socket events received during burst: ${after.burstSocketEventsTotal}`,
    `- Socket frames in during burst: ${after.burstSocketFramesIn}`,
    `- Socket frames out during burst: ${after.burstSocketFramesOut}`,
    "",
    "## Delta (Socket Burst)",
    `- API requests during burst: ${diff.burstApiRequestsDelta} (${diff.burstApiRequestsDeltaPct.toFixed(2)}%)`,
    `- Orders summary requests during burst: ${diff.burstOrdersSummaryRequestsDelta}`,
    `- Orders list requests during burst: ${diff.burstOrdersListRequestsDelta}`,
    `- Channel stats requests during burst: ${diff.burstChannelStatsRequestsDelta}`,
    `- Invalidate requested during burst: ${diff.burstInvalidateRequestedDelta}`,
    `- Invalidate executed during burst: ${diff.burstInvalidateExecutedDelta}`,
    `- Invalidate suppressed during burst: ${diff.burstInvalidateSuppressedDelta}`,
    `- Socket events received during burst: ${diff.burstSocketEventsTotalDelta}`,
    `- Socket frames in during burst: ${diff.burstSocketFramesInDelta}`,
    `- Socket frames out during burst: ${diff.burstSocketFramesOutDelta}`,
    "",
    "## Invalidate Breakdown (Burst)",
    `- Before requested by key: \`${JSON.stringify(before.burstInvalidateRequestedByKey)}\``,
    `- Before executed by key: \`${JSON.stringify(before.burstInvalidateExecutedByKey)}\``,
    `- Before socket events by name: \`${JSON.stringify(before.burstSocketEventsByName)}\``,
    `- After requested by key: \`${JSON.stringify(after.burstInvalidateRequestedByKey)}\``,
    `- After executed by key: \`${JSON.stringify(after.burstInvalidateExecutedByKey)}\``,
    `- After socket events by name: \`${JSON.stringify(after.burstSocketEventsByName)}\``,
    "",
    `Raw JSON: \`${jsonPath}\``,
  ];
  await fs.writeFile(mdPath, `${lines.join("\n")}\n`, "utf8");

  console.log(`[perf] report saved: ${mdPath}`);
  console.log(
    `[perf] reconnect API requests before=${before.reconnectApiRequests} after=${after.reconnectApiRequests}`
  );
  console.log(
    `[perf] burst API requests before=${before.burstApiRequests} after=${after.burstApiRequests}`
  );
  console.log(
    `[perf] burst invalidates executed before=${before.burstInvalidateExecuted} after=${after.burstInvalidateExecuted}`
  );
  console.log(
    `[perf] burst socket events before=${before.burstSocketEventsTotal} after=${after.burstSocketEventsTotal}`
  );
}

main().catch((error) => {
  console.error(`[perf] failed: ${error.message}`);
  process.exit(1);
});
