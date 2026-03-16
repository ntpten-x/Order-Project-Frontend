import { expect, request as playwrightRequest, test, type APIRequestContext, type Locator, type Page } from "@playwright/test";
import { getCsrfToken, login, readJson, unwrapData, unwrapList } from "./helpers.api-auth";

const adminUsername = process.env.E2E_ADMIN_USERNAME || "admin";
const adminPassword = process.env.E2E_ADMIN_PASSWORD || "Admin123456!";
const backendBaseUrl = process.env.E2E_BACKEND_BASE_URL || "http://localhost:3000";
const frontendBaseUrl = process.env.E2E_BASE_URL || "http://localhost:3001";

type Category = { id: string };
type ProductsUnit = { id: string };
type Product = { id: string; display_name: string };
type Topping = { id: string; display_name: string };
type ToppingGroup = { id: string; display_name: string };
type TakeawayQrInfo = { token: string; customer_path: string };

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

async function getTakeawayQr(context: APIRequestContext): Promise<TakeawayQrInfo> {
  const currentResponse = await context.get("/api/pos/takeaway-qr");
  if (currentResponse.ok()) {
    const current = unwrapData<TakeawayQrInfo>(await readJson(currentResponse));
    if (current.token && current.customer_path) {
      return current;
    }
  }

  const csrf = await getCsrfToken(context);
  const response = await context.post("/api/pos/takeaway-qr/rotate", {
    headers: { "X-CSRF-Token": csrf },
  });
  expect(response.ok(), `POST /api/pos/takeaway-qr/rotate failed: ${await response.text()}`).toBeTruthy();
  return unwrapData<TakeawayQrInfo>(await readJson(response));
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

async function openDetailModalForCartItem(page: Page, productName: string): Promise<Locator> {
  const cartDrawer = await openCart(page);
  const row = cartDrawer.locator("li").filter({ hasText: productName }).first();
  await expect(row).toBeVisible({ timeout: 30000 });
  await row.getByRole("button", { name: /เพิ่มท็อปปิ้ง/i }).click();
  const detailModal = page.getByRole("dialog").last();
  await expect(detailModal).toBeVisible({ timeout: 30000 });
  return detailModal;
}

test.describe.serial("Topping group visibility on docker", () => {
  test("shows toppings only for products assigned to the same topping group", async ({ page }) => {
    const frontendRequest = await playwrightRequest.newContext({ baseURL: frontendBaseUrl });
    const backendRequest = await playwrightRequest.newContext({
      baseURL: backendBaseUrl,
      extraHTTPHeaders: { Origin: frontendBaseUrl },
    });

    let eligibleProduct: Product | null = null;
    let blockedProduct: Product | null = null;
    let topping: Topping | null = null;
    let toppingGroup: ToppingGroup | null = null;

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
        display_name: `E2E Visibility Group ${uniqueSuffix}`,
        is_active: true,
      });

      eligibleProduct = await postWithCsrf<Product>(frontendRequest, "/api/pos/products/create", {
        display_name: `E2E Eligible Product ${uniqueSuffix}`,
        description: "Eligible topping group product",
        price: 85,
        price_delivery: 85,
        category_id: category.id,
        unit_id: unit.id,
        topping_group_ids: [toppingGroup.id],
        is_active: true,
      });

      blockedProduct = await postWithCsrf<Product>(frontendRequest, "/api/pos/products/create", {
        display_name: `E2E Blocked Product ${uniqueSuffix}`,
        description: "No topping group product",
        price: 45,
        price_delivery: 45,
        category_id: category.id,
        unit_id: unit.id,
        is_active: true,
      });

      topping = await postToBackendWithCsrf<Topping>(backendRequest, "/pos/topping", {
        display_name: `E2E Shared Topping ${uniqueSuffix}`,
        price: 9,
        price_delivery: 9,
        category_ids: [category.id],
        topping_group_ids: [toppingGroup.id],
        is_active: true,
      });

      const takeawayQr = await getTakeawayQr(frontendRequest);
      const takeawayToken = takeawayQr.customer_path.split("/").filter(Boolean).pop();
      expect(takeawayToken).toBeTruthy();

      await page.addInitScript(
        ({ token, identityValue }) => {
          window.sessionStorage.setItem(
            `public-takeaway-customer:${token}`,
            JSON.stringify({ customer_name: identityValue }),
          );
        },
        { token: takeawayToken, identityValue: `E2E Visibility ${uniqueSuffix}` },
      );

      await page.goto(`${frontendBaseUrl}/order/takeaway/${takeawayToken}`, { waitUntil: "domcontentloaded" });

      await searchAndAddProduct(page, blockedProduct.display_name);
      const blockedModal = await openDetailModalForCartItem(page, blockedProduct.display_name);
      await expect(blockedModal.getByText(/ไม่มีท็อปปิ้ง/i)).toBeVisible();
      await blockedModal.getByRole("button", { name: /ยกเลิก/i }).click();
      await closeCartIfOpen(page);

      await searchAndAddProduct(page, eligibleProduct.display_name);
      const eligibleModal = await openDetailModalForCartItem(page, eligibleProduct.display_name);
      await eligibleModal.getByText("เลือก", { exact: true }).click();
      const selectorModal = page.getByRole("dialog").filter({ hasText: topping.display_name }).last();
      await expect(selectorModal).toBeVisible({ timeout: 30000 });
      await expect(selectorModal.getByText(topping.display_name, { exact: false })).toContainText("9");
      await selectorModal.getByText(topping.display_name, { exact: false }).click();
      await page.keyboard.press("Escape");
      await eligibleModal.getByRole("button", { name: /ยกเลิก/i }).click();
    } finally {
      const cleanupTasks: Array<Promise<unknown>> = [];

      if (topping?.id) cleanupTasks.push(deleteFromBackendWithCsrf(backendRequest, `/pos/topping/${topping.id}`).catch(() => undefined));
      if (eligibleProduct?.id) cleanupTasks.push(deleteWithCsrf(frontendRequest, `/api/pos/products/delete/${eligibleProduct.id}`).catch(() => undefined));
      if (blockedProduct?.id) cleanupTasks.push(deleteWithCsrf(frontendRequest, `/api/pos/products/delete/${blockedProduct.id}`).catch(() => undefined));
      if (toppingGroup?.id) cleanupTasks.push(deleteFromBackendWithCsrf(backendRequest, `/pos/topping-group/${toppingGroup.id}`).catch(() => undefined));

      await Promise.allSettled(cleanupTasks);
      await frontendRequest.dispose();
      await backendRequest.dispose();
    }
  });
});
