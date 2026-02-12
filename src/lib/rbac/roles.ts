export type Role = "Admin" | "Manager" | "Employee";

export const ALL_ROLES: Role[] = ["Admin", "Manager", "Employee"];

export function asRole(value: unknown): Role | null {
  const raw = String(value ?? "").trim().toLowerCase();
  if (!raw) return null;
  if (raw === "admin") return "Admin";
  if (raw === "manager") return "Manager";
  if (raw === "employee") return "Employee";
  return null;
}

export function isRoleAllowed(role: Role, allowed: readonly Role[]): boolean {
  return allowed.includes(role) || role === "Admin";
}
