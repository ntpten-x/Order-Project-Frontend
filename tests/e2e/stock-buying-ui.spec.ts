import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { getCsrfToken, login, readJson, unwrapData, unwrapList } from "./helpers.api-auth";

type Ingredient = {
  id: string;
  display_name: string;
  is_active: boolean;
};

type StockOrder = {
  id: string;
  status: string;
  ordersItems?: Array<{
    ingredient_id: string;
    quantity_ordered: number;
  }>;
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

async function fetchActiveIngredients(context: APIRequestContext): Promise<Ingredient[]> {
  const response = await context.get("/api/stock/ingredients?page=1&limit=100&status=active&sort_created=new");
  expect(response.ok()).toBeTruthy();
  return unwrapList<Ingredient>(await readJson(response)).filter((item) => item?.id && item.is_active);
}

async function createOrder(
  context: APIRequestContext,
  csrfToken: string,
  payload: {
    items: Array<{ ingredient_id: string; quantity_ordered: number }>;
    remark: string;
  }
): Promise<StockOrder> {
  const response = await context.post("/api/stock/orders", {
    headers: { "X-CSRF-Token": csrfToken },
    data: payload,
  });
  expect(response.ok()).toBeTruthy();
  return unwrapData<StockOrder>(await readJson(response));
}

async function getOrder(context: APIRequestContext, orderId: string): Promise<StockOrder> {
  const response = await context.get(`/api/stock/orders/${orderId}`);
  expect(response.ok()).toBeTruthy();
  return unwrapData<StockOrder>(await readJson(response));
}

async function updateOrderItems(
  context: APIRequestContext,
  orderId: string,
  items: Array<{ ingredient_id: string; quantity_ordered: number }>
): Promise<void> {
  const csrfToken = await getCsrfToken(context);
  const response = await context.put(`/api/stock/orders/${orderId}`, {
    headers: { "X-CSRF-Token": csrfToken },
    data: { items },
  });
  expect(response.ok()).toBeTruthy();
}

async function cancelOrder(context: APIRequestContext, orderId: string): Promise<void> {
  const csrfToken = await getCsrfToken(context);
  const response = await context.put(`/api/stock/orders/${orderId}/status`, {
    headers: { "X-CSRF-Token": csrfToken },
    data: { status: "cancelled" },
  });
  expect(response.ok()).toBeTruthy();
}

test.describe("Stock buying page", () => {
  test("admin keeps local draft while realtime refresh updates the order and can resync manually", async ({ page }) => {
    test.setTimeout(180000);
    await page.setViewportSize({ width: 1440, height: 1100 });

    await loginToUi(page, credentials.admin.username, credentials.admin.password);
    const ingredients = await fetchActiveIngredients(page.request);
    expect(ingredients.length).toBeGreaterThan(0);

    const ingredient = ingredients[0];
    const remark = `buying-ui-${uniq("order")}`;
    const csrfToken = await getCsrfToken(page.request);
    const createdOrder = await createOrder(page.request, csrfToken, {
      items: [{ ingredient_id: ingredient.id, quantity_ordered: 1 }],
      remark,
    });

    try {
      await page.goto(`/stock/buying?orderId=${createdOrder.id}`);
      await expect(page.getByTestId("stock-buying-page")).toBeVisible();

      const orderItem = page.getByTestId(`stock-buying-item-${ingredient.id}`);
      await expect(orderItem).toBeVisible({ timeout: 15000 });

      const quantityInput = orderItem.getByRole("spinbutton");
      await quantityInput.fill("7");
      await expect(quantityInput).toHaveValue("7");
      await expect(page.getByTestId("stock-buying-draft-warning")).toBeVisible();

      await updateOrderItems(page.request, createdOrder.id, [
        { ingredient_id: ingredient.id, quantity_ordered: 2 },
      ]);

      await expect
        .poll(
          async () =>
            (await getOrder(page.request, createdOrder.id)).ordersItems?.find(
              (item) => item.ingredient_id === ingredient.id
            )?.quantity_ordered,
          { timeout: 15000 }
        )
        .toBe(2);

      await expect(page.getByTestId("stock-buying-refresh-alert")).toBeVisible({ timeout: 15000 });
      await expect(quantityInput).toHaveValue("7");

      await page.getByTestId("stock-buying-refresh").click();
      await expect(quantityInput).toHaveValue("2");
      await expect(page.getByTestId("stock-buying-draft-warning")).toHaveCount(0);
    } finally {
      const latestOrder = await getOrder(page.request, createdOrder.id);
      if (latestOrder.status === "pending") {
        await cancelOrder(page.request, createdOrder.id);
      }
    }
  });
});
