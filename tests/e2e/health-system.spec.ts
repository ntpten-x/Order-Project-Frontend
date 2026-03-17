import { expect, test } from "@playwright/test";
import { login } from "./helpers.api-auth";

const E2E_BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3001";

test.describe("Health-System page", () => {
  test("admin can open health system and manager/employee are blocked", async ({ page, browser }) => {
    await login(page.request, "admin", "Admin123456!");

    await page.goto("/Health-System");
    await expect(page).toHaveURL(/\/Health-System$/);
    await expect(page.getByText("Health System")).toBeVisible();

    const managerContext = await browser.newContext({ baseURL: E2E_BASE_URL });
    const managerPage = await managerContext.newPage();
    try {
      await login(managerPage.request, "manager", "Manager123456!");
      await managerPage.goto("/Health-System");
      await expect(managerPage.getByTestId("access-guard-fallback")).toBeVisible();
    } finally {
      await managerContext.close();
    }

    const employeeContext = await browser.newContext({ baseURL: E2E_BASE_URL });
    const employeePage = await employeeContext.newPage();
    try {
      await login(employeePage.request, "employee", "Employee123456!");
      await employeePage.goto("/Health-System");
      await expect(employeePage.getByTestId("access-guard-fallback")).toBeVisible();
    } finally {
      await employeeContext.close();
    }
  });
});
