import { expect, test } from "@playwright/test";
import { getCsrfToken, login, readJson, unwrapData, unwrapList } from "./helpers.api-auth";

type JsonRecord = Record<string, unknown>;
const E2E_BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3001";

function uniq(prefix: string) {
  const now = Date.now().toString(16);
  const rand = Math.random().toString(16).slice(2, 8);
  return `${prefix}_${now}_${rand}`.slice(0, 20);
}

test.describe("Print settings", () => {
  test("admin sees print settings for the actively selected branch", async ({ page }) => {
    await login(page.request, "admin", "Admin123456!");
    const csrf = await getCsrfToken(page.request);

    const branchesRes = await page.request.get("/api/branches?page=1&limit=10");
    expect(branchesRes.ok()).toBeTruthy();
    const branchesPayload = await readJson(branchesRes);
    const branches = unwrapList<JsonRecord>(branchesPayload);
    expect(branches.length).toBeGreaterThan(0);

    let createdBranchId = "";
    let createdBranchName = "";
    let targetBranch = branches[1];

    if (!targetBranch) {
      const branchCode = uniq("psb").replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 12);
      createdBranchName = `Print Branch ${branchCode}`;
      const createBranchRes = await page.request.post("/api/branches", {
        headers: { "X-CSRF-Token": csrf },
        data: {
          branch_name: createdBranchName,
          branch_code: branchCode,
          is_active: true,
        },
      });
      expect([200, 201]).toContain(createBranchRes.status());
      targetBranch = unwrapData<JsonRecord>(await readJson(createBranchRes));
      createdBranchId = String(targetBranch.id || "");
    }

    const targetBranchId = String(targetBranch?.id || "");
    const targetBranchName = String(targetBranch?.branch_name || createdBranchName);
    expect(targetBranchId).toBeTruthy();

    try {
      const switchRes = await page.request.post("/api/auth/switch-branch", {
        headers: { "X-CSRF-Token": csrf },
        data: { branch_id: targetBranchId },
      });
      expect(switchRes.ok()).toBeTruthy();
      await page.context().addCookies([
        {
          name: "active_branch_id",
          value: targetBranchId,
          url: E2E_BASE_URL,
          httpOnly: true,
          sameSite: "Lax",
        },
      ]);

      await page.goto("/print-setting");
      await expect(page).toHaveURL(/\/print-setting$/);
      await expect(page.getByText("ตั้งค่าการพิมพ์")).toBeVisible();
      await expect(page.locator("span").filter({ hasText: targetBranchName }).first()).toBeVisible();
    } finally {
      await page.request.delete("/api/auth/active-branch");

      if (createdBranchId) {
        const cleanupCsrf = await getCsrfToken(page.request);
        await page.request.delete(`/api/branches/${createdBranchId}`, {
          headers: { "X-CSRF-Token": cleanupCsrf },
        });
      }
    }
  });

  test("manager can read print settings but employee is blocked", async ({ page, browser }) => {
    await login(page.request, "manager", "Manager123456!");

    const managerSettingsRes = await page.request.get("/api/pos/print-settings");
    expect(managerSettingsRes.ok()).toBeTruthy();

    await page.goto("/print-setting");
    await expect(page).toHaveURL(/\/print-setting$/);
    await expect(page.getByText("ตั้งค่าการพิมพ์")).toBeVisible();

    const employeeContext = await browser.newContext({ baseURL: E2E_BASE_URL });
    const employeePage = await employeeContext.newPage();
    try {
      await login(employeePage.request, "employee", "Employee123456!");
      const employeeSettingsRes = await employeePage.request.get("/api/pos/print-settings");
      expect(employeeSettingsRes.status()).toBe(403);

      await employeePage.goto("/print-setting");
      await expect(employeePage.getByTestId("access-guard-fallback")).toBeVisible();
    } finally {
      await employeeContext.close();
    }
  });
});
