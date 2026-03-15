import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { getCsrfToken, login, readJson, unwrapData, unwrapList } from "./helpers.api-auth";

type ProductRecord = {
    id: string;
    name?: string;
    display_name?: string;
    is_active?: boolean;
};

type PaymentMethodRecord = {
    id: string;
    is_active?: boolean;
};

type OrderRecord = {
    id: string;
    order_no: string;
    total_amount?: number;
};

type ServingBoardGroup = {
    id: string;
    order_id: string;
    order_no: string;
    items: Array<{ id: string; notes?: string | null; serving_status: string }>;
};

async function ensureAuthenticated(page: Page): Promise<void> {
    await expect
        .poll(async () => {
            const response = await page.request.get("/api/auth/me");
            return response.status();
        })
        .toBe(200);
}

async function ensureOpenShift(request: APIRequestContext, csrfToken: string) {
    const response = await request.post("/api/pos/shifts/open", {
        headers: { "X-CSRF-Token": csrfToken },
        data: { start_amount: 0 },
    });

    if (!response.ok() && response.status() !== 400 && response.status() !== 409) {
        throw new Error(`failed to open shift: ${response.status()}`);
    }
}

async function getActiveProduct(request: APIRequestContext): Promise<ProductRecord> {
    const response = await request.get("/api/pos/products?page=1&limit=20");
    expect(response.ok()).toBeTruthy();
    const products = unwrapList<ProductRecord>(await readJson(response));
    const product = products.find((item) => item?.is_active !== false);
    expect(product?.id).toBeTruthy();
    return product!;
}

async function getActivePaymentMethod(request: APIRequestContext): Promise<PaymentMethodRecord> {
    const response = await request.get("/api/pos/paymentMethod?page=1&limit=20");
    expect(response.ok()).toBeTruthy();
    const methods = unwrapList<PaymentMethodRecord>(await readJson(response));
    const method = methods.find((item) => item?.is_active !== false);
    expect(method?.id).toBeTruthy();
    return method!;
}

async function createOrder(
    request: APIRequestContext,
    csrfToken: string,
    productId: string,
    note: string
): Promise<OrderRecord> {
    const response = await request.post("/api/pos/orders", {
        headers: { "X-CSRF-Token": csrfToken },
        data: {
            order_type: "TakeAway",
            items: [{ product_id: productId, quantity: 1, notes: note }],
        },
    });

    expect(response.ok()).toBeTruthy();
    return unwrapData<OrderRecord>(await readJson(response));
}

async function addOrderItem(
    request: APIRequestContext,
    csrfToken: string,
    orderId: string,
    productId: string,
    note: string
) {
    const response = await request.post(`/api/pos/orders/${orderId}/items`, {
        headers: { "X-CSRF-Token": csrfToken },
        data: {
            product_id: productId,
            quantity: 1,
            notes: note,
        },
    });

    expect(response.ok()).toBeTruthy();
}

async function getServingBoard(request: APIRequestContext): Promise<ServingBoardGroup[]> {
    const response = await request.get("/api/pos/orders/serve-board");
    expect(response.ok()).toBeTruthy();
    return unwrapData<ServingBoardGroup[]>(await readJson(response));
}

async function getOrder(request: APIRequestContext, orderId: string): Promise<OrderRecord> {
    const response = await request.get(`/api/pos/orders/${orderId}`);
    expect(response.ok()).toBeTruthy();
    return unwrapData<OrderRecord>(await readJson(response));
}

async function payOrder(
    request: APIRequestContext,
    csrfToken: string,
    orderId: string,
    paymentMethodId: string,
    amount: number
) {
    const response = await request.post("/api/pos/payments", {
        headers: { "X-CSRF-Token": csrfToken },
        data: {
            order_id: orderId,
            payment_method_id: paymentMethodId,
            amount,
            amount_received: amount,
            status: "Success",
        },
    });

    expect(response.ok()).toBeTruthy();
}

