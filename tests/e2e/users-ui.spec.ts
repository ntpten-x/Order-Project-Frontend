import { expect, test } from "@playwright/test";
import { getCsrfToken, login, readJson, unwrapData, unwrapList } from "./helpers.api-auth";

type JsonRecord = Record<string, unknown>;

function uniq(prefix: string) {
  const now = Date.now().toString(16);
  const rand = Math.random().toString(16).slice(2, 8);
  return `${prefix}_${now}_${rand}`.slice(0, 20);
}

test.describe("Users UI (Admin/Manager)", () => {
  test("admin can use /users, add/edit user, access /users/permissions without 403", async ({ page }) => {
    const adminUsername =
      process.env.E2E_USERS_ADMIN_USERNAME ||
      process.env.E2E_ADMIN_USERNAME ||
      process.env.E2E_USERNAME ||
      "admin";
    const adminPassword =
      process.env.E2E_USERS_ADMIN_PASSWORD ||
      process.env.E2E_ADMIN_PASSWORD ||
      process.env.E2E_PASSWORD ||
      "Admin123456!";

    const me = await login(page.request, adminUsername, adminPassword);
    expect((me.role || "").toLowerCase()).toBe("admin");

    await page.goto("/users");
    await expect(page.getByTestId("users-page")).toBeVisible();

    await page.getByTestId("users-add").click();
    await expect(page).toHaveURL(/\/users\/manage\/add/);
    await expect(page.getByTestId("users-manage-page")).toBeVisible();

    const csrf = await getCsrfToken(page.request);
    const rolesRes = await page.request.get("/api/roles/getAll");
    expect(rolesRes.ok()).toBeTruthy();
    const roles = (await rolesRes.json().catch(() => [])) as Array<{ id: string; roles_name?: string }>;
    const employeeRole = roles.find((r) => String(r.roles_name || "").toLowerCase() === "employee") || roles[0];
    expect(employeeRole && employeeRole.id).toBeTruthy();

    const branchesRes = await page.request.get("/api/branches?page=1&limit=5");
    expect(branchesRes.ok()).toBeTruthy();
    const branchesPayload = await branchesRes.json().catch(() => ({}));
    const branches = unwrapList<JsonRecord>(branchesPayload);
    expect(branches.length).toBeGreaterThan(0);

    let targetBranchId = String(branches[1]?.id || "");
    if (!targetBranchId) {
      const branchCode = uniq("ubr").replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 12);
      const createBranchRes = await page.request.post("/api/branches", {
        headers: { "X-CSRF-Token": csrf },
        data: {
          branch_name: `Users Branch ${branchCode}`,
          branch_code: branchCode,
          is_active: true,
        },
      });
      expect([200, 201]).toContain(createBranchRes.status());
      const createdBranch = unwrapData<JsonRecord>(await readJson(createBranchRes));
      targetBranchId = String(createdBranch.id || "");
    }
    expect(targetBranchId.length).toBeGreaterThan(0);

    const branchId = String(branches[0]?.id || "");
    expect(branchId.length).toBeGreaterThan(0);

    const username = uniq("uiu");
    const createRes = await page.request.post("/api/users", {
      headers: { "X-CSRF-Token": csrf },
      data: {
        username,
        name: `UI ${username}`,
        password: "Ui_Test_123!",
        roles_id: employeeRole.id,
        branch_id: branchId,
        is_use: true,
        is_active: false,
      },
    });
    expect([200, 201]).toContain(createRes.status());
    const created = unwrapData<JsonRecord>(await readJson(createRes));
    const createdId = String(created.id || "");
    expect(createdId.length).toBeGreaterThan(0);

    await page.goto(`/users/manage/edit/${createdId}`);
    await expect(page).toHaveURL(new RegExp(`/users/manage/edit/${createdId}$`));
    await expect(page.getByTestId("users-manage-page")).toBeVisible();

    const updateRes = await page.request.put(`/api/users/${createdId}`, {
      headers: { "X-CSRF-Token": csrf },
      data: { name: `UI Updated ${username}`, branch_id: targetBranchId },
    });
    expect(updateRes.ok()).toBeTruthy();
    const updated = unwrapData<JsonRecord>(await readJson(updateRes));
    expect(String(updated.branch_id || "")).toBe(targetBranchId);

    const delRes = await page.request.delete(`/api/users/${createdId}`, {
      headers: { "X-CSRF-Token": csrf },
    });
    expect([200, 204]).toContain(delRes.status());

    await page.goto("/users/permissions");
    await expect(page).toHaveURL(/\/users\/permissions$/);
  });

  test("manager sees only branch scoped users and cannot delete (403)", async ({ page }) => {
    const managerUsername =
      process.env.E2E_USERS_MANAGER_USERNAME ||
      process.env.E2E_MANAGER_USERNAME ||
      "manager";
    const managerPassword =
      process.env.E2E_USERS_MANAGER_PASSWORD ||
      process.env.E2E_MANAGER_PASSWORD ||
      "Manager123456!";

    const me = await login(page.request, managerUsername, managerPassword);
    expect((me.role || "").toLowerCase()).toBe("manager");

    const meResponse = await page.request.get("/api/auth/me");
    expect(meResponse.ok()).toBeTruthy();
    const mePayload = unwrapData<JsonRecord>(await readJson(meResponse));
    const managerBranchId = String(mePayload.branch_id || "");
    expect(managerBranchId.length).toBeGreaterThan(0);

    await page.goto("/users");
    await expect(page.getByTestId("users-page")).toBeVisible();

    await expect(page.getByLabel(/^ลบ /)).toHaveCount(0);

    const listResponse = await page.request.get("/api/users?page=1&limit=50");
    expect(listResponse.ok()).toBeTruthy();
    const listPayload = await readJson(listResponse);
    const rows = unwrapList<JsonRecord>(listPayload);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row) => String(row.branch_id || "") === managerBranchId)).toBeTruthy();

    const targetId = String(rows[0]?.id || "");
    expect(targetId.length).toBeGreaterThan(0);

    const csrf = await getCsrfToken(page.request);
    const delResponse = await page.request.delete(`/api/users/${targetId}`, {
      headers: { "X-CSRF-Token": csrf },
    });
    expect([400, 403]).toContain(delResponse.status());

    await page.goto("/users/permissions");
    const permissionsAuditResponse = await page.request.get("/api/permissions/audits?page=1&limit=5");
    expect(permissionsAuditResponse.status()).toBe(403);
  });
});
