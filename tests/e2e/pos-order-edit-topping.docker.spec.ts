import { expect, request as playwrightRequest, test, type APIRequestContext, type Page } from "@playwright/test";
import { getCsrfToken, login, readJson, unwrapData, unwrapList } from "./helpers.api-auth";

const adminUsername = process.env.E2E_ADMIN_USERNAME || "admin";
const adminPassword = process.env.E2E_ADMIN_PASSWORD || "Admin123456!";
const backendBaseUrl = process.env.E2E_BACKEND_BASE_URL || "http://localhost:3000";
const frontendBaseUrl = process.env.E2E_BASE_URL || "http://localhost:3001";

type Category = { id: string; display_name?: string; is_active?: boolean };
type ProductsUnit = { id: string; display_name?: string; is_active?: boolean };
type Product = { id: string; display_name: string; category_id?: string; price?: number; price_delivery?: number };
type Topping = { id: string; display_name: string; price: number; price_delivery?: number };
type SalesOrder = { id: string; items?: Array<{ id: string }> };

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function postWithCsrf<T>(context: APIRequestContext, url: string, data: unknown): Promise<T> {
  const csrf = await getCsrfToken(context);
  const response = await context.post(url, {
    headers: { "X-CSRF-Token": csrf },
    data,
  });
  expect(response.ok(), `POST ${url} failed: ${await response.text()}`).toBeTruthy();
  return unwrapData<T>(await readJson(response));
}

async function deleteWithCsrf(context: APIRequestContext, url: string): Promise<void> {
  const csrf = await getCsrfToken(context);
  const response = await context.delete(url, {
    headers: { "X-CSRF-Token": csrf },
  });
  expect(response.ok(), `DELETE ${url} failed: ${await response.text()}`).toBeTruthy();
}

async function getBackendCsrfToken(context: APIRequestContext): Promise<string> {
  const response = await context.get("/csrf-token");
  expect(response.ok(), `GET /csrf-token failed: ${await response.text()}`).toBeTruthy();
  const payload = await readJson(response);
  const token = (payload as { csrfToken?: string }).csrfToken;
  expect(typeof token).toBe("string");
  return token as string;
}

async function loginBackend(context: APIRequestContext, username: string, password: string): Promise<void> {
  const response = await context.post("/auth/login", {
    data: { username, password },
  });
  expect(response.ok(), `POST /auth/login failed: ${await response.text()}`).toBeTruthy();

  const meResponse = await context.get("/auth/me");
  expect(meResponse.ok(), `GET /auth/me failed: ${await meResponse.text()}`).toBeTruthy();
}

async function postToBackendWithCsrf<T>(context: APIRequestContext, url: string, data: unknown): Promise<T> {
  const csrf = await getBackendCsrfToken(context);
  const response = await context.post(url, {
    headers: { "X-CSRF-Token": csrf },
    data,
  });
  expect(response.ok(), `POST ${url} failed: ${await response.text()}`).toBeTruthy();
  return unwrapData<T>(await readJson(response));
}

async function deleteFromBackendWithCsrf(context: APIRequestContext, url: string): Promise<void> {
  const csrf = await getBackendCsrfToken(context);
  const response = await context.delete(url, {
    headers: { "X-CSRF-Token": csrf },
  });
  expect(response.ok(), `DELETE ${url} failed: ${await response.text()}`).toBeTruthy();
}

async function ensureShiftOpen(context: APIRequestContext): Promise<void> {
  const currentResponse = await context.get("/api/pos/shifts/current");
  if (currentResponse.ok()) {
    return;
  }

  if (currentResponse.status() !== 404) {
    throw new Error(`Unable to inspect current shift: ${currentResponse.status()} ${await currentResponse.text()}`);
  }

  await postWithCsrf(context, "/api/pos/shifts/open", { start_amount: 0 });
}

async function createOrder(context: APIRequestContext, orderType: "TakeAway" | "Delivery", product: Product): Promise<SalesOrder> {
  await ensureShiftOpen(context);
  return postWithCsrf<SalesOrder>(context, "/api/pos/orders", {
    order_type: orderType,
    items: [
      {
        product_id: product.id,
        quantity: 1,
        discount_amount: 0,
        notes: "",
        details: [],
      },
    ],
  });
}