test("serving board separates add rounds, serves items, and clears after payment", async ({ page }) => {
    test.setTimeout(180000);

    const username =
        process.env.E2E_USERNAME ||
        process.env.E2E_ADMIN_USERNAME ||
        "admin";
    const password =
        process.env.E2E_PASSWORD ||
        process.env.E2E_ADMIN_PASSWORD ||
        "Admin123456!";
    const request = page.request;

    await login(request, username, password);
    await ensureAuthenticated(page);

    const csrfToken = await getCsrfToken(request);
    await ensureOpenShift(request, csrfToken);

    const product = await getActiveProduct(request);
    const paymentMethod = await getActivePaymentMethod(request);
    const suffix = `${Date.now()}`;
    const noteRound1 = `E2E-SB-R1-${suffix}`;
    const noteRound2 = `E2E-SB-R2-${suffix}`;

    const createdOrder = await createOrder(request, csrfToken, product.id, noteRound1);
    expect(createdOrder.id).toBeTruthy();
    expect(createdOrder.order_no).toBeTruthy();

    await page.goto("/pos/list");
    await expect(page.getByTestId("serving-board-page")).toBeVisible();
    await expect(page.getByText("Serving Board")).toBeVisible();
    await expect(page.getByText(/^LIVE$/)).toBeVisible({ timeout: 30000 });

    let pendingColumn = page.getByTestId("serving-column-pending");

    let firstCard = pendingColumn.locator('[data-testid^="serving-card-"]').filter({
        hasText: noteRound1,
    });
    await expect(firstCard).toHaveCount(1);
    await expect(firstCard).toHaveAttribute("data-order-no", createdOrder.order_no);

    await addOrderItem(request, csrfToken, createdOrder.id, product.id, noteRound2);

    await expect
        .poll(async () => {
            const board = await getServingBoard(request);
            return board.filter((group) => group.order_id === createdOrder.id).length;
        })
        .toBe(2);

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("serving-board-page")).toBeVisible();

    pendingColumn = page.getByTestId("serving-column-pending");
    firstCard = pendingColumn.locator('[data-testid^="serving-card-"]').filter({
        hasText: noteRound1,
    });
    const secondCard = pendingColumn.locator('[data-testid^="serving-card-"]').filter({
        hasText: noteRound2,
    });

    await expect(firstCard).toHaveCount(1);
    await expect(secondCard).toHaveCount(1);
    await expect(firstCard).toHaveAttribute("data-order-no", createdOrder.order_no);
    await expect(secondCard).toHaveAttribute("data-order-no", createdOrder.order_no);
    await expect(firstCard).not.toContainText(noteRound2);
    await expect(secondCard).not.toContainText(noteRound1);

    await secondCard.getByRole("button", { name: "ได้รับแล้ว" }).click();
    await expect
        .poll(async () => {
            const board = await getServingBoard(request);
            return board.some((group) =>
                group.order_id === createdOrder.id &&
                group.items.some(
                    (item) =>
                        item.notes === noteRound2 &&
                        String(item.serving_status).toLowerCase() === "served"
                )
            );
        })
        .toBeTruthy();
    await expect(pendingColumn.getByText(noteRound2)).toHaveCount(0);

    await firstCard.getByRole("button", { name: "ได้รับทั้งหมด" }).click();
    await expect
        .poll(async () => {
            const board = await getServingBoard(request);
            return board.some((group) =>
                group.order_id === createdOrder.id &&
                group.items.some(
                    (item) =>
                        item.notes === noteRound1 &&
                        String(item.serving_status).toLowerCase() === "served"
                )
            );
        })
        .toBeTruthy();
    await expect(pendingColumn.getByText(noteRound1)).toHaveCount(0);

    const updatedOrder = await getOrder(request, createdOrder.id);
    const totalAmount = Number(updatedOrder.total_amount || 0);
    expect(totalAmount).toBeGreaterThan(0);

    await payOrder(request, csrfToken, createdOrder.id, paymentMethod.id, totalAmount);

    await expect
        .poll(async () => {
            const board = await getServingBoard(request);
            return board.some((group) => group.order_id === createdOrder.id);
        })
        .toBeFalsy();

    await expect(page.getByText(noteRound1)).toHaveCount(0);
    await expect(page.getByText(noteRound2)).toHaveCount(0);
});
