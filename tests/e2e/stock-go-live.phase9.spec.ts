import { expect, request as playwrightRequest, test, type APIRequestContext } from "@playwright/test";
import { getCsrfToken, login, readJson, unwrapData, unwrapList } from "./helpers.api-auth";

type Ingredient = { id: string; display_name?: string; is_active?: boolean };
type StockOrder = {
  id: string;
  status: string;
  ordersItems?: Array<{
    ingredient_id: string;
    quantity_ordered: number;
    ordersDetail?: {
      actual_quantity?: number;
      is_purchased?: boolean;
      purchased_by_id?: string;
    };
  }>;
};

async function createOrder(
  context: APIRequestContext,
  orderedById: string,
  csrfToken: string,
  items: Array<{ ingredient_id: string; quantity_ordered: number }>,
  remark: string
): Promise<string> {
  const response = await context.post("/api/stock/orders", {
    headers: { "X-CSRF-Token": csrfToken },
    data: {
      ordered_by_id: orderedById,
      items,
      remark,
    },
  });
  expect(response.ok()).toBeTruthy();
  const payload = unwrapData<{ id: string }>(await readJson(response));
  expect(typeof payload.id).toBe("string");
  return payload.id;
}

async function purchaseOrder(
  context: APIRequestContext,
  orderId: string,
  csrfToken: string,
  purchasedById: string,
  items: Array<{ ingredient_id: string; actual_quantity: number; is_purchased: boolean }>
) {
  return context.post(`/api/stock/orders/${orderId}/purchase`, {
    headers: { "X-CSRF-Token": csrfToken },
    data: {
      purchased_by_id: purchasedById,
      items,
    },
  });
}

async function getOrder(context: APIRequestContext, orderId: string): Promise<StockOrder> {
  const response = await context.get(`/api/stock/orders/${orderId}`);
  expect(response.ok()).toBeTruthy();
  return unwrapData<StockOrder>(await readJson(response));
}

async function ensureIngredients(context: APIRequestContext, csrfToken: string): Promise<Ingredient[]> {
  const fetchIngredients = async (): Promise<Ingredient[]> => {
    const response = await context.get("/api/stock/ingredients?page=1&limit=50&status=active");
    expect(response.ok()).toBeTruthy();
    const payload = await readJson(response);
    return unwrapList<Ingredient>(payload).filter((item) => item?.id);
  };

  let list = await fetchIngredients();
  if (list.length >= 2) return list;

  const unitResp = await context.get("/api/stock/ingredientsUnit/getAll?page=1&limit=20&status=active");
  expect(unitResp.ok()).toBeTruthy();
  const unitsPayload = await readJson(unitResp);
  const units = unwrapList<{ id: string }>(unitsPayload).filter((unit) => unit?.id);
  expect(units.length).toBeGreaterThan(0);
  const unitId = units[0].id;

  const needed = 2 - list.length;
  for (let i = 0; i < needed; i += 1) {
    const suffix = `${Date.now()}-${i}`;
    const createResp = await context.post("/api/stock/ingredients/create", {
      headers: { "X-CSRF-Token": csrfToken },
      data: {
        ingredient_name: `e2e_stock_seed_${suffix}`,
        display_name: `E2E Stock Seed ${suffix}`,
        description: "seed for stock phase9 e2e",
        unit_id: unitId,
        is_active: true,
      },
    });
    expect(createResp.ok()).toBeTruthy();
  }

  list = await fetchIngredients();
  expect(list.length).toBeGreaterThanOrEqual(2);
  return list;
}

