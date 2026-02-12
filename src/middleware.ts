import { NextRequest, NextResponse } from "next/server";
import { requiredRolesForPath } from "./lib/rbac/policy";

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
  if (policy.isPublic) return NextResponse.next();

  const token = req.cookies.get("token")?.value;

  const denyByDefault = () => {
    if (pathname.startsWith("/api")) {
      return jsonError(403, `Forbidden (${policy.resourceKey}: deny-by-default)`);
    }
    const url = req.nextUrl.clone();
    url.pathname = policy.redirectTo || "/pos";
    return NextResponse.redirect(url);
  };

  if (policy.deniedByDefault) {
    return denyByDefault();
  }

  const redirectToLogin = () => {
    if (pathname.startsWith("/api")) return jsonError(401, "Unauthorized");
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    const res = NextResponse.redirect(url);
    // Clear potentially invalid/stale token to prevent redirect loops.
    res.cookies.delete("token");
    return res;
  };

  if (!token) {
    return redirectToLogin();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
