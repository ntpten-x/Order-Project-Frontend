import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { getCsrfToken, login, readJson, unwrapData, unwrapList } from "./helpers.api-auth";

type Ingredient = {
  id: string;
  display_name: string;
  unit_id: string;
  is_active: boolean;
};

type IngredientUnit = {
  id: string;
  display_name: string;
  is_active: boolean;
};

type StockOrder = {
  id: string;
  status: string;
  remark?: string;
  ordered_by_id?: string;
};

const credentials = {
  admin: {
    username: process.env.E2E_ADMIN_USERNAME || "admin",
    password: process.env.E2E_ADMIN_PASSWORD || "Admin123456!",
  },
  manager: {
    username: process.env.E2E_MANAGER_USERNAME || "manager",
    password: process.env.E2E_MANAGER_PASSWORD || "Manager123456!",
  },
  employee: {
    username: process.env.E2E_EMPLOYEE_USERNAME || "employee",
    password: process.env.E2E_EMPLOYEE_PASSWORD || "Employee123456!",
  },
};

function uniq(prefix: string) {
  const now = Date.now().toString(16);
  const rand = Math.random().toString(16).slice(2, 8);
  return `${prefix}_${now}_${rand}`;
}

async function loginToUi(page: Page, username: string, password: string) {
  return login(page.request, username, password);
}

async function fetchActiveUnits(context: APIRequestContext): Promise<IngredientUnit[]> {
  const response = await context.get("/api/stock/ingredientsUnit/getAll?page=1&limit=100&status=active");
  expect(response.ok()).toBeTruthy();
  const payload = await readJson(response);
  return unwrapList<IngredientUnit>(payload).filter((item) => item?.id && item.is_active);
}

async function fetchIngredients(
  context: APIRequestContext,
  search?: string
): Promise<Ingredient[]> {
  const params = new URLSearchParams({
    page: "1",
    limit: "100",
    status: "active",
  });
  if (search) params.set("q", search);

  const response = await context.get(`/api/stock/ingredients?${params.toString()}`);
  expect(response.ok()).toBeTruthy();
  const payload = await readJson(response);
  return unwrapList<Ingredient>(payload).filter((item) => item?.id && item.is_active);
}

async function createIngredient(
  context: APIRequestContext,
  csrfToken: string,
  payload: {
    display_name: string;
    unit_id: string;
    description?: string;
  }
): Promise<Ingredient> {
  const response = await context.post("/api/stock/ingredients/create", {
    headers: { "X-CSRF-Token": csrfToken },
    data: {
      ...payload,
      is_active: true,
    },
  });
  expect(response.ok()).toBeTruthy();
  return unwrapData<Ingredient>(await readJson(response));
}

async function createUnit(
  context: APIRequestContext,
  csrfToken: string,
  payload: {
    display_name: string;
  }
): Promise<IngredientUnit> {
  const response = await context.post("/api/stock/ingredientsUnit/create", {
    headers: { "X-CSRF-Token": csrfToken },
    data: {
      ...payload,
      is_active: true,
    },
  });
  expect(response.ok()).toBeTruthy();
  return unwrapData<IngredientUnit>(await readJson(response));
}

async function findUnitByDisplayName(
  context: APIRequestContext,
  displayName: string
): Promise<IngredientUnit | undefined> {
  const params = new URLSearchParams({
    page: "1",
    limit: "100",
    q: displayName,
  });
  const response = await context.get(`/api/stock/ingredientsUnit/getAll?${params.toString()}`);
  expect(response.ok()).toBeTruthy();
  const payload = await readJson(response);
  return unwrapList<IngredientUnit>(payload).find((item) => item.display_name === displayName);
}

async function findOrderByRemark(
  context: APIRequestContext,
  remark: string
): Promise<StockOrder | undefined> {
  const params = new URLSearchParams({
    page: "1",
    limit: "20",
    q: remark,
    sort_created: "new",
  });
  const response = await context.get(`/api/stock/orders?${params.toString()}`);
  expect(response.ok()).toBeTruthy();
  const payload = await readJson(response);
  return unwrapList<StockOrder>(payload).find((item) => item.remark?.includes(remark));
}

async function getOrder(context: APIRequestContext, orderId: string): Promise<StockOrder> {
  const response = await context.get(`/api/stock/orders/${orderId}`);
  expect(response.ok()).toBeTruthy();
  return unwrapData<StockOrder>(await readJson(response));
}

async function ensureIngredientForOrdering(
  context: APIRequestContext,
  csrfToken: string,
  prefix: string
): Promise<Ingredient> {
  const units = await fetchActiveUnits(context);
  expect(units.length).toBeGreaterThan(0);

  const displayName = `${prefix} ${uniq("ingredient")}`.slice(0, 90);
  return createIngredient(context, csrfToken, {
    display_name: displayName,
    description: "playwright stock browser uat",
    unit_id: units[0].id,
  });
}

async function searchInside(wrapperTestId: string, page: Page, value: string) {
  const control = page.getByTestId(wrapperTestId);
  const tagName = await control.evaluate((element) => element.tagName.toLowerCase());
  if (tagName === "input") {
    await control.fill(value);
    return;
  }

  await control.locator("input").fill(value);
}

