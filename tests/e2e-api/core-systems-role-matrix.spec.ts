import { expect, request as playwrightRequest, test } from "@playwright/test";
import { login } from "../e2e/helpers.api-auth";

type RoleCase = {
  label: "admin" | "manager" | "employee";
  username: string;
  password: string;
  expectedBranchesStatus: number[];
  expectedAuditStatus: number[];
  expectedSystemHealthStatus: number[];
};

function expectStatusIn(actual: number, expected: number[], label: string) {
  expect(expected.includes(actual), `${label}: expected one of [${expected.join(", ")}], got ${actual}`).toBeTruthy();
}

test.describe("Core systems role matrix (auth/health/branch/audit)", () => {
  test("anonymous access is blocked for protected endpoints", async ({ request }) => {
    expect((await request.get("/api/auth/me")).status()).toBe(401);
    expect((await request.get("/api/branches?page=1&limit=10")).status()).toBe(401);
    expect((await request.get("/api/audit/logs?page=1&limit=10")).status()).toBe(401);
    expect((await request.get("/api/system/health")).status()).toBe(401);
  });

  test("admin/manager/employee access matrix matches RBAC baseline", async ({ baseURL }) => {
    const roles: RoleCase[] = [
      {
        label: "admin",
        username: process.env.E2E_ADMIN_USERNAME || "admin",
        password: process.env.E2E_ADMIN_PASSWORD || "123456",
        expectedBranchesStatus: [200],
        expectedAuditStatus: [200],
        expectedSystemHealthStatus: [200],
      },
      {
        label: "manager",
        username: process.env.E2E_MANAGER_USERNAME || "user1",
        password: process.env.E2E_MANAGER_PASSWORD || "123456",
        expectedBranchesStatus: [200, 403],
        expectedAuditStatus: [403],
        expectedSystemHealthStatus: [403],
      },
      {
        label: "employee",
        username: process.env.E2E_EMPLOYEE_USERNAME || "emp",
        password: process.env.E2E_EMPLOYEE_PASSWORD || "123456",
        expectedBranchesStatus: [403],
        expectedAuditStatus: [403],
        expectedSystemHealthStatus: [403],
      },
    ];

    const contexts = await Promise.all(
      roles.map(() =>
        playwrightRequest.newContext({
          baseURL,
          extraHTTPHeaders: {
            "x-e2e-test": "core-systems-role-matrix",
          },
        })
      )
    );

    try {
      for (let i = 0; i < roles.length; i += 1) {
        const role = roles[i];
        const context = contexts[i];

        const me = await login(context, role.username, role.password);
        expect(typeof me?.id).toBe("string");
        expect(me.id.length).toBeGreaterThan(0);

        const branchesResponse = await context.get("/api/branches?page=1&limit=10");
        expectStatusIn(branchesResponse.status(), role.expectedBranchesStatus, `${role.label} branches status`);

        const auditResponse = await context.get("/api/audit/logs?page=1&limit=10");
        expectStatusIn(auditResponse.status(), role.expectedAuditStatus, `${role.label} audit logs status`);

        const systemHealthResponse = await context.get("/api/system/health");
        expectStatusIn(
          systemHealthResponse.status(),
          role.expectedSystemHealthStatus,
          `${role.label} system health status`
        );
      }
    } finally {
      await Promise.all(contexts.map((ctx) => ctx.dispose()));
    }
  });
});
