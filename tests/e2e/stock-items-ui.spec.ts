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
  remark?: string;
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

function getOrderCode(orderId: string) {
  return `#${orderId.slice(0, 8).toUpperCase()}`;
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

async function cancelOrder(context: APIRequestContext, orderId: string): Promise<void> {
  const csrfToken = await getCsrfToken(context);
  const response = await context.put(`/api/stock/orders/${orderId}/status`, {
    headers: { "X-CSRF-Token": csrfToken },
    data: { status: "cancelled" },
  });
  expect(response.ok()).toBeTruthy();
}

test.describe("Stock items page", () => {
  test("admin can edit and cancel a pending stock order from the queue", async ({ page }) => {
    test.setTimeout(180000);
    await page.setViewportSize({ width: 1440, height: 1100 });

    await loginToUi(page, credentials.admin.username, credentials.admin.password);
    const ingredients = await fetchActiveIngredients(page.request);
    expect(ingredients.length).toBeGreaterThan(0);

    const remark = `items-ui-${uniq("order")}`;
    const csrfToken = await getCsrfToken(page.request);
    const createdOrder = await createOrder(page.request, csrfToken, {
      items: [{ ingredient_id: ingredients[0].id, quantity_ordered: 1 }],
      remark,
    });

    try {
      await page.goto("/stock/items");
      await expect(page.getByTestId("stock-orders-page")).toBeVisible();

      await searchInside("stock-orders-search", page, remark);
      await expect(page.getByTestId(`stock-order-edit-${createdOrder.id}`)).toBeVisible({ timeout: 15000 });
      await page.getByTestId(`stock-order-edit-${createdOrder.id}`).click();

      const editDialog = page.getByRole("dialog", { name: new RegExp(getOrderCode(createdOrder.id)) });
      await expect(editDialog).toBeVisible();
      const quantityControl = editDialog.getByRole("spinbutton").first();
      await quantityControl.fill("3");
      await page.getByTestId("stock-order-edit-save").click();

      await expect(editDialog).toBeHidden();
      await expect
        .poll(
          async () => (await getOrder(page.request, createdOrder.id)).ordersItems?.find((item) => item.ingredient_id === ingredients[0].id)?.quantity_ordered,
          { timeout: 15000 }
        )
        .toBe(3);

      await searchInside("stock-orders-search", page, remark);
      await expect(page.getByTestId(`stock-order-cancel-${createdOrder.id}`)).toBeVisible();
      await page.getByTestId(`stock-order-cancel-${createdOrder.id}`).click();
      await page.locator(".ant-modal-root .ant-btn-dangerous").last().click();

      await expect
        .poll(async () => (await getOrder(page.request, createdOrder.id)).status, { timeout: 15000 })
        .toBe("cancelled");
      await expect(page.getByTestId(`stock-order-cancel-${createdOrder.id}`)).toHaveCount(0);
    } finally {
      const latestOrder = await getOrder(page.request, createdOrder.id);
      if (latestOrder.status === "pending") {
        await cancelOrder(page.request, createdOrder.id);
      }
    }
  });
});
