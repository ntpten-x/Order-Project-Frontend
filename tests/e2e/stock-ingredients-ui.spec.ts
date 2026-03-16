import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { getCsrfToken, login, readJson, unwrapData, unwrapList } from "./helpers.api-auth";

type Ingredient = {
  id: string;
  display_name: string;
  unit_id: string;
  category_id: string | null;
  is_active: boolean;
};

type IngredientUnit = {
  id: string;
  display_name: string;
  is_active: boolean;
};

type StockCategory = {
  id: string;
  display_name: string;
  is_active: boolean;
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

async function searchInside(wrapperTestId: string, page: Page, value: string) {
  const control = page.getByTestId(wrapperTestId);
  const tagName = await control.evaluate((element) => element.tagName.toLowerCase());
  if (tagName === "input") {
    await control.fill(value);
    return;
  }

  await control.locator("input").fill(value);
}

async function fetchActiveUnits(context: APIRequestContext): Promise<IngredientUnit[]> {
  const response = await context.get("/api/stock/ingredientsUnit/getAll?page=1&limit=100&status=active");
  expect(response.ok()).toBeTruthy();
  return unwrapList<IngredientUnit>(await readJson(response)).filter((item) => item?.id && item.is_active);
}

async function fetchActiveCategories(context: APIRequestContext): Promise<StockCategory[]> {
  const response = await context.get("/api/stock/category?page=1&limit=100&status=active&sort_created=new");
  expect(response.ok()).toBeTruthy();
  return unwrapList<StockCategory>(await readJson(response)).filter((item) => item?.id && item.is_active);
}

async function createCategory(
  context: APIRequestContext,
  csrfToken: string,
  displayName: string
): Promise<StockCategory> {
  const response = await context.post("/api/stock/category/create", {
    headers: { "X-CSRF-Token": csrfToken },
    data: {
      display_name: displayName,
      is_active: true,
    },
  });
  expect(response.ok()).toBeTruthy();
  return unwrapData<StockCategory>(await readJson(response));
}

async function deleteCategory(context: APIRequestContext, categoryId: string): Promise<void> {
  const csrfToken = await getCsrfToken(context);
  const response = await context.delete(`/api/stock/category/${categoryId}`, {
    headers: { "X-CSRF-Token": csrfToken },
  });
  expect(response.ok()).toBeTruthy();
}

async function findIngredientByDisplayName(
  context: APIRequestContext,
  displayName: string
): Promise<Ingredient | undefined> {
  const params = new URLSearchParams({
    page: "1",
    limit: "100",
    q: displayName,
    sort_created: "new",
  });
  const response = await context.get(`/api/stock/ingredients?${params.toString()}`);
  expect(response.ok()).toBeTruthy();
  return unwrapList<Ingredient>(await readJson(response)).find((item) => item.display_name === displayName);
}

async function findIngredientById(
  context: APIRequestContext,
  ingredientId: string
): Promise<Ingredient | null> {
  const response = await context.get(`/api/stock/ingredients/${ingredientId}`);
  if (response.status() === 404) return null;
  expect(response.ok()).toBeTruthy();
  return unwrapData<Ingredient>(await readJson(response));
}

async function waitForIngredientByDisplayName(
  context: APIRequestContext,
  displayName: string,
  timeoutMs: number = 15000
): Promise<Ingredient> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const ingredient = await findIngredientByDisplayName(context, displayName);
    if (ingredient) return ingredient;
    await new Promise((resolve) => setTimeout(resolve, 400));
  }

  throw new Error(`Ingredient not found within ${timeoutMs}ms: ${displayName}`);
}

async function deleteIngredient(context: APIRequestContext, ingredientId: string): Promise<void> {
  const csrfToken = await getCsrfToken(context);
  const response = await context.delete(`/api/stock/ingredients/${ingredientId}`, {
    headers: { "X-CSRF-Token": csrfToken },
  });
  expect(response.ok()).toBeTruthy();
}

