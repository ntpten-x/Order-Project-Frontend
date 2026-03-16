import { expect, test, type Page } from "@playwright/test";

type AnyJson = Record<string, unknown> | Array<unknown> | null;
type ActiveRecord = { id?: string; is_active?: boolean };
type OrderItemRecord = { id?: string };
type OrderRecord = { id?: string; items?: OrderItemRecord[]; total_amount?: number | string };

function unwrap<T>(json: AnyJson): T | AnyJson {
  if (!json || typeof json !== "object") return json;
  if (Array.isArray(json)) return json;
  const maybeData = (json as Record<string, unknown>).data;
  return (maybeData !== undefined ? maybeData : json) as T | AnyJson;
}

function pickList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    const maybeData = (payload as Record<string, unknown>).data;
    if (Array.isArray(maybeData)) return maybeData as T[];
  }
  return [];
}

async function waitForAuthenticated(page: Page, timeoutMs: number): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const meResp = await page.request.get("/api/auth/me");
    if (meResp.ok()) return true;
    await page.waitForTimeout(500);
  }
  return false;
}

async function safeGoto(page: Page, target: string): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.goto(target, { waitUntil: "domcontentloaded" });
      return;
    } catch (error) {
      const message = String(error);
      if (message.includes("interrupted by another navigation")) {
        await page.waitForLoadState("domcontentloaded");
        continue;
      }
      throw error;
    }
  }
  await page.goto(target, { waitUntil: "domcontentloaded" });
}

test("phase7 POS browser flow + API flow (cancel/pay/dashboard)", async ({ page }) => {
  test.setTimeout(180000);

  const username =
    process.env.E2E_USERNAME ||
    process.env.E2E_ADMIN_USERNAME ||
    "admin";
  const password =
    process.env.E2E_PASSWORD ||
    process.env.E2E_ADMIN_PASSWORD ||
    "Admin123456!";

  await page.goto("/login");
  await page.locator('input[autocomplete="username"]').fill(username);
  await page.locator('input[autocomplete="current-password"]').fill(password);
  await page.locator('button[type="submit"]').click();

  const authOk = await waitForAuthenticated(page, 30000);
  expect(authOk).toBeTruthy();

  if (page.url().includes("/login")) {
    await safeGoto(page, "/pos");
  }
  await expect(page).not.toHaveURL(/\/login/);

  const csrfResp = await page.request.get("/api/csrf");
  expect(csrfResp.ok()).toBeTruthy();
  const csrfJson = await csrfResp.json();
  const csrfToken =
    (csrfJson?.csrfToken as string | undefined) ||
    (csrfJson?.data?.csrfToken as string | undefined);
  expect(csrfToken).toBeTruthy();

  const productsResp = await page.request.get("/api/pos/products?page=1&limit=20");
  expect(productsResp.ok()).toBeTruthy();
  const productsPayload = unwrap<ActiveRecord[]>(await productsResp.json());
  const products = pickList<ActiveRecord>(productsPayload);
  const product = products.find((p) => p?.is_active !== false);
  expect(product?.id).toBeTruthy();

  const methodsResp = await page.request.get("/api/pos/paymentMethod?page=1&limit=20");
  expect(methodsResp.ok()).toBeTruthy();
  const methodsPayload = unwrap<ActiveRecord[]>(await methodsResp.json());
  const methods = pickList<ActiveRecord>(methodsPayload);
  const paymentMethod = methods.find((m) => m?.is_active !== false);
  expect(paymentMethod?.id).toBeTruthy();

  const shiftResp = await page.request.post("/api/pos/shifts/open", {
    headers: { "x-csrf-token": csrfToken as string },
    data: { start_amount: 0 },
  });
  if (!shiftResp.ok() && shiftResp.status() !== 409 && shiftResp.status() !== 400) {
    throw new Error(`failed to open shift: ${shiftResp.status()}`);
  }

  const orderResp = await page.request.post("/api/pos/orders", {
    headers: { "x-csrf-token": csrfToken as string },
    data: {
      order_type: "TakeAway",
      items: [
        { product_id: product!.id, quantity: 1 },
        { product_id: product!.id, quantity: 1 },
      ],
    },
  });
  expect(orderResp.ok()).toBeTruthy();
  const orderPayload = unwrap<OrderRecord>(await orderResp.json()) as OrderRecord;
  const orderId = orderPayload?.id as string | undefined;
  expect(orderId).toBeTruthy();

  const orderGetResp = await page.request.get(`/api/pos/orders/${orderId}`);
  expect(orderGetResp.ok()).toBeTruthy();
  const orderGetPayload = unwrap<OrderRecord>(await orderGetResp.json()) as OrderRecord;
  const items = Array.isArray(orderGetPayload?.items) ? orderGetPayload.items : [];
  expect(items.length).toBeGreaterThanOrEqual(2);

  const cancelItemId = items[1]?.id as string | undefined;
  expect(cancelItemId).toBeTruthy();

  const cancelResp = await page.request.patch(`/api/pos/orders/items/${cancelItemId}/status`, {
    headers: { "x-csrf-token": csrfToken as string },
    data: { status: "Cancelled" },
  });
  expect(cancelResp.ok()).toBeTruthy();

  const orderAfterCancelResp = await page.request.get(`/api/pos/orders/${orderId}`);
  expect(orderAfterCancelResp.ok()).toBeTruthy();
  const orderAfterCancelPayload = unwrap<OrderRecord>(await orderAfterCancelResp.json()) as OrderRecord;
  const totalAmount = Number(orderAfterCancelPayload?.total_amount || 0);
  expect(totalAmount).toBeGreaterThan(0);

  const paymentResp = await page.request.post("/api/pos/payments", {
    headers: { "x-csrf-token": csrfToken as string },
    data: {
      order_id: orderId,
      payment_method_id: paymentMethod!.id,
      amount: totalAmount,
      amount_received: totalAmount,
      status: "Success",
    },
  });
  expect(paymentResp.ok()).toBeTruthy();

  await safeGoto(page, "/pos/items");
  await expect(page).toHaveURL(/\/pos\/items/);

  await safeGoto(page, "/pos/dashboard");
  await expect(page).toHaveURL(/\/pos\/dashboard/);

  const today = new Date().toISOString().slice(0, 10);
  const salesResp = await page.request.get(
    `/api/pos/dashboard/sales?startDate=${today}&endDate=${today}`
  );
  expect(salesResp.ok()).toBeTruthy();
});
