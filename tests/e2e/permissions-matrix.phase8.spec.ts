import { expect, request as playwrightRequest, test, type APIRequestContext } from "@playwright/test";

type JsonRecord = Record<string, unknown>;

function unwrapData(payload: unknown): JsonRecord {
  if (!payload || typeof payload !== "object") return {};
  const record = payload as JsonRecord;
  const data = record.data;
  if (!data || typeof data !== "object") return record;
  return data as JsonRecord;
}

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

async function login(
  context: APIRequestContext,
  username: string,
  password: string
): Promise<{ id: string }> {
  const csrfToken = await getCsrfToken(context);
  const loginResponse = await context.post("/api/auth/login", {
    headers: {
      "X-CSRF-Token": csrfToken,
    },
    data: { username, password },
  });
  expect(loginResponse.ok()).toBeTruthy();

  const meResponse = await context.get("/api/auth/me");
  expect(meResponse.ok()).toBeTruthy();
  const mePayload = unwrapData(await readJson(meResponse));
  const id = mePayload.id;
  expect(typeof id).toBe("string");
  return { id: id as string };
}

async function createAdminApprover(
  context: APIRequestContext,
  csrfToken: string
): Promise<{ id: string; username: string; password: string }> {
  const rolesResponse = await context.get("/api/roles/getAll");
  expect(rolesResponse.ok()).toBeTruthy();
  const rolesPayload = (await readJson(rolesResponse)) as Array<JsonRecord>;
  const adminRole = rolesPayload.find(
    (row) => String(row.roles_name || "").toLowerCase() === "admin"
  );
  expect(typeof adminRole?.id).toBe("string");

  const branchesResponse = await context.get("/api/branches?page=1&limit=5");
  expect(branchesResponse.ok()).toBeTruthy();
  const branchesPayload = await readJson(branchesResponse);
  const branches = Array.isArray((branchesPayload as JsonRecord).data)
    ? ((branchesPayload as JsonRecord).data as JsonRecord[])
    : [];
  expect(branches.length).toBeGreaterThan(0);
  const branchId = String(branches[0]?.id || "");
  expect(branchId).toBeTruthy();

  const suffix = `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
  const username = `appr_${suffix}`.slice(0, 20);
  const password = `Appr_${suffix}!`.slice(0, 24);

  const createResponse = await context.post("/api/users", {
    headers: {
      "X-CSRF-Token": csrfToken,
    },
    data: {
      username,
      name: `Approver ${suffix}`,
      password,
      roles_id: adminRole?.id,
      branch_id: branchId,
      is_use: true,
      is_active: true,
    },
  });
  expect([200, 201]).toContain(createResponse.status());

  const createdPayload = unwrapData(await readJson(createResponse));
  const id = String(createdPayload.id || "");
  expect(id).toBeTruthy();

  return { id, username, password };
}

test.describe("Permission Matrix Phase 8", () => {
  test("proxy returns real backend 401/403/409 for approval workflow", async ({ baseURL }) => {
    const requesterUsername =
      process.env.E2E_USERNAME_REQUESTER ||
      process.env.E2E_USERNAME ||
      process.env.E2E_ADMIN_USERNAME ||
      "admin";
    const requesterPassword =
      process.env.E2E_PASSWORD_REQUESTER ||
      process.env.E2E_PASSWORD ||
      process.env.E2E_ADMIN_PASSWORD ||
      "Admin123456!";
    let approverUsername = process.env.E2E_USERNAME_APPROVER || "";
    let approverPassword = process.env.E2E_PASSWORD_APPROVER || "";
    let createdApproverUserId = "";

    const anonymousContext = await playwrightRequest.newContext({ baseURL });
    const requesterContext = await playwrightRequest.newContext({ baseURL });
    const approverContext = await playwrightRequest.newContext({ baseURL });

    try {
      const unauthorizedResponse = await anonymousContext.get("/api/permissions/audits");
      expect(unauthorizedResponse.status()).toBe(401);

      const requester = await login(requesterContext, requesterUsername, requesterPassword);
      const requesterCsrf = await getCsrfToken(requesterContext);

      if (!approverUsername || !approverPassword) {
        const createdApprover = await createAdminApprover(requesterContext, requesterCsrf);
        createdApproverUserId = createdApprover.id;
        approverUsername = createdApprover.username;
        approverPassword = createdApprover.password;
      }

      expect(requesterUsername.toLowerCase()).not.toBe(approverUsername.toLowerCase());

      const submitResponse = await requesterContext.put(`/api/permissions/users/${requester.id}`, {
        headers: {
          "X-CSRF-Token": requesterCsrf,
        },
        data: {
          reason: `phase8-e2e-${Date.now()}`,
          permissions: [
            {
              resourceKey: "permissions.page",
              canAccess: true,
              canView: true,
              canCreate: true,
              canUpdate: true,
              canDelete: true,
              dataScope: "all",
            },
          ],
        },
      });
      expect(submitResponse.ok()).toBeTruthy();
      const submitPayload = unwrapData(await readJson(submitResponse));
      expect(submitPayload.approvalRequired).toBe(true);

      const approvalId = submitPayload.approvalRequest && typeof submitPayload.approvalRequest === "object"
        ? (submitPayload.approvalRequest as JsonRecord).id
        : null;
      expect(typeof approvalId).toBe("string");

      const selfApproveCsrf = await getCsrfToken(requesterContext);
      const selfApproveResponse = await requesterContext.post(
        `/api/permissions/approvals/${approvalId as string}/approve`,
        {
          headers: {
            "X-CSRF-Token": selfApproveCsrf,
          },
          data: {
            reviewReason: "self-approve-check",
          },
        }
      );
      expect(selfApproveResponse.status()).toBe(403);

      await login(approverContext, approverUsername, approverPassword);
      const approverCsrf = await getCsrfToken(approverContext);
      const approveResponse = await approverContext.post(
        `/api/permissions/approvals/${approvalId as string}/approve`,
        {
          headers: {
            "X-CSRF-Token": approverCsrf,
          },
          data: {
            reviewReason: "phase8-approve",
          },
        }
      );
      expect(approveResponse.ok()).toBeTruthy();

      const approveAgainCsrf = await getCsrfToken(approverContext);
      const approveAgainResponse = await approverContext.post(
        `/api/permissions/approvals/${approvalId as string}/approve`,
        {
          headers: {
            "X-CSRF-Token": approveAgainCsrf,
          },
          data: {
            reviewReason: "phase8-approve-again",
          },
        }
      );
      expect(approveAgainResponse.status()).toBe(409);
    } finally {
      if (createdApproverUserId) {
        try {
          const cleanupCsrf = await getCsrfToken(requesterContext);
          await requesterContext.delete(`/api/users/${createdApproverUserId}`, {
            headers: {
              "X-CSRF-Token": cleanupCsrf,
            },
          });
        } catch {
          // Best-effort cleanup for ephemeral e2e approver account.
        }
      }
      await Promise.all([
        anonymousContext.dispose(),
        requesterContext.dispose(),
        approverContext.dispose(),
      ]);
    }
  });
});
