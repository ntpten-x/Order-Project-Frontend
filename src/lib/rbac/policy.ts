export type Role = "Admin" | "Manager" | "Employee";

export const ALL_ROLES: Role[] = ["Admin", "Manager", "Employee"];

export function asRole(value: unknown): Role | null {
  if (value === "Admin" || value === "Manager" || value === "Employee") return value;
  return null;
}

export function isRoleAllowed(role: Role, allowed: Role[]): boolean {
  return allowed.includes(role) || role === "Admin";
}

export function requiredRolesForPath(
  pathname: string,
  method: string
): { allowed: Role[]; redirectTo?: string } | null {
  const m = method.toUpperCase();

  // Pages
  if (pathname === "/login" || pathname.startsWith("/offline")) return { allowed: ALL_ROLES };

  // Admin-only pages
  if (pathname.startsWith("/branch/manager")) return { allowed: ["Admin"], redirectTo: "/branch" };

  // Admin/Manager pages
  if (pathname.startsWith("/audit")) return { allowed: ["Admin"], redirectTo: "/pos" };
  if (pathname.startsWith("/users")) return { allowed: ["Admin", "Manager"], redirectTo: "/pos" };
  if (pathname.startsWith("/branch")) return { allowed: ["Admin", "Manager"], redirectTo: "/pos" };
  if (pathname.startsWith("/stock")) return { allowed: ["Admin", "Manager"], redirectTo: "/pos" };

  // POS settings/management pages
  if (pathname.startsWith("/pos/settings")) return { allowed: ["Admin", "Manager"], redirectTo: "/pos" };
  if (pathname.startsWith("/pos/products/manage")) return { allowed: ["Admin", "Manager"], redirectTo: "/pos" };
  if (pathname.includes("/manager/")) return { allowed: ["Admin", "Manager"], redirectTo: "/pos" };

  // API routes (Next.js proxy)
  if (pathname.startsWith("/api")) {
    // Public API endpoints
    if (pathname === "/api/csrf") return { allowed: ALL_ROLES };
    if (pathname.startsWith("/api/auth/login")) return { allowed: ALL_ROLES };
    if (pathname.startsWith("/api/auth/logout")) return { allowed: ALL_ROLES };

    // Admin-only API endpoints
    if (pathname.startsWith("/api/roles")) return { allowed: ["Admin"] };
    if (pathname.startsWith("/api/auth/switch-branch")) return { allowed: ["Admin"] };

    // Admin/Manager API endpoints
    if (pathname.startsWith("/api/users")) return { allowed: ["Admin", "Manager"] };
    if (pathname.startsWith("/api/audit")) return { allowed: ["Admin"] };
    if (pathname.startsWith("/api/stock")) return { allowed: ["Admin", "Manager"] };
    if (pathname.startsWith("/api/branches")) {
      if (m === "GET") return { allowed: ["Admin", "Manager"] };
      return { allowed: ["Admin"] };
    }

    // POS payment accounts (admin/manager only)
    if (pathname.startsWith("/api/pos/payment-accounts")) return { allowed: ["Admin", "Manager"] };

    // POS shop profile: everyone can read; only admin/manager can write
    if (pathname.startsWith("/api/pos/shopProfile")) {
      if (m === "GET") return { allowed: ALL_ROLES };
      return { allowed: ["Admin", "Manager"] };
    }

    // POS master data: everyone can read; only admin/manager can write
    const masterPrefixes = [
      "/api/pos/products",
      "/api/pos/productsUnit",
      "/api/pos/category",
      "/api/pos/discounts",
      "/api/pos/delivery",
      "/api/pos/paymentMethod",
    ];
    if (masterPrefixes.some((p) => pathname.startsWith(p))) {
      if (m === "GET") return { allowed: ALL_ROLES };
      return { allowed: ["Admin", "Manager"] };
    }

    // POS tables: allow employee to update table status; restrict create/delete
    if (pathname.startsWith("/api/pos/tables")) {
      if (m === "GET") return { allowed: ALL_ROLES };
      if (m === "PUT" || m === "PATCH") return { allowed: ALL_ROLES };
      return { allowed: ["Admin", "Manager"] };
    }

    // POS operations: allow all roles (backend still enforces delete rules)
    const opsPrefixes = [
      "/api/pos/orders",
      "/api/pos/payments",
      "/api/pos/queue",
      "/api/pos/shifts",
      "/api/pos/dashboard",
      "/api/pos/salesOrderItem",
      "/api/pos/salesOrderDetail",
    ];
    if (opsPrefixes.some((p) => pathname.startsWith(p))) {
      return { allowed: ALL_ROLES };
    }

    // Default: require authentication for any other /api route
    return { allowed: ALL_ROLES };
  }

  // Default: authenticated users can access
  return { allowed: ALL_ROLES };
}
