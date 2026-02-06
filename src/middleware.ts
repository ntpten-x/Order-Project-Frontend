import { NextRequest, NextResponse } from "next/server";
import { asRole, requiredRolesForPath } from "./lib/rbac/policy";

type JwtPayload = { role?: unknown; user?: { role?: unknown } };

function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  let payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const pad = payload.length % 4;
  if (pad) payload += "=".repeat(4 - pad);
  try {
    const json = atob(payload);
    const parsed: unknown = JSON.parse(json);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as JwtPayload;
  } catch {
    return null;
  }
}

function jsonError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap.xml")
  ) {
    return NextResponse.next();
  }

  const policy = requiredRolesForPath(pathname, req.method);
  if (!policy) return NextResponse.next();

  const token = req.cookies.get("token")?.value;

  // Public access (no token required) only for login + csrf + auth login
  const isPublic =
    pathname === "/login" ||
    pathname.startsWith("/offline") ||
    pathname === "/api/csrf" ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/auth/logout");

  if (!token) {
    if (isPublic) return NextResponse.next();
    if (pathname.startsWith("/api")) return jsonError(401, "Unauthorized");
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Authenticated: determine role from JWT payload (UI gate only; backend is source of truth)
  const payload = decodeJwtPayload(token);
  const role = asRole(payload?.role) ?? asRole(payload?.user?.role);

  if (!role) {
    if (pathname.startsWith("/api")) return jsonError(401, "Unauthorized");
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const allowed = policy.allowed;
  const ok = allowed.includes(role) || role === "Admin";
  if (ok) return NextResponse.next();

  if (pathname.startsWith("/api")) return jsonError(403, "Forbidden");

  const url = req.nextUrl.clone();
  url.pathname = policy.redirectTo || "/pos";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
