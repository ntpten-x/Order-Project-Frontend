# Permissions System Design (Page + Action + Data Scope)

## 1) Goals
- Define exactly which pages each user can access.
- Define which functions inside each page are allowed (`view`, `create`, `update`, `delete`, `approve`, etc.).
- Define data visibility scope (`none`, `own`, `branch`, `all`).
- Support direct user override without breaking role defaults.
- Keep full audit trail for compliance and rollback.

## 2) Data Model (PostgreSQL)

### 2.1 Core tables
```sql
-- Existing: users(id, roles_id, branch_id, ...)
-- Existing: roles(id, roles_name, ...)

CREATE TABLE resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_key varchar(120) UNIQUE NOT NULL,  -- ex: users.page, orders.page
  resource_name varchar(180) NOT NULL,
  route_pattern varchar(255),                 -- ex: /users, /orders/:id
  resource_type varchar(20) NOT NULL CHECK (resource_type IN ('page','api','menu','feature')),
  parent_id uuid NULL REFERENCES resources(id),
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_key varchar(80) UNIQUE NOT NULL,     -- ex: view, create, update, delete, export, approve
  action_name varchar(120) NOT NULL,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  resource_id uuid NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  action_id uuid NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
  effect varchar(10) NOT NULL CHECK (effect IN ('allow','deny')),
  scope varchar(20) NOT NULL DEFAULT 'none' CHECK (scope IN ('none','own','branch','all')),
  condition_json jsonb NULL,                  -- optional ABAC condition
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(role_id, resource_id, action_id)
);

CREATE TABLE user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_id uuid NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  action_id uuid NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
  effect varchar(10) NOT NULL CHECK (effect IN ('allow','deny')),
  scope varchar(20) NOT NULL DEFAULT 'none' CHECK (scope IN ('none','own','branch','all')),
  condition_json jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, resource_id, action_id)
);

CREATE TABLE permission_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid NOT NULL REFERENCES users(id),
  target_type varchar(10) NOT NULL CHECK (target_type IN ('role','user')),
  target_id uuid NOT NULL,
  action_type varchar(20) NOT NULL,           -- grant, revoke, update_scope, reset
  payload_before jsonb,
  payload_after jsonb,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### 2.2 Resolution rule (important)
- `user_permissions` has higher priority than `role_permissions`.
- `deny` overrides `allow` (deny-first).
- effective scope = max restrictive from matched rules unless explicit user allow is stricter.
- If no rule exists -> deny by default.

## 3) Backend Logic Design

### 3.1 Permission check function
```ts
type CheckInput = {
  userId: string;
  roleId: string;
  resourceKey: string;
  actionKey: string;
  context: { branchId?: string; ownerId?: string };
};

type CheckResult = {
  allowed: boolean;
  scope: "none" | "own" | "branch" | "all";
  reason: string;
};
```

Flow:
1. Resolve `resource_id` and `action_id` from keys.
2. Load user-level and role-level rules.
3. Apply precedence: user > role.
4. Apply deny-first.
5. Return `allowed + scope`.

### 3.2 Middleware in backend
- Add `authorizePermission(resourceKey, actionKey)` middleware.
- Works together with existing `authenticateToken`.
- Attach `req.permission = { allowed, scope }`.
- Return `403` with machine-friendly payload:
```json
{
  "error": "forbidden",
  "resource": "users.page",
  "action": "update",
  "scope": "none"
}
```

### 3.3 Data filtering layer
- Add helper `applyScopeFilter(query, scope, user)`:
  - `own`: `WHERE created_by = :userId`
  - `branch`: `WHERE branch_id = :branchId`
  - `all`: no extra filter
  - `none`: force empty result

### 3.4 Caching
- Cache effective permission in Redis:
  - key: `perm:{userId}:{resourceKey}:{actionKey}`
  - TTL: 5-15 min
- On permission update, publish invalidation event.

## 4) Frontend UX/UI Design

## 4.1 Information architecture
- Left: target selector (User / Role template).
- Center: permission matrix by page/resource.
- Right: summary panel (coverage, warnings, conflict rules, audit state).
- Top actions: Save Draft, Publish, Compare with current, Reset.

## 4.2 Matrix columns
- Page/Resource
- Access page (`canAccess`)
- View data (`view`)
- Create
- Update
- Delete
- Scope selector (`none`, `own`, `branch`, `all`)

## 4.3 UX behaviors
- Toggle `Access=false` auto disables actions.
- Scope defaults:
  - If `view=false`, scope auto `none`.
- Bulk presets:
  - Read-only
  - Branch manager
  - Full access
- Show unsaved changes badge.
- Show conflict banner when explicit deny exists.

## 4.4 API contracts (frontend calls)
- `GET /permissions/resources`
- `GET /permissions/actions`
- `GET /permissions/users/:id/effective`
- `PUT /permissions/users/:id`
- `GET /permissions/roles/:id/effective`
- `PUT /permissions/roles/:id`
- `POST /permissions/simulate`
- `GET /permissions/audits?targetType=user&targetId=...`

## 5) Phased delivery plan

## Phase 1 (1-2 weeks): RBAC baseline
- Keep current role model.
- Add `resources`, `actions`, `role_permissions`.
- Build `authorizePermission` middleware for key routes.
- Deliver read-only matrix UI for roles.

Exit criteria:
- Role-based page/function control works for main modules.

## Phase 2 (1 week): User override
- Add `user_permissions`.
- Add merge logic (user override + deny-first).
- Add user-level UI editing.

Exit criteria:
- Specific user can be granted/revoked without changing role.

## Phase 3 (1-2 weeks): Data scope
- Add scope-aware query filters in services/repositories.
- Connect scope selector in UI.
- Add simulator endpoint (`who can do what with scope preview`).

Exit criteria:
- System enforces page + action + data visibility.

## Phase 4 (1 week): Audit + hardening
- Add `permission_audits` write path.
- Add diff viewer in UI.
- Add cache + invalidation + regression tests.

Exit criteria:
- Changes are auditable, reproducible, and test-covered.

## 6) Testing strategy
- Unit: permission resolution + precedence.
- Integration: middleware + service scope filter.
- E2E: admin modifies permission and verifies blocked/allowed flows.
- Security tests: deny-by-default, privilege escalation attempts.