test.describe("Stock E2E Phase 9", () => {
  test("ครบทุกเคสจริง: ซื้อครบ/ขาด/เกิน/ไม่ซื้อบางรายการ/พร้อมกันหลายผู้ใช้", async ({ baseURL }) => {
    test.setTimeout(180000);

    const usernameA = process.env.E2E_STOCK_USERNAME_A || process.env.E2E_USERNAME || "e2e_pos_admin";
    const passwordA = process.env.E2E_STOCK_PASSWORD_A || process.env.E2E_PASSWORD || "E2E_Pos_123!";
    const usernameB = process.env.E2E_STOCK_USERNAME_B || process.env.E2E_USERNAME_APPROVER || usernameA;
    const passwordB = process.env.E2E_STOCK_PASSWORD_B || process.env.E2E_PASSWORD_APPROVER || passwordA;

    const userAContext = await playwrightRequest.newContext({ baseURL });
    const userBContext = await playwrightRequest.newContext({ baseURL });

    try {
      const userA = await login(userAContext, usernameA, passwordA);
      const userB = await login(userBContext, usernameB, passwordB);

      const csrfA = await getCsrfToken(userAContext);
      const csrfB = await getCsrfToken(userBContext);

      const ingredients = await ensureIngredients(userAContext, csrfA);
      const itemA = ingredients[0];
      const itemB = ingredients[1];

      expect(itemA.id).toBeTruthy();
      expect(itemB.id).toBeTruthy();

      const fullOrderId = await createOrder(
        userAContext,
        userA.id,
        csrfA,
        [{ ingredient_id: itemA.id, quantity_ordered: 3 }],
        "phase9-full"
      );
      const fullPurchaseResp = await purchaseOrder(userAContext, fullOrderId, csrfA, userA.id, [
        { ingredient_id: itemA.id, actual_quantity: 3, is_purchased: true },
      ]);
      expect(fullPurchaseResp.ok()).toBeTruthy();
      const fullOrder = await getOrder(userAContext, fullOrderId);
      expect(fullOrder.status).toBe("completed");
      expect(fullOrder.ordersItems?.[0]?.ordersDetail?.actual_quantity).toBe(3);
      expect(fullOrder.ordersItems?.[0]?.ordersDetail?.is_purchased).toBe(true);

      const shortOrderId = await createOrder(
        userAContext,
        userA.id,
        csrfA,
        [{ ingredient_id: itemA.id, quantity_ordered: 3 }],
        "phase9-short"
      );
      const shortPurchaseResp = await purchaseOrder(userAContext, shortOrderId, csrfA, userA.id, [
        { ingredient_id: itemA.id, actual_quantity: 2, is_purchased: true },
      ]);
      expect(shortPurchaseResp.ok()).toBeTruthy();
      const shortOrder = await getOrder(userAContext, shortOrderId);
      expect(shortOrder.status).toBe("completed");
      expect(shortOrder.ordersItems?.[0]?.ordersDetail?.actual_quantity).toBe(2);

      const overOrderId = await createOrder(
        userAContext,
        userA.id,
        csrfA,
        [{ ingredient_id: itemA.id, quantity_ordered: 3 }],
        "phase9-over"
      );
      const overPurchaseResp = await purchaseOrder(userAContext, overOrderId, csrfA, userA.id, [
        { ingredient_id: itemA.id, actual_quantity: 5, is_purchased: true },
      ]);
      expect(overPurchaseResp.ok()).toBeTruthy();
      const overOrder = await getOrder(userAContext, overOrderId);
      expect(overOrder.status).toBe("completed");
      expect(overOrder.ordersItems?.[0]?.ordersDetail?.actual_quantity).toBe(5);

      const partialOrderId = await createOrder(
        userAContext,
        userA.id,
        csrfA,
        [
          { ingredient_id: itemA.id, quantity_ordered: 3 },
          { ingredient_id: itemB.id, quantity_ordered: 2 },
        ],
        "phase9-partial"
      );
      const partialPurchaseResp = await purchaseOrder(userAContext, partialOrderId, csrfA, userA.id, [
        { ingredient_id: itemA.id, actual_quantity: 3, is_purchased: true },
        { ingredient_id: itemB.id, actual_quantity: 0, is_purchased: false },
      ]);
      expect(partialPurchaseResp.ok()).toBeTruthy();
      const partialOrder = await getOrder(userAContext, partialOrderId);
      expect(partialOrder.status).toBe("completed");
      const partialItemA = partialOrder.ordersItems?.find((item) => item.ingredient_id === itemA.id);
      const partialItemB = partialOrder.ordersItems?.find((item) => item.ingredient_id === itemB.id);
      expect(partialItemA?.ordersDetail?.actual_quantity).toBe(3);
      expect(partialItemA?.ordersDetail?.is_purchased).toBe(true);
      expect(partialItemB?.ordersDetail?.actual_quantity).toBe(0);
      expect(partialItemB?.ordersDetail?.is_purchased).toBe(false);

      const concurrentOrderId = await createOrder(
        userAContext,
        userA.id,
        csrfA,
        [{ ingredient_id: itemA.id, quantity_ordered: 10 }],
        "phase9-concurrent"
      );

      const updateA = userAContext.put(`/api/stock/orders/${concurrentOrderId}`, {
        headers: { "X-CSRF-Token": csrfA },
        data: { items: [{ ingredient_id: itemA.id, quantity_ordered: 11 }] },
      });
      const updateB = userBContext.put(`/api/stock/orders/${concurrentOrderId}`, {
        headers: { "X-CSRF-Token": csrfB },
        data: { items: [{ ingredient_id: itemA.id, quantity_ordered: 12 }] },
      });

      const [updateAResp, updateBResp] = await Promise.all([updateA, updateB]);
      expect([200, 409].includes(updateAResp.status())).toBeTruthy();
      expect([200, 409].includes(updateBResp.status())).toBeTruthy();

      const beforePurchase = await getOrder(userAContext, concurrentOrderId);
      expect(beforePurchase.status).toBe("pending");
      const finalRequiredQty = beforePurchase.ordersItems?.[0]?.quantity_ordered || 10;

      const purchaseA = purchaseOrder(userAContext, concurrentOrderId, csrfA, userA.id, [
        { ingredient_id: itemA.id, actual_quantity: finalRequiredQty, is_purchased: true },
      ]);
      const purchaseB = purchaseOrder(userBContext, concurrentOrderId, csrfB, userB.id, [
        { ingredient_id: itemA.id, actual_quantity: finalRequiredQty + 1, is_purchased: true },
      ]);

      const [purchaseAResp, purchaseBResp] = await Promise.all([purchaseA, purchaseB]);
      const statusA = purchaseAResp.status();
      const statusB = purchaseBResp.status();
      const successCount = Number(statusA === 200) + Number(statusB === 200);
      const failCount = Number(statusA !== 200) + Number(statusB !== 200);

      expect(successCount).toBe(1);
      expect(failCount).toBe(1);

      const afterConcurrentPurchase = await getOrder(userAContext, concurrentOrderId);
      expect(afterConcurrentPurchase.status).toBe("completed");
      expect(afterConcurrentPurchase.ordersItems?.[0]?.ordersDetail?.is_purchased).toBe(true);
    } finally {
      await Promise.all([userAContext.dispose(), userBContext.dispose()]);
    }
  });
});
