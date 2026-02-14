# Permission Matrix (Source of Truth)

This project now uses a centralized route permission matrix:

- Matrix file: `src/lib/rbac/permission-matrix.ts`
- Policy resolver: `src/lib/rbac/policy.ts`
- Enforcement point: `src/middleware.ts`

## Principles

1. RBAC first: each route rule binds to explicit allowed roles.
2. Central matrix: all route-level permission rules live in one place.
3. Deny-by-default: if a route has no matching rule, access is denied.
4. Single policy layer: middleware resolves permissions only via policy resolver.

## How to add a route permission

1. Add or update a rule in `PERMISSION_ROUTE_MATRIX`.
2. Put specific rules before broad prefix rules.
3. Prefer method-specific rules for API write operations.
4. Do not rely on fallback allow behavior.
