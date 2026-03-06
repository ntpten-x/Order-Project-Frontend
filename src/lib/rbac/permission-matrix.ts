import { ALL_ROLES, type Role } from "./roles";

type MatchMode = "exact" | "prefix" | "contains";
type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS";

export type PermissionRouteRule = {
  id: string;
  resourceKey: string;
  description: string;
  match: {
    mode: MatchMode;
    value: string;
  };
  methods?: readonly HttpMethod[];
  allowedRoles: readonly Role[];
  redirectTo?: string;
  isPublic?: boolean;
};

const READ_METHODS: readonly HttpMethod[] = ["GET", "HEAD", "OPTIONS"];
const WRITE_METHODS: readonly HttpMethod[] = ["POST", "PUT", "PATCH", "DELETE"];

export const PERMISSION_ROUTE_MATRIX: readonly PermissionRouteRule[] = [
  {
    id: "public-login",
    resourceKey: "public.login",
    description: "Public login page.",
    match: { mode: "exact", value: "/login" },
    allowedRoles: ALL_ROLES,
    isPublic: true,
  },
  {
    id: "public-offline",
    resourceKey: "public.offline",
    description: "Public offline fallback page.",
    match: { mode: "prefix", value: "/offline" },
    allowedRoles: ALL_ROLES,
    isPublic: true,
  },
  {
    id: "api-public-csrf",
    resourceKey: "api.auth.csrf",
    description: "Issue CSRF token before authenticated calls.",
    match: { mode: "exact", value: "/api/csrf" },
    methods: ["GET"],
    allowedRoles: ALL_ROLES,
    isPublic: true,
  },
  {
    id: "api-public-login",
    resourceKey: "api.auth.login",
    description: "Login endpoint.",
    match: { mode: "prefix", value: "/api/auth/login" },
    allowedRoles: ALL_ROLES,
    isPublic: true,
  },
  {
    id: "api-public-logout",
    resourceKey: "api.auth.logout",
    description: "Logout endpoint.",
    match: { mode: "prefix", value: "/api/auth/logout" },
    allowedRoles: ALL_ROLES,
    isPublic: true,
  },
  {
    id: "api-auth-me",
    resourceKey: "api.auth.me",
    description: "Authenticated profile lookup.",
    match: { mode: "exact", value: "/api/auth/me" },
    methods: ["GET"],
    allowedRoles: ALL_ROLES,
  },
  {
    id: "api-roles-admin",
    resourceKey: "api.roles",
    description: "Role management endpoints.",
    match: { mode: "prefix", value: "/api/roles" },
    allowedRoles: ["Admin"],
  },
  {
    id: "api-auth-switch-branch-admin",
    resourceKey: "api.auth.switch-branch",
    description: "Switch branch for privileged user context.",
    match: { mode: "prefix", value: "/api/auth/switch-branch" },
    allowedRoles: ["Admin"],
  },
  {
    id: "api-audit-admin",
    resourceKey: "api.audit",
    description: "Audit API access.",
    match: { mode: "prefix", value: "/api/audit" },
    allowedRoles: ["Admin"],
  },
  {
    id: "api-users-admin-manager",
    resourceKey: "api.users",
    description: "User management API.",
    match: { mode: "prefix", value: "/api/users" },
    allowedRoles: ["Admin", "Manager"],
  },
  {
    id: "api-permissions-admin-manager",
    resourceKey: "api.permissions",
    description: "Permission matrix and simulation API.",
    match: { mode: "prefix", value: "/api/permissions" },
    allowedRoles: ["Admin", "Manager"],
  },
  {
    id: "api-branches-read-admin-manager",
    resourceKey: "api.branches.read",
    description: "Read branch records.",
    match: { mode: "prefix", value: "/api/branches" },
    methods: READ_METHODS,
    allowedRoles: ["Admin", "Manager"],
  },
  {
    id: "api-branches-write-admin",
    resourceKey: "api.branches.write",
    description: "Mutate branch records.",
    match: { mode: "prefix", value: "/api/branches" },
    methods: WRITE_METHODS,
    allowedRoles: ["Admin"],
  },
  {
    id: "api-payment-accounts-admin-manager",
    resourceKey: "api.pos.payment-accounts",
    description: "POS payment account administration.",
    match: { mode: "prefix", value: "/api/pos/payment-accounts" },
    allowedRoles: ["Admin", "Manager"],
  },
  {
    id: "api-print-settings-admin-manager",
    resourceKey: "api.pos.print-settings",
    description: "Branch-scoped print settings API.",
    match: { mode: "prefix", value: "/api/pos/print-settings" },
    allowedRoles: ["Admin", "Manager"],
  },
  {
    id: "api-shop-profile-read-all",
    resourceKey: "api.pos.shop-profile.read",
    description: "Read POS shop profile.",
    match: { mode: "prefix", value: "/api/pos/shopProfile" },
    methods: READ_METHODS,
    allowedRoles: ALL_ROLES,
  },
  {
    id: "api-shop-profile-write-admin-manager",
    resourceKey: "api.pos.shop-profile.write",
    description: "Update POS shop profile.",
    match: { mode: "prefix", value: "/api/pos/shopProfile" },
    methods: WRITE_METHODS,
    allowedRoles: ["Admin", "Manager"],
  },
  {
    id: "api-products-read-all",
    resourceKey: "api.pos.products.read",
    description: "Read product catalog.",
    match: { mode: "prefix", value: "/api/pos/products" },
    methods: READ_METHODS,
    allowedRoles: ALL_ROLES,
  },
  {
    id: "api-products-write-admin-manager",
    resourceKey: "api.pos.products.write",
    description: "Write product catalog.",
    match: { mode: "prefix", value: "/api/pos/products" },
    methods: WRITE_METHODS,
    allowedRoles: ["Admin", "Manager"],
  },
  {
    id: "api-products-unit-read-all",
    resourceKey: "api.pos.products-unit.read",
    description: "Read product unit data.",
    match: { mode: "prefix", value: "/api/pos/productsUnit" },
    methods: READ_METHODS,
    allowedRoles: ALL_ROLES,
  },
  {
    id: "api-products-unit-write-admin-manager",
    resourceKey: "api.pos.products-unit.write",
    description: "Write product unit data.",
    match: { mode: "prefix", value: "/api/pos/productsUnit" },
    methods: WRITE_METHODS,
    allowedRoles: ["Admin", "Manager"],
  },
  {
    id: "api-category-read-all",
    resourceKey: "api.pos.category.read",
    description: "Read category data.",
    match: { mode: "prefix", value: "/api/pos/category" },
    methods: READ_METHODS,
    allowedRoles: ALL_ROLES,
  },
  {
    id: "api-category-write-admin-manager",
    resourceKey: "api.pos.category.write",
    description: "Write category data.",
    match: { mode: "prefix", value: "/api/pos/category" },
    methods: WRITE_METHODS,
    allowedRoles: ["Admin", "Manager"],
  },
  {
    id: "api-discounts-read-all",
    resourceKey: "api.pos.discounts.read",
    description: "Read discount data.",
    match: { mode: "prefix", value: "/api/pos/discounts" },
    methods: READ_METHODS,
    allowedRoles: ALL_ROLES,
  },
  {
    id: "api-discounts-write-admin-manager",
    resourceKey: "api.pos.discounts.write",
    description: "Write discount data.",
    match: { mode: "prefix", value: "/api/pos/discounts" },
    methods: WRITE_METHODS,
    allowedRoles: ["Admin", "Manager"],
  },
  {
    id: "api-delivery-read-all",
    resourceKey: "api.pos.delivery.read",
    description: "Read delivery channel data.",
    match: { mode: "prefix", value: "/api/pos/delivery" },
    methods: READ_METHODS,
    allowedRoles: ALL_ROLES,
  },
  {
    id: "api-delivery-write-admin-manager",
    resourceKey: "api.pos.delivery.write",
    description: "Write delivery channel data.",
    match: { mode: "prefix", value: "/api/pos/delivery" },
    methods: WRITE_METHODS,
    allowedRoles: ["Admin", "Manager"],
  },
  {
    id: "api-payment-method-read-all",
    resourceKey: "api.pos.payment-method.read",
    description: "Read payment method data.",
    match: { mode: "prefix", value: "/api/pos/paymentMethod" },
    methods: READ_METHODS,
    allowedRoles: ALL_ROLES,
  },
  {
    id: "api-payment-method-write-admin-manager",
    resourceKey: "api.pos.payment-method.write",
    description: "Write payment method data.",
    match: { mode: "prefix", value: "/api/pos/paymentMethod" },
    methods: WRITE_METHODS,
    allowedRoles: ["Admin", "Manager"],
  },
  {
    id: "api-pos-tables-read-write-all",
    resourceKey: "api.pos.tables",
    description: "POS table read and state updates.",
    match: { mode: "prefix", value: "/api/pos/tables" },
    methods: ["GET", "HEAD", "OPTIONS", "PUT", "PATCH"],
    allowedRoles: ALL_ROLES,
  },
  {
    id: "api-pos-tables-create-delete-admin-manager",
    resourceKey: "api.pos.tables.manage",
    description: "POS table create/delete.",
    match: { mode: "prefix", value: "/api/pos/tables" },
    methods: ["POST", "DELETE"],
    allowedRoles: ["Admin", "Manager"],
  },
  {
    id: "api-stock-all",
    resourceKey: "api.stock",
    description: "Stock module API.",
    match: { mode: "prefix", value: "/api/stock" },
    allowedRoles: ALL_ROLES,
  },
  {
    id: "api-pos-operations-all",
    resourceKey: "api.pos.operations",
    description: "POS operational API.",
    match: { mode: "prefix", value: "/api/pos" },
    allowedRoles: ALL_ROLES,
  },
  {
    id: "api-health-all",
    resourceKey: "api.health",
    description: "Health check endpoint for authenticated users.",
    match: { mode: "exact", value: "/api/health" },
    allowedRoles: ALL_ROLES,
  },
  {
    id: "api-system-health-admin",
    resourceKey: "api.system.health",
    description: "Detailed system health endpoint.",
    match: { mode: "exact", value: "/api/system/health" },
    allowedRoles: ["Admin"],
  },
  {
    id: "api-cron-keepalive-admin",
    resourceKey: "api.cron.keep-alive",
    description: "Keep alive endpoint.",
    match: { mode: "exact", value: "/api/cron/keep-alive" },
    allowedRoles: ["Admin"],
  },
  {
    id: "page-root-all",
    resourceKey: "page.root",
    description: "Main application root.",
    match: { mode: "exact", value: "/" },
    allowedRoles: ALL_ROLES,
  },
  {
    id: "page-pos-settings-admin-manager",
    resourceKey: "page.pos.settings",
    description: "POS settings pages.",
    match: { mode: "prefix", value: "/pos/settings" },
    allowedRoles: ["Admin", "Manager"],
    redirectTo: "/pos",
  },
  {
    id: "page-print-settings-admin-manager",
    resourceKey: "page.print-settings",
    description: "Branch print setting page.",
    match: { mode: "prefix", value: "/print-setting" },
    allowedRoles: ["Admin", "Manager"],
    redirectTo: "/pos/settings",
  },
  {
    id: "page-pos-product-manage-admin-manager",
    resourceKey: "page.pos.products.manage",
    description: "Product management pages.",
    match: { mode: "prefix", value: "/pos/products/manage" },
    allowedRoles: ["Admin", "Manager"],
    redirectTo: "/pos",
  },
  {
    id: "page-manager-slug-admin-manager",
    resourceKey: "page.manager.slug",
    description: "Manager edit screens across modules.",
    match: { mode: "contains", value: "/manager/" },
    allowedRoles: ["Admin", "Manager"],
    redirectTo: "/pos",
  },
  {
    id: "page-pos-all",
    resourceKey: "page.pos",
    description: "POS pages.",
    match: { mode: "prefix", value: "/pos" },
    allowedRoles: ALL_ROLES,
  },
  {
    id: "page-stock-all",
    resourceKey: "page.stock",
    description: "Stock pages.",
    match: { mode: "prefix", value: "/stock" },
    allowedRoles: ALL_ROLES,
    redirectTo: "/pos",
  },
  {
    id: "page-users-admin-manager",
    resourceKey: "page.users",
    description: "User and permission administration pages.",
    match: { mode: "prefix", value: "/users" },
    allowedRoles: ["Admin", "Manager"],
    redirectTo: "/pos",
  },
  {
    id: "page-branch-manager-admin",
    resourceKey: "page.branch.manager",
    description: "Branch manager settings page.",
    match: { mode: "prefix", value: "/branch/manager" },
    allowedRoles: ["Admin"],
    redirectTo: "/branch",
  },
  {
    id: "page-branch-admin-manager",
    resourceKey: "page.branch",
    description: "Branch pages.",
    match: { mode: "prefix", value: "/branch" },
    allowedRoles: ["Admin", "Manager"],
    redirectTo: "/pos",
  },
  {
    id: "page-audit-admin",
    resourceKey: "page.audit",
    description: "Audit pages.",
    match: { mode: "prefix", value: "/audit" },
    allowedRoles: ["Admin"],
    redirectTo: "/pos",
  },
  {
    id: "page-health-system-admin",
    resourceKey: "page.health-system",
    description: "Health System page.",
    match: { mode: "prefix", value: "/Health-System" },
    allowedRoles: ["Admin"],
    redirectTo: "/pos",
  },
];

function matchesPath(pathname: string, rule: PermissionRouteRule): boolean {
  if (rule.match.mode === "exact") return pathname === rule.match.value;
  if (rule.match.mode === "prefix") return pathname.startsWith(rule.match.value);
  return pathname.includes(rule.match.value);
}

function matchesMethod(method: string, rule: PermissionRouteRule): boolean {
  if (!rule.methods || rule.methods.length === 0) return true;
  return rule.methods.includes(method.toUpperCase() as HttpMethod);
}

export function findRouteRule(pathname: string, method: string): PermissionRouteRule | null {
  for (const rule of PERMISSION_ROUTE_MATRIX) {
    if (matchesPath(pathname, rule) && matchesMethod(method, rule)) {
      return rule;
    }
  }
  return null;
}
