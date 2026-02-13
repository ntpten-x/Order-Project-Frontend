import { expect, request as playwrightRequest, test, type APIRequestContext } from "@playwright/test";

type JsonRecord = Record<string, unknown>;

async function readJson(response: Awaited<ReturnType<APIRequestContext["get"]>>) {
  return response.json().catch(() => ({}));
}

async function getCsrfToken(context: APIRequestContext): Promise<string> {
  const response = await context.get("/api/csrf");
  expect(response.ok()).toBeTruthy();
  const payload = await readJson(response);
  const token =
    (payload as JsonRecord).csrfToken ||
    ((payload as JsonRecord).data as JsonRecord | undefined)?.csrfToken;
  expect(typeof token).toBe("string");
  return token as string;
}

async function login(context: APIRequestContext, username: string, password: string) {
  const csrfToken = await getCsrfToken(context);
  const response = await context.post("/api/auth/login", {
    headers: {
      "X-CSRF-Token": csrfToken,
    },
    data: { username, password },
  });
  expect(response.ok()).toBeTruthy();
}

function expectStatusIn(status: number, allowed: number[], contextLabel: string) {
  expect(
    allowed.includes(status),
    `${contextLabel} expected one of [${allowed.join(", ")}] but got ${status}`
  ).toBeTruthy();
}

test.describe("Shift Role Matrix Phase 8", () => {
  test("admin/manager/employee/no-auth matrix for shift and permission routes", async ({ baseURL }) => {
    const adminUsername = process.env.E2E_ADMIN_USERNAME || "admin";
    const adminPassword = process.env.E2E_ADMIN_PASSWORD || "123456";
    const managerUsername = process.env.E2E_MANAGER_USERNAME || "user1";
    const managerPassword = process.env.E2E_MANAGER_PASSWORD || "123456";
    const employeeUsername = process.env.E2E_EMPLOYEE_USERNAME || "emp";
    const employeePassword = process.env.E2E_EMPLOYEE_PASSWORD || "123456";

    const anonymousContext = await playwrightRequest.newContext({ baseURL });
    const adminContext = await playwrightRequest.newContext({ baseURL });
    const managerContext = await playwrightRequest.newContext({ baseURL });
    const employeeContext = await playwrightRequest.newContext({ baseURL });

    try {
      expect((await anonymousContext.get("/api/pos/shifts/current")).status()).toBe(401);
      expect((await anonymousContext.get("/api/permissions/audits")).status()).toBe(401);

      const cases: Array<{
        label: string;
        username: string;
        password: string;
        expectedAuditStatus: number;
        context: APIRequestContext;
      }> = [
        {
          label: "admin",
          username: adminUsername,
          password: adminPassword,
          expectedAuditStatus: 200,
          context: adminContext,
        },
        {
          label: "manager",
          username: managerUsername,
          password: managerPassword,
          expectedAuditStatus: 403,
          context: managerContext,
        },
        {
          label: "employee",
          username: employeeUsername,
          password: employeePassword,
          expectedAuditStatus: 403,
          context: employeeContext,
        },
      ];

      for (const item of cases) {
        await login(item.context, item.username, item.password);
        const csrfToken = await getCsrfToken(item.context);

        const auditResponse = await item.context.get("/api/permissions/audits?page=1&limit=5");
        expect(auditResponse.status()).toBe(item.expectedAuditStatus);

        const currentResponse = await item.context.get("/api/pos/shifts/current");
        expectStatusIn(currentResponse.status(), [200], `${item.label} shifts current`);

        const historyResponse = await item.context.get("/api/pos/shifts/history?page=1&limit=5");
        expectStatusIn(historyResponse.status(), [200], `${item.label} shifts history`);

        const openResponse = await item.context.post("/api/pos/shifts/open", {
          headers: {
            "X-CSRF-Token": csrfToken,
          },
          data: {
            start_amount: 0,
          },
        });
        expectStatusIn(openResponse.status(), [200, 201, 409], `${item.label} shifts open`);

        const summaryResponse = await item.context.get("/api/pos/shifts/current/summary");
        expectStatusIn(summaryResponse.status(), [200, 404], `${item.label} shifts summary`);

        const closeResponse = await item.context.post("/api/pos/shifts/close", {
          headers: {
            "X-CSRF-Token": csrfToken,
          },
          data: {
            end_amount: 0,
          },
        });
        expectStatusIn(closeResponse.status(), [200, 400, 404], `${item.label} shifts close`);
      }
    } finally {
      await Promise.all([
        anonymousContext.dispose(),
        adminContext.dispose(),
        managerContext.dispose(),
        employeeContext.dispose(),
      ]);
    }
  });

  test("shift validation errors are returned via proxy", async ({ baseURL }) => {
    const adminUsername = process.env.E2E_ADMIN_USERNAME || "admin";
    const adminPassword = process.env.E2E_ADMIN_PASSWORD || "123456";

    const context = await playwrightRequest.newContext({ baseURL });
    try {
      await login(context, adminUsername, adminPassword);
      const csrfToken = await getCsrfToken(context);

      const invalidOpenResponse = await context.post("/api/pos/shifts/open", {
        headers: {
          "X-CSRF-Token": csrfToken,
        },
        data: {
          start_amount: "invalid",
        },
      });
      expectStatusIn(invalidOpenResponse.status(), [400, 422], "invalid shift open payload");

      const invalidCloseResponse = await context.post("/api/pos/shifts/close", {
        headers: {
          "X-CSRF-Token": csrfToken,
        },
        data: {
          end_amount: "invalid",
        },
      });
      expectStatusIn(invalidCloseResponse.status(), [400, 422], "invalid shift close payload");
    } finally {
      await context.dispose();
    }
  });
});