test.describe("Stock browser UAT", () => {
  test("admin desktop completes stock order flow from catalog to buying confirmation", async ({ page }) => {
    test.setTimeout(180000);
    await page.setViewportSize({ width: 1440, height: 1100 });

    const me = await loginToUi(page, credentials.admin.username, credentials.admin.password);
    const csrfToken = await getCsrfToken(page.request);
    const ingredient = await ensureIngredientForOrdering(page.request, csrfToken, "Admin UAT");
    const remark = `admin-browser-uat-${uniq("order")}`;

    await page.goto("/stock");
    await expect(page.getByTestId("stock-catalog-page")).toBeVisible();

    await searchInside("stock-catalog-search", page, ingredient.display_name);
    await expect(page.getByTestId(`stock-catalog-add-${ingredient.id}`)).toBeVisible({ timeout: 15000 });
    await page.getByTestId(`stock-catalog-add-${ingredient.id}`).click();

    await page.getByTestId("stock-cart-open").click();
    await expect(page.getByTestId("stock-cart-drawer-content")).toBeVisible();
    await page.getByTestId("stock-cart-remark").fill(remark);
    await page.getByTestId("stock-cart-submit").click();

    await expect(page).toHaveURL(/\/stock\/items/);
    await expect
      .poll(async () => Boolean(await findOrderByRemark(page.request, remark)), {
        timeout: 15000,
      })
      .toBeTruthy();

    const orderRecord = (await findOrderByRemark(page.request, remark)) as StockOrder;
    expect(orderRecord.ordered_by_id).toBe(me.id);

    await searchInside("stock-orders-search", page, remark);
    await expect(page.getByTestId(`stock-order-receive-${orderRecord.id}`)).toBeVisible({ timeout: 15000 });
    await page.getByTestId(`stock-order-receive-${orderRecord.id}`).click();

    await expect(page).toHaveURL(new RegExp(`/stock/buying\\?orderId=${orderRecord.id}`));
    await expect(page.getByTestId("stock-buying-page")).toBeVisible();
    await expect(page.getByTestId(`stock-buying-item-${ingredient.id}`)).toBeVisible({ timeout: 15000 });

    await page.getByTestId("stock-buying-match-all").click();
    await page.getByTestId("stock-buying-confirm-open").click();
    await page.getByTestId("stock-buying-confirm-submit").click();

    await expect(page).toHaveURL(/\/stock\/history/);
    await expect
      .poll(async () => (await getOrder(page.request, orderRecord.id)).status, {
        timeout: 15000,
      })
      .toBe("completed");
  });

  test("manager tablet can create stock unit via UI and access ingredient master pages", async ({ page }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width: 820, height: 1180 });

    await loginToUi(page, credentials.manager.username, credentials.manager.password);
    const unitDisplayName = `UAT Unit ${uniq("manager")}`.slice(0, 90);

    await page.goto("/stock/ingredientsUnit/manage/add");
    await expect(page.getByTestId("stock-ingredients-unit-manage-page")).toBeVisible();
    await page.getByTestId("stock-ingredients-unit-display-name-input").fill(unitDisplayName);
    const csrfToken = await getCsrfToken(page.request);
    await createUnit(page.request, csrfToken, {
      display_name: unitDisplayName,
    });

    await page.goto(`/stock/ingredientsUnit?q=${encodeURIComponent(unitDisplayName)}`);
    await expect(page.getByTestId("stock-ingredients-unit-page")).toBeVisible();
    await expect(page.getByTestId("stock-ingredients-unit-search")).toBeVisible();

    await expect
      .poll(async () => Boolean(await findUnitByDisplayName(page.request, unitDisplayName)), {
        timeout: 15000,
      })
      .toBeTruthy();

    await page.goto("/stock/ingredients");
    await expect(page.getByTestId("stock-ingredients-page")).toBeVisible();
    await expect(page.getByTestId("stock-ingredients-add")).toBeVisible();

    await page.goto("/stock/ingredients/manage/add");
    await expect(page.getByTestId("stock-ingredient-manage-page")).toBeVisible();
    await expect(page.getByTestId("stock-ingredient-display-name-input")).toBeVisible();
  });

  test("employee mobile can create stock order from catalog but cannot open master manage pages", async ({
    page,
  }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width: 390, height: 844 });

    const me = await loginToUi(page, credentials.employee.username, credentials.employee.password);
    const availableIngredients = await fetchIngredients(page.request);
    expect(availableIngredients.length).toBeGreaterThan(0);

    const ingredient = availableIngredients[0];
    const remark = `employee-browser-uat-${uniq("order")}`;

    await page.goto("/stock/ingredients");
    await expect(page.getByTestId("stock-ingredients-page")).toBeVisible();
    await expect(page.getByTestId("stock-ingredients-add")).toHaveCount(0);

    await page.goto("/stock/ingredients/manage/add");
    await expect(page.getByTestId("access-guard-fallback")).toBeVisible();

    await page.goto("/stock");
    await expect(page.getByTestId("stock-catalog-page")).toBeVisible();
    await searchInside("stock-catalog-search", page, ingredient.display_name);
    await expect(page.getByTestId(`stock-catalog-add-${ingredient.id}`)).toBeVisible({ timeout: 15000 });
    await page.getByTestId(`stock-catalog-add-${ingredient.id}`).click();

    await page.getByTestId("stock-cart-open").click();
    await expect(page.getByTestId("stock-cart-drawer-content")).toBeVisible();
    await page.getByTestId("stock-cart-remark").fill(remark);
    await page.getByTestId("stock-cart-submit").click();

    await expect(page).toHaveURL(/\/stock\/items/);
    await expect
      .poll(async () => Boolean(await findOrderByRemark(page.request, remark)), {
        timeout: 15000,
      })
      .toBeTruthy();

    const employeeOrder = (await findOrderByRemark(page.request, remark)) as StockOrder;
    expect(employeeOrder.ordered_by_id).toBe(me.id);
    await expect(page.getByTestId("stock-orders-page")).toBeVisible();
  });
});
