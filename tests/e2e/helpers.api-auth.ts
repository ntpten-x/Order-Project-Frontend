import { expect, type APIRequestContext } from "@playwright/test";

type JsonRecord = Record<string, unknown>;

export async function readJson(response: Awaited<ReturnType<APIRequestContext["get"]>>) {
  return response.json().catch(() => ({}));
}

export function unwrapData<T = JsonRecord>(payload: unknown): T {
  if (!payload || typeof payload !== "object") return {} as T;
  const record = payload as JsonRecord;
  const data = record.data;
  if (!data || typeof data !== "object") return record as T;
  return data as T;
}

export function unwrapList<T = JsonRecord>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object") {
    const data = (payload as JsonRecord).data;
    if (Array.isArray(data)) return data as T[];
  }
  return [];
}

export async function getCsrfToken(context: APIRequestContext): Promise<string> {
  const response = await context.get("/api/csrf");
  expect(response.ok()).toBeTruthy();
  const payload = await readJson(response);
  const token =
    (payload as JsonRecord).csrfToken ||
    ((payload as JsonRecord).data as JsonRecord | undefined)?.csrfToken;
  expect(typeof token).toBe("string");
  return token as string;
}

export async function login(context: APIRequestContext, username: string, password: string) {
  const csrfToken = await getCsrfToken(context);
  const response = await context.post("/api/auth/login", {
    headers: {
      "X-CSRF-Token": csrfToken,
    },
    data: { username, password },
  });
  expect(response.ok()).toBeTruthy();

  const meResponse = await context.get("/api/auth/me");
  expect(meResponse.ok()).toBeTruthy();
  return unwrapData<{ id: string; username?: string; role?: string }>(await readJson(meResponse));
}
