#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const BASE_URL = process.env.UAT_BASE_URL || "https://system.pos-hub.shop";
const USERNAME = process.env.UAT_USERNAME || "admin";
const PASSWORD = process.env.UAT_PASSWORD || "27451tenX.";
const RUN_ID = process.env.UAT_RUN_ID || `UAT-${Date.now()}`;

class SkipCaseError extends Error {
  constructor(message) {
    super(message);
    this.name = "SkipCaseError";
  }
}

const state = {
  csrfToken: "",
  user: null,
  product: null,
  paymentMethod: null,
  deliveryPaymentMethod: null,
  deliveryProvider: null,
  table: null,
  takeawayOrderId: null,
};

function nowIso() {
  return new Date().toISOString();
}

async function safeGoto(page, targetUrl) {
  for (let i = 0; i < 3; i += 1) {
    try {
      await page.goto(targetUrl, { waitUntil: "domcontentloaded" });
      return;
    } catch (error) {
      const text = String(error?.message || error);
      if (!text.includes("interrupted by another navigation")) throw error;
      await page.waitForTimeout(400);
    }
  }
  await page.goto(targetUrl, { waitUntil: "domcontentloaded" });
}

function unwrap(payload) {
  if (!payload || typeof payload !== "object") return payload;
  if (Array.isArray(payload)) return payload;
  if (payload.data !== undefined) return payload.data;
  return payload;
}

function toList(payload) {
  const raw = unwrap(payload);
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object" && Array.isArray(raw.data)) return raw.data;
  return [];
}

async function readJsonSafe(response) {
  return response.json().catch(() => ({}));
}

async function getCsrfToken(request) {
  const response = await request.get("/api/csrf");
  if (!response.ok()) {
    throw new Error(`GET /api/csrf failed: ${response.status()}`);
  }
  const payload = await readJsonSafe(response);
  const token = payload?.csrfToken || payload?.data?.csrfToken;
  if (!token || typeof token !== "string") {
    throw new Error("csrf token not found in response");
  }
  return token;
}

async function loginByApi(request) {
  state.csrfToken = await getCsrfToken(request);
  const loginRes = await request.post("/api/auth/login", {
    headers: { "X-CSRF-Token": state.csrfToken },
    data: { username: USERNAME, password: PASSWORD },
  });
  if (!loginRes.ok()) {
    const body = await loginRes.text();
    throw new Error(`POST /api/auth/login failed: ${loginRes.status()} ${body}`);
  }

  const meRes = await request.get("/api/auth/me");
  if (!meRes.ok()) {
    throw new Error(`GET /api/auth/me failed: ${meRes.status()}`);
  }
  const me = unwrap(await readJsonSafe(meRes));
  state.user = me;
}

async function api(request, method, url, data, includeCsrf = false) {
  const headers = {};
  if (includeCsrf) headers["X-CSRF-Token"] = state.csrfToken;
  const response = await request.fetch(url, {
    method,
    headers,
    data,
  });
  const payload = await readJsonSafe(response);
  if (!response.ok()) {
    throw new Error(`${method} ${url} failed: ${response.status()} ${JSON.stringify(payload)}`);
  }
  return payload;
}

async function fetchResources(request) {
  const [productsRaw, methodsRaw, providersRaw, tablesRaw] = await Promise.all([
    api(request, "GET", "/api/pos/products?page=1&limit=100"),
    api(request, "GET", "/api/pos/paymentMethod?page=1&limit=100"),
    api(request, "GET", "/api/pos/delivery?page=1&limit=100"),
    api(request, "GET", "/api/pos/tables?page=1&limit=200"),
  ]);

  const products = toList(productsRaw).filter((p) => p?.is_active !== false);
  const methods = toList(methodsRaw).filter((m) => m?.is_active !== false);
  const providers = toList(providersRaw).filter((d) => d?.is_active !== false);
  const tables = toList(tablesRaw).filter((t) => t?.is_active !== false);

  state.product = products.find((p) => p?.id && (p?.price || p?.price_delivery));
  state.paymentMethod = methods.find(
    (m) => String(m?.payment_method_name || "").toLowerCase() !== "delivery"
  );
  state.deliveryPaymentMethod = methods.find(
    (m) => String(m?.payment_method_name || "").toLowerCase() === "delivery"
  );
  state.deliveryProvider = providers.find((d) => d?.id);
  state.table = tables.find((t) => String(t?.status || "").toLowerCase() === "available");

  if (!state.product?.id) {
    throw new Error("no active product available for UAT");
  }
  if (!state.paymentMethod?.id) {
    throw new Error("no active non-delivery payment method available for UAT");
  }
}

