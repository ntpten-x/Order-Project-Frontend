import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { getCsrfToken, login, readJson, unwrapList } from "./helpers.api-auth";

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

async function fetchCategories(
  context: APIRequestContext,
  search?: string
): Promise<StockCategory[]> {
  const params = new URLSearchParams({
    page: "1",
    limit: "100",
    sort_created: "new",
  });
  if (search) params.set("q", search);

  const response = await context.get(`/api/stock/category?${params.toString()}`);
  expect(response.ok()).toBeTruthy();
  return unwrapList<StockCategory>(await readJson(response));
}

async function findCategoryByDisplayName(
  context: APIRequestContext,
  displayName: string
): Promise<StockCategory | undefined> {
  const categories = await fetchCategories(context, displayName);
  return categories.find((item) => item.display_name === displayName);
}

async function deleteCategory(
  context: APIRequestContext,
  categoryId: string
): Promise<void> {
  const csrfToken = await getCsrfToken(context);
  const response = await context.delete(`/api/stock/category/${categoryId}`, {
    headers: { "X-CSRF-Token": csrfToken },
  });
  expect(response.ok()).toBeTruthy();
}

async function waitForCategoryByDisplayName(
  context: APIRequestContext,
  displayName: string,
  timeoutMs: number = 15000
): Promise<StockCategory> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const category = await findCategoryByDisplayName(context, displayName);
    if (category) return category;
    await new Promise((resolve) => setTimeout(resolve, 400));
  }

  throw new Error(`Category not found within ${timeoutMs}ms: ${displayName}`);
}

test.describe("Stock category UI", () => {
  test("admin desktop can create, update, and delete category with stock catalog sync", async ({ page }) => {
    test.setTimeout(180000);
    await page.setViewportSize({ width: 1440, height: 1100 });

    await loginToUi(page, credentials.admin.username, credentials.admin.password);

    const categoryName = `Admin Category ${uniq("stock")}`.slice(0, 90);
    const updatedCategoryName = `${categoryName} Edit`.slice(0, 95);
    let createdCategoryId: string | null = null;

    try {
      await page.goto("/stock/category/manage/add");
      await expect(page.getByTestId("stock-category-manage-page")).toBeVisible();
      await page.getByTestId("stock-category-display-name-input").fill(categoryName);
      await page.getByTestId("stock-category-submit").click();

      await expect(page).toHaveURL(/\/stock\/category$/);
      await expect(page.getByTestId("stock-category-page")).toBeVisible();

      createdCategoryId = (await waitForCategoryByDisplayName(page.request, categoryName)).id;

      await searchInside("stock-category-search", page, categoryName);
      await expect(page.getByText(categoryName)).toBeVisible();

      await page.goto("/stock");
      await expect(page.getByTestId("stock-catalog-page")).toBeVisible();
      await expect(page.getByRole("button", { name: categoryName })).toBeVisible({ timeout: 15000 });

      await page.goto(`/stock/category/manage/edit/${createdCategoryId}`);
      await expect(page.getByTestId("stock-category-manage-page")).toBeVisible();
      await page.getByTestId("stock-category-display-name-input").fill(updatedCategoryName);
      await page.getByTestId("stock-category-submit").click();

      await expect(page).toHaveURL(/\/stock\/category$/);
      createdCategoryId = (await waitForCategoryByDisplayName(page.request, updatedCategoryName)).id;

      await page.goto("/stock");
      await expect(page.getByRole("button", { name: updatedCategoryName })).toBeVisible({ timeout: 15000 });

      await page.goto(`/stock/category/manage/edit/${createdCategoryId}`);
      await expect(page.getByTestId("stock-category-delete")).toBeVisible();
      await page.getByTestId("stock-category-delete").click();
      await page.locator(".ant-modal-root .ant-btn-dangerous").last().click();

      await expect
        .poll(async () => Boolean(await findCategoryByDisplayName(page.request, updatedCategoryName)), {
          timeout: 15000,
        })
        .toBeFalsy();
      createdCategoryId = null;

      await page.goto("/stock");
      await expect(page.getByRole("button", { name: updatedCategoryName })).toHaveCount(0);
    } finally {
      if (createdCategoryId) {
        const existingCategory = await findCategoryByDisplayName(page.request, updatedCategoryName);
        if (existingCategory?.id === createdCategoryId) {
          await deleteCategory(page.request, createdCategoryId);
        }
      }
    }
  });

  test("manager tablet can create and update categories but cannot delete", async ({ page }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width: 820, height: 1180 });

    await loginToUi(page, credentials.manager.username, credentials.manager.password);

    const categoryName = `Manager Category ${uniq("stock")}`.slice(0, 90);
    const updatedCategoryName = `${categoryName} Edit`.slice(0, 95);
    let createdCategoryId: string | null = null;

    try {
      await page.goto("/stock/category/manage/add");
      await expect(page.getByTestId("stock-category-manage-page")).toBeVisible();
      await page.getByTestId("stock-category-display-name-input").fill(categoryName);
      await page.getByTestId("stock-category-submit").click();

      await expect(page).toHaveURL(/\/stock\/category$/);
      createdCategoryId = (await waitForCategoryByDisplayName(page.request, categoryName)).id;

      await page.goto(`/stock/category/manage/edit/${createdCategoryId}`);
      await expect(page.getByTestId("stock-category-manage-page")).toBeVisible();
      await expect(page.getByTestId("stock-category-delete")).toHaveCount(0);
      await page.getByTestId("stock-category-display-name-input").fill(updatedCategoryName);
      await page.getByTestId("stock-category-submit").click();

      await expect(page).toHaveURL(/\/stock\/category$/);
      createdCategoryId = (await waitForCategoryByDisplayName(page.request, updatedCategoryName)).id;

      await page.goto("/stock/category");
      await expect(page.getByTestId("stock-category-add")).toBeVisible();
      await searchInside("stock-category-search", page, updatedCategoryName);
      await expect(page.getByText(updatedCategoryName)).toBeVisible();
    } finally {
      if (createdCategoryId) {
        await login(page.request, credentials.admin.username, credentials.admin.password);
        await deleteCategory(page.request, createdCategoryId);
      }
    }
  });

  test("employee mobile can view categories but cannot open category manage pages", async ({ page }) => {
    test.setTimeout(90000);
    await page.setViewportSize({ width: 390, height: 844 });

    await loginToUi(page, credentials.employee.username, credentials.employee.password);

    await page.goto("/stock/category");
    await expect(page.getByTestId("stock-category-page")).toBeVisible();
    await expect(page.getByTestId("stock-category-search")).toBeVisible();
    await expect(page.getByTestId("stock-category-add")).toHaveCount(0);

    await page.goto("/stock/category/manage/add");
    await expect(page.getByTestId("access-guard-fallback")).toBeVisible();
  });
});
