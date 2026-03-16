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

const credentials = {
  admin: {
    username: process.env.E2E_ADMIN_USERNAME || "admin",
    password: process.env.E2E_ADMIN_PASSWORD || "Admin123456!",
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

async function createIngredient(
  context: APIRequestContext,
  csrfToken: string,
  payload: {
    display_name: string;
    unit_id: string;
  }
): Promise<Ingredient> {
  const response = await context.post("/api/stock/ingredients/create", {
    headers: { "X-CSRF-Token": csrfToken },
    data: {
      ...payload,
      description: "stock catalog realtime test",
      is_active: true,
    },
  });
  expect(response.ok()).toBeTruthy();
  return unwrapData<Ingredient>(await readJson(response));
}

async function deleteIngredient(context: APIRequestContext, ingredientId: string): Promise<void> {
  const csrfToken = await getCsrfToken(context);
  const response = await context.delete(`/api/stock/ingredients/${ingredientId}`, {
    headers: { "X-CSRF-Token": csrfToken },
  });
  expect(response.ok()).toBeTruthy();
}

test.describe("Stock catalog page", () => {
  test("admin catalog refreshes automatically when a matching ingredient is created", async ({ page }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width: 1440, height: 1100 });

    await loginToUi(page, credentials.admin.username, credentials.admin.password);
    const units = await fetchActiveUnits(page.request);
    expect(units.length).toBeGreaterThan(0);

    const displayName = `Realtime Catalog ${uniq("ingredient")}`.slice(0, 90);
    let createdIngredientId: string | null = null;

    try {
      await page.goto("/stock");
      await expect(page.getByTestId("stock-catalog-page")).toBeVisible();

      await searchInside("stock-catalog-search", page, displayName);

      const csrfToken = await getCsrfToken(page.request);
      const ingredient = await createIngredient(page.request, csrfToken, {
        display_name: displayName,
        unit_id: units[0].id,
      });
      createdIngredientId = ingredient.id;

      await expect(page.getByTestId(`stock-catalog-add-${ingredient.id}`)).toBeVisible({ timeout: 15000 });
    } finally {
      if (createdIngredientId) {
        await deleteIngredient(page.request, createdIngredientId);
      }
    }
  });
});