function buildCreateOrderPayload(orderType, options = {}) {
  const unitPrice =
    orderType === "Delivery"
      ? Number(state.product?.price_delivery ?? state.product?.price ?? 0)
      : Number(state.product?.price ?? 0);
  const items = [
    {
      product_id: state.product.id,
      quantity: 1,
      price: unitPrice,
      notes: `${RUN_ID}-item-1`,
      discount_amount: 0,
      total_price: unitPrice,
      details: [],
    },
    {
      product_id: state.product.id,
      quantity: 1,
      price: unitPrice,
      notes: `${RUN_ID}-item-2`,
      discount_amount: 0,
      total_price: unitPrice,
      details: [],
    },
  ];

  return {
    order_type: orderType,
    items,
    ...(options.tableId ? { table_id: options.tableId } : {}),
    ...(options.deliveryId ? { delivery_id: options.deliveryId } : {}),
    ...(options.deliveryCode ? { delivery_code: options.deliveryCode } : {}),
  };
}

async function createOrder(request, orderType, options = {}) {
  const payload = buildCreateOrderPayload(orderType, options);
  const createdRaw = await api(request, "POST", "/api/pos/orders", payload, true);
  const created = unwrap(createdRaw);
  if (!created?.id) {
    throw new Error(`order create missing id: ${JSON.stringify(createdRaw)}`);
  }
  return created;
}

async function getOrder(request, orderId) {
  const orderRaw = await api(request, "GET", `/api/pos/orders/${orderId}`);
  return unwrap(orderRaw);
}

async function moveToWaitingViaUi(page, orderId, orderType) {
  await safeGoto(page, `/pos/orders/${orderId}`);
  await page.waitForLoadState("domcontentloaded");

  const servedActionCount = await page
    .getByRole("button", { name: /เสิร์ฟ|ทำแล้ว|ยกเลิกเสิร์ฟ|ยกเลิกปรุงเสร็จ/i })
    .count();
  if (servedActionCount !== 0) {
    throw new Error(`found obsolete served action button(s): count=${servedActionCount}`);
  }

  const mainLabel =
    orderType === "Delivery" ? "ไปขั้นตอนส่งมอบเดลิเวอรี่" : "ไปขั้นตอนชำระเงิน";
  const modalConfirmLabel = orderType === "Delivery" ? "ไปหน้าส่งมอบ" : "ไปหน้าชำระเงิน";

  const transitionButton = page.getByRole("button", { name: mainLabel }).first();
  await transitionButton.waitFor({ state: "visible", timeout: 30000 });
  if (await transitionButton.isDisabled()) {
    throw new Error(`transition button disabled unexpectedly: ${mainLabel}`);
  }
  await transitionButton.click();

  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ state: "visible", timeout: 15000 });
  await dialog.getByRole("button", { name: modalConfirmLabel }).click();

  if (orderType === "Delivery") {
    await page.waitForURL(new RegExp(`/pos/items/delivery/${orderId}`), { timeout: 30000 });
  } else {
    await page.waitForURL(new RegExp(`/pos/items/payment/${orderId}`), { timeout: 30000 });
  }
}

