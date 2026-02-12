import { findRouteRule } from "./permission-matrix";
import { ALL_ROLES, asRole, isRoleAllowed, type Role } from "./roles";

export { ALL_ROLES, asRole, isRoleAllowed, type Role };

export type PathPolicy = {
  allowed: Role[];
  redirectTo?: string;
  isPublic: boolean;
  resourceKey: string;
  deniedByDefault: boolean;
};

export function requiredRolesForPath(pathname: string, method: string): PathPolicy {
  const matched = findRouteRule(pathname, method);
  if (matched) {
    return {
      allowed: [...matched.allowedRoles],
      redirectTo: matched.redirectTo,
      isPublic: Boolean(matched.isPublic),
      resourceKey: matched.resourceKey,
      deniedByDefault: false,
    };
  }

  return {
    allowed: [],
    redirectTo: pathname.startsWith("/api") ? undefined : "/pos",
    isPublic: false,
    resourceKey: pathname.startsWith("/api") ? "api.unknown" : "page.unknown",
    deniedByDefault: true,
  };
}
