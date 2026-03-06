
import fs from "node:fs/promises";
import path from "node:path";
import { test, expect, devices, request as playwrightRequest, type APIRequestContext, type APIResponse, type BrowserContext, type Page } from "@playwright/test";

type J = Record<string, any>;
type CaseResult = { id: string; title: string; status: "PASS" | "FAIL"; ms: number; err?: string; shot?: string };

const n = (v: any) => String(v ?? "").trim().toLowerCase();
const num = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const d = (p: any): any => (p && typeof p === "object" && "data" in p ? (p as J).data : p);
const l = (p: any): any[] => (Array.isArray(p) ? p : Array.isArray(p?.data) ? p.data : Array.isArray(p?.data?.data) ? p.data.data : []);
const items = (o: J) => (Array.isArray(o?.items) ? o.items : []);
const isCancelled = (s: any) => n(s) === "cancelled";
const isWaiting = (s: any) => n(s) === "waitingforpayment";
const isPaid = (s: any) => ["paid", "completed"].includes(n(s));
const isDeliveryMethod = (m: J) => {
  const a = n(m?.payment_method_name);
  const b = n(m?.display_name);
  return a === "delivery" || b === "delivery" || b.includes("เดลิเวอรี่");
};
const isCash = (m: J) => n(m?.payment_method_name).includes("cash") || n(m?.display_name).includes("เงินสด");

async function ok(res: APIResponse, label: string) {
  if (res.ok()) return res.json().catch(() => ({}));
  const txt = await res.text().catch(() => "");
  throw new Error(`${label} ${res.status()} ${txt.slice(0, 400)}`);
}

async function csrf(api: APIRequestContext) {
  const p: any = await ok(await api.get("/api/csrf"), "csrf");
  const t = p?.csrfToken ?? p?.data?.csrfToken;
  if (!t) throw new Error("missing csrf token");
  return String(t);
}

async function login(api: APIRequestContext, user: string, pass: string) {
  const token = await csrf(api);
  await ok(
    await api.post("/api/auth/login", { headers: { "X-CSRF-Token": token }, data: { username: user, password: pass } }),
    "login"
  );
  await ok(await api.get("/api/auth/me"), "me");
}

async function getOrder(api: APIRequestContext, id: string) {
  return d(await ok(await api.get(`/api/pos/orders/${id}`), `order ${id}`)) as J;
}

async function uiSession(page: Page, user: string, pass: string) {
  await page.goto("/pos", { waitUntil: "domcontentloaded" });
  if (!page.url().includes("/login")) return;
  await page.locator('input[autocomplete="username"]').fill(user);
  await page.locator('input[autocomplete="current-password"]').fill(pass);
  await page.locator('button[type="submit"]').click();
  await page.waitForLoadState("domcontentloaded");
  if (page.url().includes("/login")) throw new Error("ui login failed");
}

async function moveToWaiting(page: Page, id: string, delivery: boolean) {
  await page.goto(`/pos/orders/${id}`, { waitUntil: "domcontentloaded" });
  const moveName = delivery ? "ไปขั้นตอนส่งมอบเดลิเวอรี่" : "ไปขั้นตอนชำระเงิน";
  await page.getByRole("button", { name: moveName }).first().click();
  const confirm = delivery ? /ไปหน้าส่งมอบ|ยืนยัน/ : /ไปหน้าชำระเงิน|ยืนยัน/;
  await page.locator(".ant-modal-root").last().getByRole("button", { name: confirm }).click();
  await expect(page).toHaveURL(new RegExp(delivery ? `/pos/items/delivery/${id}` : `/pos/items/payment/${id}`), { timeout: 45000 });
}
async function pay(page: Page, id: string, method: J) {
  const label = String(method?.display_name || method?.payment_method_name || "");
  const card = page.locator(".payment-method-card").filter({ hasText: label }).first();
  if (await card.count()) await card.click();
  else await page.locator(".payment-method-card").first().click();

  if (isCash(method)) {
    const exact = page.getByRole("button", { name: /พอดี/ }).first();
    if (await exact.count()) await exact.click();
  }

  await page.getByRole("button", { name: /ยืนยันการชำระเงิน/ }).first().click();
  await page.locator(".ant-modal-root").last().getByRole("button", { name: /ยืนยัน$/ }).click();
  await expect(page).toHaveURL(new RegExp(`/pos/dashboard/${id}`), { timeout: 60000 });
}