async function createPaymentByApi(request, orderId, methodId, amount) {
  return api(
    request,
    "POST",
    "/api/pos/payments",
    {
      order_id: orderId,
      payment_method_id: methodId,
      amount,
      amount_received: amount,
      change_amount: 0,
      status: "Success",
    },
    true
  );
}

function isWaitingStatus(status) {
  return String(status || "").toLowerCase() === "waitingforpayment";
}

function isPaidOrCompleted(status) {
  const normalized = String(status || "").toLowerCase();
  return normalized === "paid" || normalized === "completed";
}

function formatCaseResult(result) {
  const details = result.details ? ` - ${result.details}` : "";
  return `- ${result.id}: ${result.status}${details}`;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    baseURL: BASE_URL,
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  const request = context.request;
  const results = [];

  async function runCase(id, title, fn) {
    process.stdout.write(`\n[${id}] ${title}\n`);
    const startedAt = nowIso();
    try {
      const details = await fn();
      results.push({ id, title, status: "PASS", startedAt, endedAt: nowIso(), details });
      process.stdout.write(`[${id}] PASS\n`);
    } catch (error) {
      if (error instanceof SkipCaseError) {
        results.push({
          id,
          title,
          status: "SKIPPED",
          startedAt,
          endedAt: nowIso(),
          details: error.message,
        });
        process.stdout.write(`[${id}] SKIPPED: ${error.message}\n`);
      } else {
        const message = String(error?.message || error);
        results.push({ id, title, status: "FAIL", startedAt, endedAt: nowIso(), details: message });
        process.stdout.write(`[${id}] FAIL: ${message}\n`);
      }
    }
  }

  await runCase("TC-00", "Login + Resource Bootstrap", async () => {
    await loginByApi(request);
    await fetchResources(request);
    return `user=${state.user?.username || "unknown"}, product=${state.product?.id}`;
  });

  await runCase("TC-01", "Open shift guard / shift readiness", async () => {
    const currentRes = await request.get("/api/pos/shifts/current");
    if (currentRes.status() === 404) {
      const opened = await api(request, "POST", "/api/pos/shifts/open", { start_amount: 0 }, true);
      const shift = unwrap(opened);
      if (!shift?.id) {
        throw new Error(`open shift failed: ${JSON.stringify(opened)}`);
      }
    } else if (!currentRes.ok()) {
      throw new Error(`GET /api/pos/shifts/current failed: ${currentRes.status()}`);
    }

    await safeGoto(page, "/pos/channels");
    await page.waitForURL(/\/pos\/channels/, { timeout: 30000 });
    return `channels page reachable after shift check`;
  });

  await runCase("TC-02", "Create TakeAway order", async () => {
    const created = await createOrder(request, "TakeAway");
    state.takeawayOrderId = created.id;
    const fresh = await getOrder(request, created.id);
    if (!Array.isArray(fresh?.items) || fresh.items.length < 2) {
      throw new Error(`created order has insufficient items: ${JSON.stringify(fresh)}`);
    }
    return `orderId=${created.id}, orderNo=${created.order_no || "-"}`;
  });

  await runCase("TC-03", "Order detail management actions + no Served action", async () => {
    if (!state.takeawayOrderId) throw new Error("missing takeaway order id from TC-02");
    const orderId = state.takeawayOrderId;

    await safeGoto(page, `/pos/orders/${orderId}`);
    await page.waitForURL(new RegExp(`/pos/orders/${orderId}`), { timeout: 30000 });

    const servedActionCount = await page
      .getByRole("button", { name: /เสิร์ฟ|ทำแล้ว|ยกเลิกเสิร์ฟ|ยกเลิกปรุงเสร็จ/i })
      .count();
    if (servedActionCount !== 0) {
      throw new Error(`found obsolete served action button(s): count=${servedActionCount}`);
    }

    const price = Number(state.product?.price ?? 0);
    const addPayload = {
      product_id: state.product.id,
      quantity: 1,
      price,
      notes: `${RUN_ID}-add-item`,
      discount_amount: 0,
      total_price: price,
      details: [],
    };
    await api(request, "POST", `/api/pos/orders/${orderId}/items`, addPayload, true);

    const afterAdd = await getOrder(request, orderId);
    const itemForEdit = (afterAdd.items || []).find((item) => item.status !== "Cancelled");
    if (!itemForEdit?.id) throw new Error("no editable item found after add");

    await api(
      request,
      "PUT",
      `/api/pos/orders/items/${itemForEdit.id}`,
      { quantity: Math.max(2, Number(itemForEdit.quantity || 1)), notes: `${RUN_ID}-edited`, details: [] },
      true
    );

    const secondItem = (afterAdd.items || []).find((item) => item.id !== itemForEdit.id);
    if (secondItem?.id) {
      await api(
        request,
        "PATCH",
        `/api/pos/orders/items/${secondItem.id}/status`,
        { status: "Cancelled" },
        true
      );
    }

    const afterEdit = await getOrder(request, orderId);
    const deletable = (afterEdit.items || []).find((item) => String(item.notes || "").includes(`${RUN_ID}-add-item`));
    if (deletable?.id) {
      await api(request, "DELETE", `/api/pos/orders/items/${deletable.id}`, undefined, true);
    }

    const finalOrder = await getOrder(request, orderId);
    const activeCount = (finalOrder.items || []).filter(
      (item) => String(item.status || "").toLowerCase() !== "cancelled"
    ).length;
    if (activeCount < 1) {
      throw new Error("expected at least one active item after management operations");
    }
    return `orderId=${orderId}, activeItems=${activeCount}`;
  });

  await runCase("TC-04", "Move TakeAway to WaitingForPayment directly from Order Detail UI", async () => {
    if (!state.takeawayOrderId) throw new Error("missing takeaway order id from TC-02");
    const orderId = state.takeawayOrderId;
    await moveToWaitingViaUi(page, orderId, "TakeAway");

    const updated = await getOrder(request, orderId);
    if (!isWaitingStatus(updated?.status)) {
      throw new Error(`expected WaitingForPayment, got status=${updated?.status}`);
    }
    return `redirected to payment page and status=${updated.status}`;
  });

  await runCase("TC-05", "Complete payment for TakeAway order", async () => {
    if (!state.takeawayOrderId) throw new Error("missing takeaway order id from TC-02");
    const orderId = state.takeawayOrderId;

    const order = await getOrder(request, orderId);
    const total = Number(order?.total_amount || 0);
    if (!(total > 0)) {
      throw new Error(`invalid total amount for payment: ${total}`);
    }

    await createPaymentByApi(request, orderId, state.paymentMethod.id, total);
    await safeGoto(page, `/pos/dashboard/${orderId}?from=payment`);
    await page.waitForURL(new RegExp(`/pos/dashboard/${orderId}`), { timeout: 30000 });

    const afterPay = await getOrder(request, orderId);
    return `payment created, order status=${afterPay?.status || "unknown"}`;
  });

  await runCase("TC-06", "Delivery direct flow: Order Detail -> WaitingForPayment -> Delivery page -> payment", async () => {
    if (!state.deliveryProvider?.id) {
      throw new SkipCaseError("no active delivery provider in production");
    }
    if (!state.deliveryPaymentMethod?.id) {
      throw new SkipCaseError("no payment method named Delivery");
    }

    const created = await createOrder(request, "Delivery", {
      deliveryId: state.deliveryProvider.id,
      deliveryCode: `${RUN_ID}-DEL`,
    });
    const orderId = created.id;

    await moveToWaitingViaUi(page, orderId, "Delivery");
    const waiting = await getOrder(request, orderId);
    if (!isWaitingStatus(waiting?.status)) {
      throw new Error(`expected WaitingForPayment for delivery, got ${waiting?.status}`);
    }

    const total = Number(waiting?.total_amount || 0);
    if (!(total > 0)) throw new Error(`invalid delivery total amount: ${total}`);
    await createPaymentByApi(request, orderId, state.deliveryPaymentMethod.id, total);
    await safeGoto(page, `/pos/dashboard/${orderId}?from=payment`);
    await page.waitForURL(new RegExp(`/pos/dashboard/${orderId}`), { timeout: 30000 });

    const finalOrder = await getOrder(request, orderId);
    return `orderId=${orderId}, finalStatus=${finalOrder?.status || "unknown"}`;
  });

  await runCase("TC-07", "Guarded route consistency (/pos/orders/:id redirects when waiting)", async () => {
    const created = await createOrder(request, "TakeAway");
    const orderId = created.id;
    await api(request, "PUT", `/api/pos/orders/${orderId}`, { status: "WaitingForPayment" }, true);

    await safeGoto(page, `/pos/orders/${orderId}`);
    await page.waitForURL(new RegExp(`/pos/items/payment/${orderId}`), { timeout: 30000 });

    const updated = await getOrder(request, orderId);
    if (!isWaitingStatus(updated?.status)) {
      throw new Error(`expected waiting status after update, got ${updated?.status}`);
    }
    return `redirect ok to /pos/items/payment/${orderId}`;
  });

  await runCase("TC-08", "Empty transition protection (all items cancelled -> transition disabled)", async () => {
    const created = await createOrder(request, "TakeAway");
    const orderId = created.id;
    const order = await getOrder(request, orderId);
    const allItems = Array.isArray(order?.items) ? order.items : [];
    if (allItems.length === 0) throw new Error("created order has no items");

    for (const item of allItems) {
      await api(
        request,
        "PATCH",
        `/api/pos/orders/items/${item.id}/status`,
        { status: "Cancelled" },
        true
      );
    }

    await safeGoto(page, `/pos/orders/${orderId}`);
    await page.waitForURL(new RegExp(`/pos/orders/${orderId}`), { timeout: 30000 });

    const transitionButton = page.getByRole("button", { name: "ไปขั้นตอนชำระเงิน" }).first();
    await transitionButton.waitFor({ state: "visible", timeout: 30000 });
    const disabled = await transitionButton.isDisabled();
    if (!disabled) {
      throw new Error("expected transition button to be disabled when all items are cancelled");
    }

    await page
      .getByText("ต้องมีสินค้าอย่างน้อย 1 รายการเพื่อไปหน้าชำระเงิน")
      .waitFor({ state: "visible", timeout: 15000 });
    return `disabled-state verified on orderId=${orderId}`;
  });

  await browser.close();

  const outputDir = path.join(process.cwd(), "test-results-uat");
  await fs.mkdir(outputDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outputPath = path.join(outputDir, `uat-pos-new-flow-production-${stamp}.md`);

  const passCount = results.filter((r) => r.status === "PASS").length;
  const failCount = results.filter((r) => r.status === "FAIL").length;
  const skipCount = results.filter((r) => r.status === "SKIPPED").length;

  const lines = [];
  lines.push(`# UAT Result: POS New Flow on Production`);
  lines.push(``);
  lines.push(`- Run ID: \`${RUN_ID}\``);
  lines.push(`- Base URL: \`${BASE_URL}\``);
  lines.push(`- Executed At: ${nowIso()}`);
  lines.push(`- Summary: PASS=${passCount}, FAIL=${failCount}, SKIPPED=${skipCount}`);
  lines.push(``);
  lines.push(`## Case Results`);
  lines.push(...results.map(formatCaseResult));

  await fs.writeFile(outputPath, `${lines.join("\n")}\n`, "utf8");

  process.stdout.write(`\nUAT report written to: ${outputPath}\n`);
  process.stdout.write(`Summary: PASS=${passCount}, FAIL=${failCount}, SKIPPED=${skipCount}\n`);
  if (failCount > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`UAT run failed: ${error?.stack || error}`);
  process.exit(1);
});

