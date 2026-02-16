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
    const adminUsername = process.env.E2E_USERS_ADMIN_USERNAME || process.env.E2E_USERNAME || "e2e_users_admin";
    const adminPassword = process.env.E2E_USERS_ADMIN_PASSWORD || process.env.E2E_PASSWORD || "E2E_Users_Admin_123!";

    const me = await login(page.request, adminUsername, adminPassword);
    expect((me.role || "").toLowerCase()).toBe("admin");

    await page.goto("/users");
    await expect(page.getByText("ผู้ใช้งาน")).toBeVisible();

    // Add page should be reachable.
    await page.getByRole("button", { name: /เพิ่มผู้ใช้/i }).click();
    await expect(page).toHaveURL(/\/users\/manage\/add/);

    // Use API to validate the full create/update/delete workflow without relying on fragile UI selectors.
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
    expect(createRes.status()).toBe(201);
    const created = unwrapData<JsonRecord>(await readJson(createRes));
    const createdId = String(created.id || "");
    expect(createdId.length).toBeGreaterThan(0);

    // Edit page should be reachable.
    await page.goto(`/users/manage/edit/${createdId}`);
    await expect(page.url()).toContain(`/users/manage/edit/${createdId}`);

    const updateRes = await page.request.put(`/api/users/${createdId}`, {
      headers: { "X-CSRF-Token": csrf },
      data: { name: `UI Updated ${username}` },
    });
    expect(updateRes.ok()).toBeTruthy();

    const delRes = await page.request.delete(`/api/users/${createdId}`, {
      headers: { "X-CSRF-Token": csrf },
    });
    expect(delRes.status()).toBe(204);

    // Navigate to permissions page
    await page.goto("/users/permissions");
    await expect(page.getByText(/จัดการสิทธิ์/)).toBeVisible({ timeout: 15000 });
  });

  test("manager sees only branch scoped users and cannot delete (403)", async ({ page }) => {
    const managerUsername = process.env.E2E_USERS_MANAGER_USERNAME || "e2e_users_manager";
    const managerPassword = process.env.E2E_USERS_MANAGER_PASSWORD || "E2E_Users_Manager_123!";

    const me = await login(page.request, managerUsername, managerPassword);
    expect((me.role || "").toLowerCase()).toBe("manager");

    const meResponse = await page.request.get("/api/auth/me");
    expect(meResponse.ok()).toBeTruthy();
    const mePayload = unwrapData<JsonRecord>(await readJson(meResponse));
    const managerBranchId = String(mePayload.branch_id || "");
    expect(managerBranchId.length).toBeGreaterThan(0);

    await page.goto("/users");
    await expect(page.getByText("ผู้ใช้งาน")).toBeVisible();

    // Delete button should not be visible in UI for non-admin.
    await expect(page.getByLabel(/^ลบ /)).toHaveCount(0);

    // Direct API attempt should be 403.
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
    expect(delResponse.status()).toBe(403);

    // Permissions page should be blocked for manager (frontend guard).
    await page.goto("/users/permissions");
    await expect(page.getByText("คุณไม่มีสิทธิ์เข้าถึงหน้านี้")).toBeVisible();
  });
});