async function handover(page: Page, id: string) {
  await page.getByRole("button", { name: "ส่งมอบสินค้าให้ไรเดอร์" }).first().click();
  await page.locator(".ant-modal-root").last().getByRole("button", { name: /ยืนยันส่งมอบ/ }).click();
  await expect(page).toHaveURL(new RegExp(`/pos/dashboard/${id}`), { timeout: 60000 });
}

test.describe("UAT Production POS new flow", () => {
  test("TC-01..TC-10", async ({ baseURL, browser }, testInfo) => {
    test.setTimeout(15 * 60 * 1000);

    const user = process.env.UAT_ADMIN_USERNAME || process.env.E2E_ADMIN_USERNAME || "admin";
    const pass = process.env.UAT_ADMIN_PASSWORD || process.env.E2E_ADMIN_PASSWORD;
    if (!pass) throw new Error("Set UAT_ADMIN_PASSWORD or E2E_ADMIN_PASSWORD");
    const origin = baseURL || process.env.UAT_BASE_URL || "https://system.pos-hub.shop";

    const api = await playwrightRequest.newContext({ baseURL: origin, ignoreHTTPSErrors: true });
    let deskCtx: BrowserContext | null = null;
    let mobCtx: BrowserContext | null = null;
    let desk: Page | null = null;
    let mob: Page | null = null;
    let evidence: Page | null = null;
    let token = "";
    let dineId = "";
    const results: CaseResult[] = [];

    const runCase = async (id: string, title: string, fn: () => Promise<void>) => {
      const start = Date.now();
      try {
        await fn();
        results.push({ id, title, status: "PASS", ms: Date.now() - start });
      } catch (e: any) {
        let shot: string | undefined;
        if (evidence && !evidence.isClosed()) {
          const dir = path.resolve(process.cwd(), "test-results-uat", "screenshots");
          await fs.mkdir(dir, { recursive: true });
          const fp = path.join(dir, `${id}-${Date.now()}.png`);
          await evidence.screenshot({ path: fp, fullPage: true });
          shot = path.relative(process.cwd(), fp).replaceAll("\\", "/");
        }
        results.push({ id, title, status: "FAIL", ms: Date.now() - start, err: String(e?.message || e), shot });
      }
    };

    try {
      await login(api, user, pass);
      token = await csrf(api);

      const [productsP, methodsP, tablesP, deliveryP] = await Promise.all([
        ok(await api.get("/api/pos/products?page=1&limit=200"), "products"),
        ok(await api.get("/api/pos/paymentMethod?page=1&limit=200"), "methods"),
        ok(await api.get("/api/pos/tables?page=1&limit=200"), "tables"),
        ok(await api.get("/api/pos/delivery?page=1&limit=200"), "delivery"),
      ]);

      const product = l(productsP).find((x: J) => x?.id && x?.is_active !== false);
      const method = l(methodsP).find((x: J) => x?.is_active !== false && !isDeliveryMethod(x));
      const methodDelivery = l(methodsP).find((x: J) => x?.is_active !== false && isDeliveryMethod(x));
      const table = l(tablesP).find((x: J) => n(x?.status) === "available") || l(tablesP).find((x: J) => x?.id && !x?.active_order_id);
      const delivery = l(deliveryP).find((x: J) => x?.id && x?.is_active !== false);
      if (!product || !method || !methodDelivery || !table || !delivery) throw new Error("master data not ready");

      const state = await api.storageState();
      deskCtx = await browser.newContext({ storageState: state });
      mobCtx = await browser.newContext({ storageState: state, ...devices["iPhone 13"] });
      desk = await deskCtx.newPage();
      mob = await mobCtx.newPage();
      evidence = desk;
      await uiSession(desk, user, pass);
      await uiSession(mob, user, pass);

      const mkOrder = async (type: "DineIn" | "TakeAway" | "Delivery", lines = 1) => {
        const unit = type === "Delivery" ? num(product.price_delivery ?? product.price) : num(product.price);
        const list = Array.from({ length: lines }, (_, i) => ({
          product_id: String(product.id), quantity: 1, price: unit, total_price: unit, discount_amount: 0,
          notes: `UAT ${type} ${i + 1}`, status: "Cooking", details: []
        }));
        const total = unit * lines;
        const payload = {
          order_no: `UAT-${type}-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          order_type: type,
          sub_total: total, discount_amount: 0, vat: 0, total_amount: total, received_amount: 0, change_amount: 0,
          status: "Pending", discount_id: null, payment_method_id: null,
          table_id: type === "DineIn" ? String(table.id) : null,
          delivery_id: type === "Delivery" ? String(delivery.id) : null,
          delivery_code: type === "Delivery" ? `UAT-${Date.now()}` : null,
          created_by_id: null,
          items: list,
        };
        const created = d(await ok(await api.post("/api/pos/orders", { headers: { "X-CSRF-Token": token }, data: payload }), `create ${type}`));
        return String(created.id);
      };

      await runCase("TC-01", "Open Shift Guard", async () => {
        evidence = desk;
        const cur = await api.get("/api/pos/shifts/current");
        if (cur.status() === 404) {
          const opened = await api.post("/api/pos/shifts/open", { headers: { "X-CSRF-Token": token }, data: { start_amount: 0 } });
          if (![200, 201, 400, 409].includes(opened.status())) await ok(opened, "open shift");
        } else {
          await ok(cur, "current shift");
        }
        await desk!.goto("/pos/channels", { waitUntil: "domcontentloaded" });
        await expect(desk!).not.toHaveURL(/\/pos\/shift/);
      });

      await runCase("TC-02", "Create Dine-In Order", async () => {
        evidence = desk;
        dineId = await mkOrder("DineIn", 2);
        const o = await getOrder(api, dineId);
        expect(o.order_type).toBe("DineIn");
        await desk!.goto(`/pos/orders/${dineId}`, { waitUntil: "domcontentloaded" });
        await expect(desk!).toHaveURL(new RegExp(`/pos/orders/${dineId}`));
      });

      await runCase("TC-03", "Order Detail Management (No Served)", async () => {
        evidence = desk;
        await ok(await api.post(`/api/pos/orders/${dineId}/items`, {
          headers: { "X-CSRF-Token": token },
          data: { product_id: String(product.id), quantity: 1, price: num(product.price), total_price: num(product.price), discount_amount: 0, notes: "UAT add", status: "Cooking", details: [] }
        }), "add item");

        const a1 = await getOrder(api, dineId);
        const active = items(a1).filter((x: J) => !isCancelled(x.status));
        expect(active.length).toBeGreaterThanOrEqual(2);

        const editId = String(active[0].id);
        const qty = Math.max(1, num(active[0].quantity) + 1);
        await ok(await api.put(`/api/pos/orders/items/${editId}`, {
          headers: { "X-CSRF-Token": token }, data: { quantity: qty, notes: "UAT edit", details: [] }
        }), "edit item");

        const a2 = await getOrder(api, dineId);
        const cancelTarget = items(a2).find((x: J) => String(x.id) !== editId && !isCancelled(x.status));
        if (!cancelTarget) throw new Error("no cancel target");
        await ok(await api.patch(`/api/pos/orders/items/${cancelTarget.id}/status`, {
          headers: { "X-CSRF-Token": token }, data: { status: "Cancelled" }
        }), "cancel item");

        const a3 = await getOrder(api, dineId);
        const delTarget = items(a3).find((x: J) => String(x.id) !== editId && !isCancelled(x.status));
        if (!delTarget) throw new Error("no delete target");
        await ok(await api.delete(`/api/pos/orders/items/${delTarget.id}`, { headers: { "X-CSRF-Token": token } }), "delete item");

        await desk!.goto(`/pos/orders/${dineId}`, { waitUntil: "domcontentloaded" });
        await expect(desk!.getByRole("button", { name: "เพิ่ม" }).first()).toBeVisible();
        await expect(desk!.getByRole("button", { name: /เสิร์ฟ|ทำแล้ว/i })).toHaveCount(0);

        evidence = mob;
        await mob!.goto(`/pos/orders/${dineId}`, { waitUntil: "domcontentloaded" });
        await expect(mob!.getByRole("button", { name: /เสิร์ฟ|ทำแล้ว/i })).toHaveCount(0);
        await expect(mob!.getByRole("button", { name: "แก้ไข" }).first()).toBeVisible();
        await expect(mob!.getByRole("button", { name: "ลบ" }).first()).toBeVisible();
        evidence = desk;
      });

      await runCase("TC-04", "Move to WaitingForPayment Directly (Dine-In)", async () => {
        evidence = desk;
        const before = await getOrder(api, dineId);
        const active = items(before).filter((x: J) => !isCancelled(x.status));
        expect(active.length).toBeGreaterThan(0);
        expect(active.some((x: J) => n(x.status) !== "served")).toBeTruthy();
        await moveToWaiting(desk!, dineId, false);
        const after = await getOrder(api, dineId);
        expect(isWaiting(after.status)).toBeTruthy();
      });

      await runCase("TC-05", "Payment Completion (Dine-In)", async () => {
        evidence = desk;
        await pay(desk!, dineId, method);
        const after = await getOrder(api, dineId);
        expect(isWaiting(after.status)).toBeFalsy();
        expect(isPaid(after.status)).toBeTruthy();
        const waiting = l(await ok(await api.get("/api/pos/orders/summary?page=1&limit=200&status=WaitingForPayment"), "waiting summary"));
        expect(waiting.some((x: J) => String(x.id) === dineId)).toBeFalsy();
      });

      await runCase("TC-06", "TakeAway Direct Flow", async () => {
        evidence = desk;
        const id = await mkOrder("TakeAway", 2);
        await moveToWaiting(desk!, id, false);
        await pay(desk!, id, method);
        const after = await getOrder(api, id);
        expect(isPaid(after.status)).toBeTruthy();
      });

      await runCase("TC-07", "Delivery Direct Flow", async () => {
        evidence = desk;
        const id = await mkOrder("Delivery", 1);
        await moveToWaiting(desk!, id, true);
        await handover(desk!, id);
        const after = await getOrder(api, id);
        expect(isPaid(after.status)).toBeTruthy();
      });

      await runCase("TC-08", "Guarded Route Consistency", async () => {
        evidence = desk;
        const id = await mkOrder("TakeAway", 1);
        await ok(await api.put(`/api/pos/orders/${id}`, { headers: { "X-CSRF-Token": token }, data: { status: "WaitingForPayment" } }), "set waiting");
        await desk!.goto(`/pos/orders/${id}`, { waitUntil: "domcontentloaded" });
        await expect(desk!).toHaveURL(new RegExp(`/pos/items/payment/${id}`));
        const o = await getOrder(api, id);
        await ok(await api.post("/api/pos/payments", {
          headers: { "X-CSRF-Token": token },
          data: { order_id: id, payment_method_id: String(method.id), amount: num(o.total_amount), amount_received: num(o.total_amount), change_amount: 0, status: "Success" }
        }), "close waiting");
      });

      await runCase("TC-09", "Empty/Invalid Transition Protection", async () => {
        evidence = desk;
        const id = await mkOrder("TakeAway", 1);
        const o = await getOrder(api, id);
        const alive = items(o).filter((x: J) => !isCancelled(x.status));
        await Promise.all(
          alive.map(async (x: J) =>
            ok(
              await api.patch(`/api/pos/orders/items/${x.id}/status`, {
                headers: { "X-CSRF-Token": token },
                data: { status: "Cancelled" },
              }),
              "cancel all"
            )
          )
        );
        await desk!.goto(`/pos/orders/${id}`, { waitUntil: "domcontentloaded" });
        await expect(desk!.getByRole("button", { name: "ไปขั้นตอนชำระเงิน" }).first()).toBeDisabled();
        await expect(desk!.getByRole("button", { name: "ต้องมีสินค้าอย่างน้อย 1 รายการเพื่อไปหน้าชำระเงิน" }).first()).toBeVisible();
      });

      await runCase("TC-10", "Regression Quick Check", async () => {
        evidence = desk;
        const id = await mkOrder("TakeAway", 1);
        await desk!.goto(`/pos/orders/${id}`, { waitUntil: "domcontentloaded" });

        const addQ = desk!.getByRole("button", { name: /เพิ่มเข้าคิว/ }).first();
        const remQ = desk!.getByRole("button", { name: /ลบออกจากคิว/ }).first();
        if (await addQ.count()) {
          await addQ.click();
          await expect(remQ).toBeVisible({ timeout: 15000 });
          await remQ.click();
          await expect(addQ).toBeVisible({ timeout: 15000 });
        } else if (await remQ.count()) {
          await remQ.click();
          await expect(addQ).toBeVisible({ timeout: 15000 });
        } else throw new Error("queue buttons missing");

        await desk!.getByRole("button", { name: "ยกเลิกออเดอร์" }).first().click();
        await desk!.locator(".ant-modal-root").last().getByRole("button", { name: /ยืนยันการยกเลิก/ }).click();
        await expect(desk!).toHaveURL(/\/pos\/channels\/takeaway/, { timeout: 30000 });
        const after = await getOrder(api, id);
        expect(isCancelled(after.status)).toBeTruthy();
      });
    } finally {
      const outDir = path.resolve(process.cwd(), "test-results-uat");
      await fs.mkdir(outDir, { recursive: true });
      const report = path.join(outDir, "UAT_POS_NEW_FLOW_PROD_REPORT.md");
      const passCount = results.filter((r) => r.status === "PASS").length;
      const failCount = results.length - passCount;
      const lines = [
        "# UAT Production Report: POS New Flow",
        "",
        `- Base URL: \`${origin}\``,
        `- Generated at: ${new Date().toISOString()}`,
        `- Total: ${results.length}`,
        `- Pass: ${passCount}`,
        `- Fail: ${failCount}`,
        "",
        "| Case | Title | Result | Duration(ms) | Error | Screenshot |",
        "| --- | --- | --- | ---: | --- | --- |",
        ...results.map((r) => `| ${r.id} | ${r.title} | ${r.status} | ${r.ms} | ${r.err ?? "-"} | ${r.shot ?? "-"} |`),
        "",
      ];
      await fs.writeFile(report, `${lines.join("\n")}\n`, "utf8");

      const mandatory = new Set(["TC-01", "TC-02", "TC-03", "TC-04", "TC-05", "TC-06", "TC-07", "TC-08"]);
      const failedMandatory = results.filter((r) => mandatory.has(r.id) && r.status === "FAIL");
      const summary = results.map((r) => `${r.id}:${r.status}`).join(", ");
      expect(failedMandatory, `mandatory failed: ${summary}`).toHaveLength(0);

      await Promise.allSettled([deskCtx?.close(), mobCtx?.close(), api.dispose()]);
    }
  });
});
