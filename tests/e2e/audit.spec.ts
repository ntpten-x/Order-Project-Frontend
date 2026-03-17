import { expect, test } from "@playwright/test";
import { login } from "./helpers.api-auth";

const E2E_BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3001";

test.describe("Audit page", () => {
  test("admin can open audit page and manager/employee are blocked", async ({ page, browser }) => {
    await login(page.request, "admin", "Admin123456!");

    await page.goto("/audit");
    await expect(page).toHaveURL(/\/audit$/);
    await expect(page.getByText("Audit Logs")).toBeVisible();

    const managerContext = await browser.newContext({ baseURL: E2E_BASE_URL });
    const managerPage = await managerContext.newPage();
    try {
      await login(managerPage.request, "manager", "Manager123456!");
      await managerPage.goto("/audit");
      await expect(managerPage.getByTestId("access-guard-fallback")).toBeVisible();
    } finally {
      await managerContext.close();
    }

    const employeeContext = await browser.newContext({ baseURL: E2E_BASE_URL });
    const employeePage = await employeeContext.newPage();
    try {
      await login(employeePage.request, "employee", "Employee123456!");
      await employeePage.goto("/audit");
      await expect(employeePage.getByTestId("access-guard-fallback")).toBeVisible();
    } finally {
      await employeeContext.close();
    }
  });
});
