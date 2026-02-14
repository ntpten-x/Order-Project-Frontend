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

test.describe("Permission Matrix Phase 8", () => {
  test("proxy returns real backend 401/403/409 for approval workflow", async ({ baseURL }) => {
    const requesterUsername = process.env.E2E_USERNAME_REQUESTER || process.env.E2E_USERNAME || "e2e_pos_admin";
    const requesterPassword = process.env.E2E_PASSWORD_REQUESTER || process.env.E2E_PASSWORD || "E2E_Pos_123!";
    const approverUsername = process.env.E2E_USERNAME_APPROVER || "e2e_pos_admin_approver";
    const approverPassword = process.env.E2E_PASSWORD_APPROVER || "E2E_Pos_Approver_123!";

    expect(requesterUsername.toLowerCase()).not.toBe(approverUsername.toLowerCase());

    const anonymousContext = await playwrightRequest.newContext({ baseURL });
    const requesterContext = await playwrightRequest.newContext({ baseURL });
    const approverContext = await playwrightRequest.newContext({ baseURL });

    try {
      const unauthorizedResponse = await anonymousContext.get("/api/permissions/audits");
      expect(unauthorizedResponse.status()).toBe(401);

      const requester = await login(requesterContext, requesterUsername, requesterPassword);
      const requesterCsrf = await getCsrfToken(requesterContext);

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
      await Promise.all([
        anonymousContext.dispose(),
        requesterContext.dispose(),
        approverContext.dispose(),
      ]);
    }
  });
});
