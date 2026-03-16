import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { getCsrfToken, login, readJson, unwrapData, unwrapList } from "./helpers.api-auth";

type Branch = {
  id: string;
  branch_name: string;
  branch_code: string;
  is_active: boolean;
};

const credentials = {
  admin: {
    username: process.env.E2E_ADMIN_USERNAME || "admin",
    password: process.env.E2E_ADMIN_PASSWORD || "Admin123456!",
  },
  manager: {
    username: process.env.E2E_MANAGER_USERNAME || "manager",
    password: process.env.E2E_MANAGER_PASSWORD || "Manager123456!",
  },
  employee: {
    username: process.env.E2E_EMPLOYEE_USERNAME || "employee",
    password: process.env.E2E_EMPLOYEE_PASSWORD || "Employee123456!",
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

async function fetchBranches(context: APIRequestContext, search?: string): Promise<Branch[]> {
  const params = new URLSearchParams({
    page: "1",
    limit: "100",
    sort_created: "new",
  });
  if (search) params.set("q", search);

  const response = await context.get(`/api/branches?${params.toString()}`);
  expect(response.ok()).toBeTruthy();
  return unwrapList<Branch>(await readJson(response));
}

async function findBranchByCode(
  context: APIRequestContext,
  branchCode: string
): Promise<Branch | undefined> {
  const branches = await fetchBranches(context, branchCode);
  return branches.find((item) => item.branch_code === branchCode);
}

async function waitForBranchByCode(
  context: APIRequestContext,
  branchCode: string,
  timeoutMs: number = 15000
): Promise<Branch> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const branch = await findBranchByCode(context, branchCode);
    if (branch) return branch;
    await new Promise((resolve) => setTimeout(resolve, 400));
  }

  throw new Error(`Branch not found within ${timeoutMs}ms: ${branchCode}`);
}

async function getBranchById(context: APIRequestContext, branchId: string): Promise<Branch> {
  const response = await context.get(`/api/branches/${branchId}`);
  expect(response.ok()).toBeTruthy();
  return unwrapData<Branch>(await readJson(response));
}

async function switchBranch(context: APIRequestContext, branchId: string | null) {
  const csrfToken = await getCsrfToken(context);
  const response = await context.post("/api/auth/switch-branch", {
    headers: { "X-CSRF-Token": csrfToken },
    data: { branch_id: branchId },
  });
  expect(response.ok()).toBeTruthy();
}

async function getActiveBranchId(context: APIRequestContext): Promise<string | null> {
  const response = await context.get("/api/auth/active-branch");
  expect(response.ok()).toBeTruthy();
  const payload = (await readJson(response)) as { active_branch_id?: string | null };
  return typeof payload.active_branch_id === "string" ? payload.active_branch_id : null;
}

test.describe("Branch UI", () => {
  test("admin can create, update, switch, and deactivate a branch with selected branch cleanup", async ({
    page,
  }) => {
    test.setTimeout(180000);
    await page.setViewportSize({ width: 1440, height: 1100 });

    await loginToUi(page, credentials.admin.username, credentials.admin.password);

    const branchCode = uniq("B").replace(/[^A-Za-z0-9]/g, "").slice(0, 12).toUpperCase();
    const branchName = `Branch ${uniq("admin")}`.slice(0, 90);
    const updatedBranchName = `${branchName} Edit`.slice(0, 100);

    await page.goto("/branch/manager/add");
    await expect(page.getByTestId("branch-manage-page")).toBeVisible();
    await page.getByTestId("branch-name-input").fill(branchName);
    await page.getByTestId("branch-code-input").fill(branchCode);
    await page.getByTestId("branch-address-input").fill("123 Test Road");
    await page.getByTestId("branch-phone-input").fill("021234567");
    await page.getByTestId("branch-submit").click();

    await expect(page).toHaveURL(/\/branch(\?.*)?$/);
    await expect(page.getByTestId("branch-page")).toBeVisible();

    const createdBranch = await waitForBranchByCode(page.request, branchCode);

    await page.goto(`/branch/manager/edit/${createdBranch.id}`);
    await expect(page.getByTestId("branch-manage-page")).toBeVisible();
    await page.getByTestId("branch-name-input").fill(updatedBranchName);
    await page.getByTestId("branch-submit").click();

    await expect(page).toHaveURL(/\/branch(\?.*)?$/);
    await switchBranch(page.request, createdBranch.id);
    await expect.poll(async () => getActiveBranchId(page.request), { timeout: 10000 }).toBe(
      createdBranch.id
    );

    await page.goto(`/branch/manager/edit/${createdBranch.id}`);
    await expect(page.getByTestId("branch-delete")).toBeVisible();
    await page.getByTestId("branch-delete").click();
    await page.locator(".ant-modal-root .ant-btn-dangerous").last().click();

    await expect(page).toHaveURL(/\/branch(\?.*)?$/);

    await expect
      .poll(async () => {
        const branch = await getBranchById(page.request, createdBranch.id);
        return branch.is_active;
      })
      .toBeFalsy();
    await expect.poll(async () => getActiveBranchId(page.request), { timeout: 10000 }).toBeNull();
  });

  test("manager and employee cannot access branch page or branch manage page", async ({ page }) => {
    test.setTimeout(120000);

    await loginToUi(page, credentials.manager.username, credentials.manager.password);
    await page.goto("/branch");
    await expect(page.getByTestId("access-guard-fallback")).toBeVisible();
    await page.goto("/branch/manager/add");
    await expect(page.getByTestId("access-guard-fallback")).toBeVisible();

    await loginToUi(page, credentials.employee.username, credentials.employee.password);
    await page.goto("/branch");
    await expect(page.getByTestId("access-guard-fallback")).toBeVisible();
    await page.goto("/branch/manager/add");
    await expect(page.getByTestId("access-guard-fallback")).toBeVisible();
  });
});
