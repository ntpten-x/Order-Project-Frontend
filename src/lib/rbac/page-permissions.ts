import type { PermissionAction } from "../../types/api/permissions";

export type PermissionRequirement = {
    resourceKey: string;
    action?: PermissionAction;
};

export const PAGE_PERMISSION_MAP: Array<{ prefix: string; requirement: PermissionRequirement }> = [
    { prefix: "/users/permissions", requirement: { resourceKey: "permissions.page", action: "view" } },
    { prefix: "/users/manage", requirement: { resourceKey: "users.page", action: "update" } },
    { prefix: "/users", requirement: { resourceKey: "users.page", action: "view" } },
    { prefix: "/branch/manager", requirement: { resourceKey: "branches.page", action: "update" } },
    { prefix: "/branch", requirement: { resourceKey: "branches.page", action: "view" } },
    { prefix: "/audit", requirement: { resourceKey: "audit.page", action: "view" } },

    { prefix: "/pos/settings/payment-accounts", requirement: { resourceKey: "payment_accounts.page", action: "view" } },
    { prefix: "/pos/settings", requirement: { resourceKey: "shop_profile.page", action: "view" } },
    { prefix: "/pos/category/manager", requirement: { resourceKey: "category.page", action: "update" } },
    { prefix: "/pos/category", requirement: { resourceKey: "category.page", action: "view" } },
    { prefix: "/pos/delivery/manager", requirement: { resourceKey: "delivery.page", action: "update" } },
    { prefix: "/pos/delivery", requirement: { resourceKey: "delivery.page", action: "view" } },
    { prefix: "/pos/discounts/manager", requirement: { resourceKey: "discounts.page", action: "update" } },
    { prefix: "/pos/discounts", requirement: { resourceKey: "discounts.page", action: "view" } },
    { prefix: "/pos/paymentMethod/manager", requirement: { resourceKey: "payment_method.page", action: "update" } },
    { prefix: "/pos/paymentMethod", requirement: { resourceKey: "payment_method.page", action: "view" } },
    { prefix: "/pos/tables/manager", requirement: { resourceKey: "tables.page", action: "update" } },
    { prefix: "/pos/tables", requirement: { resourceKey: "tables.page", action: "view" } },
    { prefix: "/pos/products/manage", requirement: { resourceKey: "products.page", action: "update" } },
    { prefix: "/pos/productsUnit/manager", requirement: { resourceKey: "products.page", action: "update" } },
    { prefix: "/pos/productsUnit", requirement: { resourceKey: "products.page", action: "view" } },
    { prefix: "/pos/products", requirement: { resourceKey: "products.page", action: "view" } },
    { prefix: "/pos/payments", requirement: { resourceKey: "payments.page", action: "view" } },
    { prefix: "/pos/queue", requirement: { resourceKey: "queue.page", action: "view" } },
    { prefix: "/pos/shiftHistory", requirement: { resourceKey: "shifts.page", action: "view" } },
    { prefix: "/pos/shift", requirement: { resourceKey: "shifts.page", action: "view" } },
    { prefix: "/pos/dashboard", requirement: { resourceKey: "reports.sales.page", action: "view" } },
    { prefix: "/pos/orders", requirement: { resourceKey: "orders.page", action: "view" } },
    { prefix: "/pos/channels", requirement: { resourceKey: "orders.page", action: "view" } },
    { prefix: "/pos/items", requirement: { resourceKey: "orders.page", action: "view" } },
    { prefix: "/pos/kitchen", requirement: { resourceKey: "orders.page", action: "view" } },
    { prefix: "/pos", requirement: { resourceKey: "orders.page", action: "view" } },

    { prefix: "/stock/ingredients/manage", requirement: { resourceKey: "stock.ingredients.page", action: "update" } },
    { prefix: "/stock/ingredients", requirement: { resourceKey: "stock.ingredients.page", action: "view" } },
    { prefix: "/stock/ingredientsUnit/manage", requirement: { resourceKey: "stock.ingredients_unit.page", action: "update" } },
    { prefix: "/stock/ingredientsUnit", requirement: { resourceKey: "stock.ingredients_unit.page", action: "view" } },
    { prefix: "/stock/history", requirement: { resourceKey: "stock.orders.page", action: "view" } },
    { prefix: "/stock/buying", requirement: { resourceKey: "stock.orders.page", action: "update" } },
    { prefix: "/stock/items", requirement: { resourceKey: "stock.orders.page", action: "view" } },
    { prefix: "/stock", requirement: { resourceKey: "stock.orders.page", action: "view" } },
    { prefix: "/", requirement: { resourceKey: "orders.page", action: "view" } },
];

export function inferPermissionFromPath(pathname: string): PermissionRequirement | undefined {
    for (const rule of PAGE_PERMISSION_MAP) {
        if (pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`)) {
            return rule.requirement;
        }
    }
    return undefined;
}
