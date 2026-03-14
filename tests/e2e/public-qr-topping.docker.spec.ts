import { expect, request as playwrightRequest, test, type APIRequestContext, type Locator, type Page } from "@playwright/test";
import { getCsrfToken, login, readJson, unwrapData, unwrapList } from "./helpers.api-auth";

const adminUsername = process.env.E2E_ADMIN_USERNAME || "admin";
const adminPassword = process.env.E2E_ADMIN_PASSWORD || "Admin123456!";
const backendBaseUrl = process.env.E2E_BACKEND_BASE_URL || "http://localhost:3000";
const frontendBaseUrl = process.env.E2E_BASE_URL || "http://localhost:3001";

type Category = { id: string };
type ProductsUnit = { id: string };
type Product = { id: string; display_name: string; price?: number; price_delivery?: number };
type ToppingGroup = { id: string; display_name: string };
type Topping = { id: string; display_name: string; price: number; price_delivery?: number };
type Table = { id: string; table_name: string };
type TableQrInfo = { table_id: string; customer_path: string | null; qr_code_token: string | null };
type TakeawayQrInfo = { token: string; customer_path: string };
type PublicOrderDetail = { detail_name: string; extra_price: number; topping_id?: string | null };
type PublicOrderItem = { display_name: string; price: number; total_price: number; details?: PublicOrderDetail[] };
type PublicOrder = { id: string; total_amount: number; items: PublicOrderItem[] };
type PublicTableOrderState = { active_order: PublicOrder | null };
type PublicTakeawayOrderState = { order: PublicOrder | null };
type PublicSubmitResponse = { order: PublicOrder };

async function postWithCsrf<T>(context: APIRequestContext, url: string, data: unknown): Promise<T> {
  const csrf = await getCsrfToken(context);
  const response = await context.post(url, {
    headers: { "X-CSRF-Token": csrf },
    data,
  });
  expect(response.ok(), `POST ${url} failed: ${await response.text()}`).toBeTruthy();
  return unwrapData<T>(await readJson(response));
}

