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

async function confirmPurchase(
  context: APIRequestContext,
  orderId: string,
  payload: Array<{ ingredient_id: string; actual_quantity: number; is_purchased: boolean }>
): Promise<void> {
  const csrfToken = await getCsrfToken(context);
  const response = await context.post(`/api/stock/orders/${orderId}/purchase`, {
    headers: { "X-CSRF-Token": csrfToken },
    data: { items: payload },
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

async function getOrder(context: APIRequestContext, orderId: string): Promise<StockOrder | null> {
  const response = await context.get(`/api/stock/orders/${orderId}`);
  if (response.status() === 404) {
    return null;
  }
  expect(response.ok()).toBeTruthy();
  return unwrapData<StockOrder>(await readJson(response));
}

test.describe("Stock history page", () => {
  test("admin can view history details and delete a historical order", async ({ page }) => {
    test.setTimeout(180000);
    await page.setViewportSize({ width: 1440, height: 1100 });

    await loginToUi(page, credentials.admin.username, credentials.admin.password);
    const ingredients = await fetchActiveIngredients(page.request);
    expect(ingredients.length).toBeGreaterThan(0);

    const ingredient = ingredients[0];
    const csrfToken = await getCsrfToken(page.request);
    const completedOrder = await createOrder(page.request, csrfToken, {
      items: [{ ingredient_id: ingredient.id, quantity_ordered: 2 }],
      remark: `history-completed-${uniq("order")}`,
    });
    const cancelledOrder = await createOrder(page.request, csrfToken, {
      items: [{ ingredient_id: ingredient.id, quantity_ordered: 1 }],
      remark: `history-cancelled-${uniq("order")}`,
    });

    try {
      await confirmPurchase(page.request, completedOrder.id, [
        { ingredient_id: ingredient.id, actual_quantity: 2, is_purchased: true },
      ]);
      await cancelOrder(page.request, cancelledOrder.id);

      await page.goto("/stock/history");
      await expect(page.getByTestId("stock-history-page")).toBeVisible();

      await expect(page.getByTestId(`stock-history-view-${completedOrder.id}`)).toBeVisible({ timeout: 15000 });
      await page.getByTestId(`stock-history-view-${completedOrder.id}`).click();
      await expect(page.getByTestId("stock-order-detail-close")).toBeVisible();
      await expect(page.getByText(ingredient.display_name).first()).toBeVisible();
      await page.getByTestId("stock-order-detail-close").click();
      await expect(page.getByTestId("stock-order-detail-close")).toBeHidden();

      await expect(page.getByTestId(`stock-history-delete-${cancelledOrder.id}`)).toBeVisible();
      await page.getByTestId(`stock-history-delete-${cancelledOrder.id}`).click();
      await page.locator(".ant-modal-root .ant-btn-dangerous").last().click();

      await expect
        .poll(async () => await getOrder(page.request, cancelledOrder.id), { timeout: 15000 })
        .toBeNull();
      await expect(page.getByTestId(`stock-history-delete-${cancelledOrder.id}`)).toHaveCount(0);
    } finally {
      const latestCompleted = await getOrder(page.request, completedOrder.id);
      if (latestCompleted) {
        const cleanupToken = await getCsrfToken(page.request);
        const response = await page.request.delete(`/api/stock/orders/${completedOrder.id}`, {
          headers: { "X-CSRF-Token": cleanupToken },
        });
        expect(response.ok()).toBeTruthy();
      }

      const latestCancelled = await getOrder(page.request, cancelledOrder.id);
      if (latestCancelled?.status === "pending") {
        await cancelOrder(page.request, cancelledOrder.id);
      }
    }
  });
});
