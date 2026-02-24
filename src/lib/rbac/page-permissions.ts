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
    { prefix: "/Health-System", requirement: { resourceKey: "health_system.page", action: "view" } },

    // POS settings: split add/edit/manage by permission.
    { prefix: "/pos/settings/payment-accounts/manage", requirement: { resourceKey: "payment_accounts.page", action: "update" } },
    { prefix: "/pos/settings/payment-accounts/add", requirement: { resourceKey: "payment_accounts.page", action: "create" } },
    { prefix: "/pos/settings/payment-accounts/edit", requirement: { resourceKey: "payment_accounts.page", action: "update" } },
    { prefix: "/pos/settings/payment-accounts", requirement: { resourceKey: "payment_accounts.page", action: "view" } },
    { prefix: "/pos/settings", requirement: { resourceKey: "shop_profile.page", action: "view" } },
    { prefix: "/pos/category/manager", requirement: { resourceKey: "category.page", action: "update" } },
    { prefix: "/pos/category", requirement: { resourceKey: "category.page", action: "view" } },
    // POS master data: split add vs edit so create-only users can access add page.
    { prefix: "/pos/delivery/manager/add", requirement: { resourceKey: "delivery.page", action: "create" } },
    { prefix: "/pos/delivery/manager/edit", requirement: { resourceKey: "delivery.page", action: "update" } },
    { prefix: "/pos/delivery/manager", requirement: { resourceKey: "delivery.page", action: "update" } },
    { prefix: "/pos/delivery", requirement: { resourceKey: "delivery.page", action: "view" } },
    { prefix: "/pos/discounts/manager/add", requirement: { resourceKey: "discounts.page", action: "create" } },
    { prefix: "/pos/discounts/manager/edit", requirement: { resourceKey: "discounts.page", action: "update" } },
    { prefix: "/pos/discounts/manager", requirement: { resourceKey: "discounts.page", action: "update" } },
    { prefix: "/pos/discounts", requirement: { resourceKey: "discounts.page", action: "view" } },
    { prefix: "/pos/paymentMethod/manager/add", requirement: { resourceKey: "payment_method.page", action: "create" } },
    { prefix: "/pos/paymentMethod/manager/edit", requirement: { resourceKey: "payment_method.page", action: "update" } },
    { prefix: "/pos/paymentMethod/manager", requirement: { resourceKey: "payment_method.page", action: "update" } },
    { prefix: "/pos/paymentMethod", requirement: { resourceKey: "payment_method.page", action: "view" } },
    { prefix: "/pos/qr-code", requirement: { resourceKey: "tables.page", action: "view" } },
    { prefix: "/pos/tables/manager/add", requirement: { resourceKey: "tables.page", action: "create" } },
    { prefix: "/pos/tables/manager/edit", requirement: { resourceKey: "tables.page", action: "update" } },
    { prefix: "/pos/tables/manager", requirement: { resourceKey: "tables.page", action: "update" } },
    { prefix: "/pos/tables", requirement: { resourceKey: "tables.page", action: "view" } },
    { prefix: "/pos/products/manage/add", requirement: { resourceKey: "products.page", action: "create" } },
    { prefix: "/pos/products/manage/edit", requirement: { resourceKey: "products.page", action: "update" } },
    { prefix: "/pos/products/manage", requirement: { resourceKey: "products.page", action: "update" } },
    { prefix: "/pos/productsUnit/manager/add", requirement: { resourceKey: "products_unit.page", action: "create" } },
    { prefix: "/pos/productsUnit/manager/edit", requirement: { resourceKey: "products_unit.page", action: "update" } },
    { prefix: "/pos/productsUnit/manager", requirement: { resourceKey: "products_unit.page", action: "update" } },
    { prefix: "/pos/productsUnit", requirement: { resourceKey: "products_unit.page", action: "view" } },
    { prefix: "/pos/products", requirement: { resourceKey: "products.page", action: "view" } },
    { prefix: "/pos/payments", requirement: { resourceKey: "payments.page", action: "view" } },
    { prefix: "/pos/queue", requirement: { resourceKey: "queue.page", action: "view" } },
    { prefix: "/pos/shiftHistory", requirement: { resourceKey: "shifts.page", action: "view" } },
    { prefix: "/pos/shift", requirement: { resourceKey: "shifts.page", action: "view" } },
    { prefix: "/pos/dashboard", requirement: { resourceKey: "reports.sales.page", action: "view" } },
    { prefix: "/pos/orders", requirement: { resourceKey: "orders.page", action: "view" } },

    // POS channel buying flows: require create permission (view-only users can still see channel lists).
    { prefix: "/pos/channels/takeaway/buying", requirement: { resourceKey: "orders.page", action: "create" } },

    // POS item payment flows: require payment create (prevents deep-linking without permission).
    { prefix: "/pos/items/payment", requirement: { resourceKey: "payments.page", action: "create" } },
    { prefix: "/pos/items/delivery", requirement: { resourceKey: "payments.page", action: "create" } },

    { prefix: "/pos/channels", requirement: { resourceKey: "orders.page", action: "view" } },
    { prefix: "/pos/items", requirement: { resourceKey: "orders.page", action: "view" } },
    { prefix: "/pos/kitchen", requirement: { resourceKey: "orders.page", action: "view" } },
    { prefix: "/pos", requirement: { resourceKey: "orders.page", action: "view" } },

    // Stock: split add vs edit so create-only users can access add page.
    { prefix: "/stock/ingredients/manage/add", requirement: { resourceKey: "stock.ingredients.page", action: "create" } },
    { prefix: "/stock/ingredients/manage/edit", requirement: { resourceKey: "stock.ingredients.page", action: "update" } },
    { prefix: "/stock/ingredients/manage", requirement: { resourceKey: "stock.ingredients.page", action: "update" } },
    { prefix: "/stock/ingredients", requirement: { resourceKey: "stock.ingredients.page", action: "view" } },
    { prefix: "/stock/ingredientsUnit/manage/add", requirement: { resourceKey: "stock.ingredients_unit.page", action: "create" } },
    { prefix: "/stock/ingredientsUnit/manage/edit", requirement: { resourceKey: "stock.ingredients_unit.page", action: "update" } },
    { prefix: "/stock/ingredientsUnit/manage", requirement: { resourceKey: "stock.ingredients_unit.page", action: "update" } },
    { prefix: "/stock/ingredientsUnit", requirement: { resourceKey: "stock.ingredients_unit.page", action: "view" } },
    { prefix: "/stock/history", requirement: { resourceKey: "stock.orders.page", action: "view" } },
    { prefix: "/stock/buying", requirement: { resourceKey: "stock.orders.page", action: "update" } },
    { prefix: "/stock/items", requirement: { resourceKey: "stock.orders.page", action: "view" } },
    { prefix: "/stock", requirement: { resourceKey: "stock.orders.page", action: "view" } },
    { prefix: "/", requirement: { resourceKey: "menu.main.home", action: "view" } },
];

export function inferPermissionFromPath(pathname: string): PermissionRequirement | undefined {
    for (const rule of PAGE_PERMISSION_MAP) {
        if (pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`)) {
            return rule.requirement;
        }
    }
    return undefined;
}