test.describe("Stock ingredients UI", () => {
  test("admin desktop can create, edit, clear category, and delete ingredient", async ({ page }) => {
    test.setTimeout(180000);
    await page.setViewportSize({ width: 1440, height: 1100 });

    await loginToUi(page, credentials.admin.username, credentials.admin.password);

    const units = await fetchActiveUnits(page.request);
    expect(units.length).toBeGreaterThan(0);

    let categories = await fetchActiveCategories(page.request);
    let createdCategoryId: string | null = null;
    if (categories.length === 0) {
      const csrfToken = await getCsrfToken(page.request);
      const createdCategory = await createCategory(page.request, csrfToken, `Ingredient Category ${uniq("stock")}`);
      createdCategoryId = createdCategory.id;
      categories = [createdCategory];
    }

    const unit = units[0];
    const category = categories[0];
    const ingredientName = `Admin Ingredient ${uniq("stock")}`.slice(0, 90);
    const updatedIngredientName = `${ingredientName} Edit`.slice(0, 95);
    let createdIngredientId: string | null = null;

    try {
      await page.goto("/stock/ingredients/manage/add");
      await expect(page.getByTestId("stock-ingredient-manage-page")).toBeVisible();
      await page.getByTestId("stock-ingredient-display-name-input").fill(ingredientName);
      await page.getByTestId("stock-ingredient-unit-picker").click();
      await page.getByTestId(`stock-ingredient-unit-option-${unit.id}`).click();
      await page.getByTestId("stock-ingredient-category-picker").click();
      await page.getByTestId(`stock-ingredient-category-option-${category.id}`).click();
      await page.getByTestId("stock-ingredient-submit").click();

      await expect(page).toHaveURL(/\/stock\/ingredients$/);
      createdIngredientId = (await waitForIngredientByDisplayName(page.request, ingredientName)).id;

      await searchInside("stock-ingredients-search", page, ingredientName);
      await expect(page.getByTestId(`stock-ingredient-card-${createdIngredientId}`)).toBeVisible();

      await page.goto(`/stock/ingredients/manage/edit/${createdIngredientId}`);
      await expect(page.getByTestId("stock-ingredient-manage-page")).toBeVisible();
      await page.getByTestId("stock-ingredient-display-name-input").fill(updatedIngredientName);
      await page.getByTestId("stock-ingredient-category-picker").click();
      await page.getByTestId("stock-ingredient-category-clear").click();
      await page.getByTestId("stock-ingredient-submit").click();

      await expect(page).toHaveURL(/\/stock\/ingredients$/);
      await expect
        .poll(
          async () => {
            const ingredient = createdIngredientId
              ? await findIngredientById(page.request, createdIngredientId)
              : null;
            return ingredient
              ? { display_name: ingredient.display_name, category_id: ingredient.category_id }
              : "pending";
          },
          {
          timeout: 15000,
          }
        )
        .toEqual({
          display_name: updatedIngredientName,
          category_id: null,
        });

      await page.goto(`/stock/ingredients/manage/edit/${createdIngredientId}`);
      await expect(page.getByTestId("stock-ingredient-delete")).toBeVisible();
      await page.getByTestId("stock-ingredient-delete").click();
      await page.locator(".ant-modal-root .ant-btn-dangerous").last().click();

      await expect
        .poll(async () => await findIngredientById(page.request, createdIngredientId!), {
          timeout: 15000,
        })
        .toBeNull();
      createdIngredientId = null;
    } finally {
      if (createdIngredientId) {
        await deleteIngredient(page.request, createdIngredientId);
      }
      if (createdCategoryId) {
        await deleteCategory(page.request, createdCategoryId);
      }
    }
  });

  test("manager tablet can create and update ingredients but cannot delete", async ({ page }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width: 820, height: 1180 });

    await loginToUi(page, credentials.manager.username, credentials.manager.password);

    const units = await fetchActiveUnits(page.request);
    expect(units.length).toBeGreaterThan(0);

    const ingredientName = `Manager Ingredient ${uniq("stock")}`.slice(0, 90);
    const updatedIngredientName = `${ingredientName} Edit`.slice(0, 95);
    let createdIngredientId: string | null = null;

    try {
      await page.goto("/stock/ingredients/manage/add");
      await expect(page.getByTestId("stock-ingredient-manage-page")).toBeVisible();
      await page.getByTestId("stock-ingredient-display-name-input").fill(ingredientName);
      await page.getByTestId("stock-ingredient-unit-picker").click();
      await page.getByTestId(`stock-ingredient-unit-option-${units[0].id}`).click();
      await page.getByTestId("stock-ingredient-submit").click();

      await expect(page).toHaveURL(/\/stock\/ingredients$/);
      createdIngredientId = (await waitForIngredientByDisplayName(page.request, ingredientName)).id;

      await page.goto(`/stock/ingredients/manage/edit/${createdIngredientId}`);
      await expect(page.getByTestId("stock-ingredient-manage-page")).toBeVisible();
      await expect(page.getByTestId("stock-ingredient-delete")).toHaveCount(0);
      await page.getByTestId("stock-ingredient-display-name-input").fill(updatedIngredientName);
      await page.getByTestId("stock-ingredient-submit").click();

      await expect(page).toHaveURL(/\/stock\/ingredients$/);
      createdIngredientId = (await waitForIngredientByDisplayName(page.request, updatedIngredientName)).id;

      await searchInside("stock-ingredients-search", page, updatedIngredientName);
      await expect(page.getByTestId(`stock-ingredient-card-${createdIngredientId}`)).toBeVisible();
    } finally {
      if (createdIngredientId) {
        await login(page.request, credentials.admin.username, credentials.admin.password);
        await deleteIngredient(page.request, createdIngredientId);
      }
    }
  });

  test("employee mobile can view ingredients but cannot open ingredient manage page", async ({ page }) => {
    test.setTimeout(90000);
    await page.setViewportSize({ width: 390, height: 844 });

    await loginToUi(page, credentials.employee.username, credentials.employee.password);

    await page.goto("/stock/ingredients");
    await expect(page.getByTestId("stock-ingredients-page")).toBeVisible();
    await expect(page.getByTestId("stock-ingredients-search")).toBeVisible();
    await expect(page.getByTestId("stock-ingredients-add")).toHaveCount(0);

    await page.goto("/stock/ingredients/manage/add");
    await expect(page.getByTestId("access-guard-fallback")).toBeVisible();
  });
});