async function postWithCsrfNoBody<T>(context: APIRequestContext, url: string): Promise<T> {
  const csrf = await getCsrfToken(context);
  const response = await context.post(url, {
    headers: { "X-CSRF-Token": csrf },
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

async function createTableWithQr(context: APIRequestContext, uniqueSuffix: string): Promise<{ table: Table; qr: TableQrInfo }> {
  const table = await postWithCsrf<Table>(context, "/api/pos/tables/create", {
    table_name: `E2E QR Table ${uniqueSuffix}`,
    status: "Available",
    is_active: true,
  });

  const qrResponse = await context.get(`/api/pos/tables/${table.id}/qr`);
  expect(qrResponse.ok(), `GET /api/pos/tables/${table.id}/qr failed: ${await qrResponse.text()}`).toBeTruthy();

  return {
    table,
    qr: unwrapData<TableQrInfo>(await readJson(qrResponse)),
  };
}

async function getTakeawayQr(context: APIRequestContext): Promise<TakeawayQrInfo> {
  const currentResponse = await context.get("/api/pos/takeaway-qr");
  if (currentResponse.ok()) {
    const current = unwrapData<TakeawayQrInfo>(await readJson(currentResponse));
    if (current.token && current.customer_path) {
      return current;
    }
  }

  return postWithCsrfNoBody<TakeawayQrInfo>(context, "/api/pos/takeaway-qr/rotate");
}

async function closeCartIfOpen(page: Page): Promise<void> {
  const cartDrawer = page.getByRole("dialog").filter({ hasText: /ตะกร้าสินค้า/i }).last();
  if (!(await cartDrawer.isVisible().catch(() => false))) {
    return;
  }

  await cartDrawer.getByRole("button", { name: /close/i }).click();
  await expect(cartDrawer).not.toBeVisible({ timeout: 30000 });
}

async function searchAndAddProduct(page: Page, productName: string): Promise<void> {
  await closeCartIfOpen(page);

  const searchBox = page.getByRole("textbox").first();
  await expect(searchBox).toBeVisible({ timeout: 30000 });
  await searchBox.fill(productName);

  const productCard = page.locator("article.pos-product-card").filter({ hasText: productName }).first();
  await expect(productCard).toBeVisible({ timeout: 30000 });
  await productCard.locator(".pos-add-button").click();
}

async function openCart(page: Page): Promise<Locator> {
  const cartDrawer = page.getByRole("dialog").filter({ hasText: /ตะกร้าสินค้า/i }).last();
  if (await cartDrawer.isVisible().catch(() => false)) {
    return cartDrawer;
  }

  const cartButton = page.getByRole("button", { name: /ตะกร้าสินค้า/i });
  await expect(cartButton).toBeVisible({ timeout: 30000 });
  await cartButton.click();

  await expect(cartDrawer).toBeVisible({ timeout: 30000 });
  return cartDrawer;
}

async function addToppingFromCart(page: Page, topping: Topping, expectedPriceText: string): Promise<void> {
  const cartDrawer = await openCart(page);
  await cartDrawer.getByRole("button", { name: /เพิ่มท็อปปิ้ง/i }).click();

  const detailModal = page.getByRole("dialog").last();
  await expect(detailModal).toBeVisible({ timeout: 30000 });
  await detailModal.getByText("เลือก", { exact: true }).click();

  const selectorModal = page.getByRole("dialog").filter({ hasText: topping.display_name }).last();
  await expect(selectorModal).toBeVisible({ timeout: 30000 });
  await expect(selectorModal.getByText(topping.display_name, { exact: false })).toContainText(expectedPriceText);
  await selectorModal.getByText(topping.display_name, { exact: false }).click();
  await page.keyboard.press("Escape");

  await detailModal.locator(".btn-confirm").click();
  await expect(detailModal.getByText(topping.display_name)).toBeVisible();
  await detailModal.getByRole("button", { name: /บันทึก/i }).click();

  await expect(cartDrawer.getByText(topping.display_name)).toBeVisible({ timeout: 30000 });
}

async function openCheckoutFromCart(page: Page): Promise<void> {
  const cartDrawer = await openCart(page);
  await cartDrawer.locator(".ant-drawer-footer button.ant-btn-primary").click();
}

async function confirmCheckout(page: Page) {
  const checkoutDrawer = page.getByRole("dialog").filter({ hasText: /สรุปรายการออเดอร์/i }).last();
  await expect(checkoutDrawer).toBeVisible({ timeout: 30000 });
  await checkoutDrawer.locator(".ant-drawer-footer button.ant-btn-primary").click();
}

test.describe.serial("Public QR ordering toppings on docker", () => {
  test("supports topping selection on dine-in table QR and takeaway QR flows", async ({ page }) => {
    const frontendRequest = await playwrightRequest.newContext({ baseURL: frontendBaseUrl });
    const backendRequest = await playwrightRequest.newContext({
      baseURL: backendBaseUrl,
      extraHTTPHeaders: { Origin: frontendBaseUrl },
    });

    let product: Product | null = null;
    let toppingGroup: ToppingGroup | null = null;
    let topping: Topping | null = null;
    let table: Table | null = null;
    let tableOrderId: string | null = null;
    let takeawayOrderId: string | null = null;

    try {
      await login(frontendRequest, adminUsername, adminPassword);
      await loginBackend(backendRequest, adminUsername, adminPassword);
      await ensureShiftOpen(frontendRequest);

      const categoriesResponse = await frontendRequest.get("/api/pos/category");
      expect(categoriesResponse.ok()).toBeTruthy();
      const categories = unwrapList<Category>(await readJson(categoriesResponse)).filter((category) => category.id);
      expect(categories.length).toBeGreaterThan(0);

      const unitsResponse = await frontendRequest.get("/api/pos/productsUnit");
      expect(unitsResponse.ok()).toBeTruthy();
      const units = unwrapList<ProductsUnit>(await readJson(unitsResponse)).filter((unit) => unit.id);
      expect(units.length).toBeGreaterThan(0);

      const uniqueSuffix = `${Date.now()}`;
      const category = categories[0];
      const unit = units[0];
      toppingGroup = await postToBackendWithCsrf<ToppingGroup>(backendRequest, "/pos/topping-group", {
        display_name: `E2E Public QR Group ${uniqueSuffix}`,
        is_active: true,
      });

      product = await postWithCsrf<Product>(frontendRequest, "/api/pos/products/create", {
        display_name: `E2E Public QR Product ${uniqueSuffix}`,
        description: "Playwright public QR topping product",
        price: 100,
        price_delivery: 140,
        category_id: category.id,
        topping_group_ids: [toppingGroup.id],
        unit_id: unit.id,
        is_active: true,
      });

      topping = await postToBackendWithCsrf<Topping>(backendRequest, "/pos/topping", {
        display_name: `E2E Public QR Topping ${uniqueSuffix}`,
        price: 12,
        price_delivery: 19,
        category_ids: [category.id],
        topping_group_ids: [toppingGroup.id],
        is_active: true,
      });

      const tableFixture = await createTableWithQr(frontendRequest, uniqueSuffix);
      table = tableFixture.table;
      expect(tableFixture.qr.customer_path).toBeTruthy();
      const tableToken = String(tableFixture.qr.qr_code_token || "");
      expect(tableToken).toBeTruthy();

      const takeawayQr = await getTakeawayQr(frontendRequest);
      expect(takeawayQr.customer_path).toBeTruthy();

      await page.goto(`${frontendBaseUrl}/order/${tableToken}`, { waitUntil: "domcontentloaded" });
      await searchAndAddProduct(page, product.display_name);
      await addToppingFromCart(page, topping, "12");

      const tableCartDrawer = await openCart(page);
      await expect(tableCartDrawer).toContainText("112");
      await openCheckoutFromCart(page);

      const tableSubmitResponsePromise = page.waitForResponse(
        (response) =>
          response.request().method() === "POST" &&
          response.url().includes(`/api/public/table-order/${tableToken}/order`),
      );
      await confirmCheckout(page);
      const tableSubmitResponse = await tableSubmitResponsePromise;
      expect(tableSubmitResponse.ok(), await tableSubmitResponse.text()).toBeTruthy();
      const tableSubmitPayload = unwrapData<PublicSubmitResponse>(await tableSubmitResponse.json());
      tableOrderId = tableSubmitPayload.order.id;
      expect(tableSubmitPayload.order.items[0]?.details?.[0]?.topping_id).toBe(topping.id);
      expect(Number(tableSubmitPayload.order.items[0]?.details?.[0]?.extra_price || 0)).toBe(12);
      expect(Number(tableSubmitPayload.order.total_amount || 0)).toBe(112);
      const tableOrderStateResponse = await frontendRequest.get(`/api/public/table-order/${tableToken}/order`);
      expect(tableOrderStateResponse.ok()).toBeTruthy();
      const tableOrderState = unwrapData<PublicTableOrderState>(await readJson(tableOrderStateResponse));
      expect(tableOrderState.active_order?.id).toBe(tableOrderId);
      expect(tableOrderState.active_order?.items[0]?.details?.[0]?.topping_id).toBe(topping.id);

      const takeawayToken = takeawayQr.customer_path.split("/").filter(Boolean).pop();
      expect(takeawayToken).toBeTruthy();

      await page.addInitScript(
        ({ token, identityValue }) => {
          window.sessionStorage.setItem(
            `public-takeaway-customer:${token}`,
            JSON.stringify({ customer_name: identityValue }),
          );
        },
        { token: takeawayToken, identityValue: `E2E Customer ${uniqueSuffix}` },
      );
      await page.goto(`${frontendBaseUrl}/order/takeaway/${takeawayToken}`, { waitUntil: "domcontentloaded" });
      await searchAndAddProduct(page, product.display_name);
      await addToppingFromCart(page, topping, "12");

      const takeawayCartDrawer = await openCart(page);
      await expect(takeawayCartDrawer).toContainText("112");
      await openCheckoutFromCart(page);
      const takeawaySubmitResponsePromise = page.waitForResponse(
        (response) =>
          response.request().method() === "POST" &&
          response.url().includes(`/api/public/takeaway-order/${takeawayToken}/order`),
      );
      await confirmCheckout(page);
      const takeawaySubmitResponse = await takeawaySubmitResponsePromise;
      expect(takeawaySubmitResponse.ok(), await takeawaySubmitResponse.text()).toBeTruthy();
      const takeawaySubmitPayload = unwrapData<PublicSubmitResponse>(await takeawaySubmitResponse.json());
      takeawayOrderId = takeawaySubmitPayload.order.id;
      expect(takeawaySubmitPayload.order.items[0]?.details?.[0]?.topping_id).toBe(topping.id);
      expect(Number(takeawaySubmitPayload.order.items[0]?.details?.[0]?.extra_price || 0)).toBe(12);
      expect(Number(takeawaySubmitPayload.order.total_amount || 0)).toBe(112);
      const takeawayOrderStateResponse = await frontendRequest.get(
        `/api/public/takeaway-order/${takeawayToken}/order/${takeawayOrderId}`,
      );
      expect(takeawayOrderStateResponse.ok()).toBeTruthy();
      const takeawayOrderState = unwrapData<PublicTakeawayOrderState>(await readJson(takeawayOrderStateResponse));
      expect(takeawayOrderState.order?.id).toBe(takeawayOrderId);
      expect(takeawayOrderState.order?.items[0]?.details?.[0]?.topping_id).toBe(topping.id);
    } finally {
      const cleanupTasks: Array<Promise<unknown>> = [];

      if (tableOrderId) {
        cleanupTasks.push(deleteWithCsrf(frontendRequest, `/api/pos/orders/${tableOrderId}`).catch(() => undefined));
      }
      if (takeawayOrderId) {
        cleanupTasks.push(deleteWithCsrf(frontendRequest, `/api/pos/orders/${takeawayOrderId}`).catch(() => undefined));
      }
      if (table?.id) {
        cleanupTasks.push(deleteWithCsrf(frontendRequest, `/api/pos/tables/delete/${table.id}`).catch(() => undefined));
      }
      if (topping?.id) {
        cleanupTasks.push(deleteFromBackendWithCsrf(backendRequest, `/pos/topping/${topping.id}`).catch(() => undefined));
      }
      if (product?.id) {
        cleanupTasks.push(deleteWithCsrf(frontendRequest, `/api/pos/products/delete/${product.id}`).catch(() => undefined));
      }
      if (toppingGroup?.id) {
        cleanupTasks.push(deleteFromBackendWithCsrf(backendRequest, `/pos/topping-group/${toppingGroup.id}`).catch(() => undefined));
      }

      await Promise.allSettled(cleanupTasks);
      await frontendRequest.dispose();
      await backendRequest.dispose();
    }
  });
});