async function openEditModal(page: Page, orderId: string) {
  await page.setViewportSize({ width: 430, height: 932 });
  await page.goto(`/pos/orders/${orderId}`, { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(new RegExp(`/pos/orders/${orderId}$`));
  await page.getByRole("button", { name: "แก้ไข" }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("แก้ไขรายการสินค้า")).toBeVisible();
  return dialog;
}

test.describe.serial("POS order edit topping modal on docker", () => {
  test("shows topping options in EditItemModal and uses delivery price", async ({ page }) => {
    const backendRequest = await playwrightRequest.newContext({
      baseURL: backendBaseUrl,
      extraHTTPHeaders: {
        Origin: frontendBaseUrl,
      },
    });

    let product: Product | null = null;
    let topping: Topping | null = null;
    let takeawayOrderId: string | null = null;
    let deliveryOrderId: string | null = null;

    try {
      await login(page.request, adminUsername, adminPassword);
      await loginBackend(backendRequest, adminUsername, adminPassword);

      const categoriesResponse = await page.request.get("/api/pos/category");
      expect(categoriesResponse.ok()).toBeTruthy();
      const categories = unwrapList<Category>(await readJson(categoriesResponse)).filter((category) => category.id);
      expect(categories.length).toBeGreaterThan(0);

      const unitsResponse = await page.request.get("/api/pos/productsUnit");
      expect(unitsResponse.ok()).toBeTruthy();
      const units = unwrapList<ProductsUnit>(await readJson(unitsResponse)).filter((unit) => unit.id);
      expect(units.length).toBeGreaterThan(0);

      const uniqueSuffix = `${Date.now()}`;
      const category = categories[0];
      const unit = units[0];

      product = await postWithCsrf<Product>(page.request, "/api/pos/products/create", {
        display_name: `E2E Edit Topping Product ${uniqueSuffix}`,
        description: "Playwright smoke test product",
        price: 100,
        price_delivery: 130,
        category_id: category.id,
        unit_id: unit.id,
        is_active: true,
      });

      topping = await postToBackendWithCsrf<Topping>(backendRequest, "/pos/topping", {
        display_name: `E2E Edit Topping ${uniqueSuffix}`,
        price: 11,
        price_delivery: 22,
        category_ids: [category.id],
        is_active: true,
      });

      const takeawayOrder = await createOrder(page.request, "TakeAway", product);
      const deliveryOrder = await createOrder(page.request, "Delivery", product);
      takeawayOrderId = takeawayOrder.id;
      deliveryOrderId = deliveryOrder.id;

      const takeawayDialog = await openEditModal(page, takeawayOrder.id);
      await takeawayDialog.getByRole("combobox").click();
      const takeawayOption = page.locator(".ant-select-item-option").filter({ hasText: topping.display_name }).first();
      await expect(takeawayOption).toBeVisible();
      await expect(takeawayOption).toContainText("11");
      await page.keyboard.press("Escape");
      await takeawayDialog.getByRole("button", { name: "ยกเลิก", exact: true }).click();

      const deliveryDialog = await openEditModal(page, deliveryOrder.id);
      await deliveryDialog.getByRole("combobox").click();
      const deliveryOption = page.locator(".ant-select-item-option").filter({ hasText: topping.display_name }).first();
      await expect(deliveryOption).toBeVisible();
      await expect(deliveryOption).toContainText("22");
      await deliveryOption.click();
      await deliveryDialog.getByRole("button", { name: "เพิ่มท็อปปิ้ง" }).click();
      await expect(deliveryDialog.getByText(topping.display_name)).toBeVisible();
      await deliveryDialog.getByRole("button", { name: "บันทึกการเปลี่ยนแปลง" }).click();
      await expect(page.getByText("แก้ไขรายการเรียบร้อย")).toBeVisible();
      await expect(
        page.locator("main").getByText(new RegExp(`${escapeRegex(topping.display_name)}.*22`, "i")).last(),
      ).toBeVisible();
    } finally {
      const cleanupTasks: Array<Promise<unknown>> = [];

      if (takeawayOrderId) cleanupTasks.push(deleteWithCsrf(page.request, `/api/pos/orders/${takeawayOrderId}`).catch(() => undefined));
      if (deliveryOrderId) cleanupTasks.push(deleteWithCsrf(page.request, `/api/pos/orders/${deliveryOrderId}`).catch(() => undefined));
      if (topping?.id) cleanupTasks.push(deleteFromBackendWithCsrf(backendRequest, `/pos/topping/${topping.id}`).catch(() => undefined));
      if (product?.id) cleanupTasks.push(deleteWithCsrf(page.request, `/api/pos/products/delete/${product.id}`).catch(() => undefined));

      await Promise.allSettled(cleanupTasks);
      await backendRequest.dispose();
    }
  });
});
