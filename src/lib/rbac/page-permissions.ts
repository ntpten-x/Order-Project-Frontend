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
    { prefix: "/print-setting", requirement: { resourceKey: "print_settings.page", action: "view" } },

    // POS settings: split settings landing, manager, add, and edit by capability.
    { prefix: "/pos/settings/payment-accounts/manage", requirement: { resourceKey: "payment_accounts.manager.feature", action: "access" } },
    { prefix: "/pos/settings/payment-accounts/add", requirement: { resourceKey: "payment_accounts.create.feature", action: "create" } },
    { prefix: "/pos/settings/payment-accounts/edit", requirement: { resourceKey: "payment_accounts.edit.feature", action: "update" } },
    { prefix: "/pos/settings/payment-accounts", requirement: { resourceKey: "payment_accounts.page", action: "view" } },
    { prefix: "/pos/settings", requirement: { resourceKey: "pos_settings.page", action: "view" } },
    { prefix: "/pos/category/manager/add", requirement: { resourceKey: "category.create.feature", action: "create" } },
    { prefix: "/pos/category/manager/edit", requirement: { resourceKey: "category.manager.feature", action: "access" } },
    { prefix: "/pos/category/manager", requirement: { resourceKey: "category.manager.feature", action: "access" } },
    { prefix: "/pos/category", requirement: { resourceKey: "category.page", action: "view" } },
    // POS master data: split add vs edit so create-only users can access add page.
    { prefix: "/pos/delivery/manager/add", requirement: { resourceKey: "delivery.create.feature", action: "create" } },
    { prefix: "/pos/delivery/manager/edit", requirement: { resourceKey: "delivery.manager.feature", action: "access" } },
    { prefix: "/pos/delivery/manager", requirement: { resourceKey: "delivery.manager.feature", action: "access" } },
    { prefix: "/pos/delivery", requirement: { resourceKey: "delivery.page", action: "view" } },
    { prefix: "/pos/discounts/manager/add", requirement: { resourceKey: "discounts.create.feature", action: "create" } },
    { prefix: "/pos/discounts/manager/edit", requirement: { resourceKey: "discounts.manager.feature", action: "access" } },
    { prefix: "/pos/discounts/manager", requirement: { resourceKey: "discounts.manager.feature", action: "access" } },
    { prefix: "/pos/discounts", requirement: { resourceKey: "discounts.page", action: "view" } },
    { prefix: "/pos/paymentMethod/manager/add", requirement: { resourceKey: "payment_method.create.feature", action: "create" } },
    { prefix: "/pos/paymentMethod/manager/edit", requirement: { resourceKey: "payment_method.manager.feature", action: "access" } },
    { prefix: "/pos/paymentMethod/manager", requirement: { resourceKey: "payment_method.manager.feature", action: "access" } },
    { prefix: "/pos/paymentMethod", requirement: { resourceKey: "payment_method.page", action: "view" } },
    { prefix: "/pos/qr-code", requirement: { resourceKey: "qr_code.page", action: "view" } },
    { prefix: "/pos/tables/manager/add", requirement: { resourceKey: "tables.create.feature", action: "create" } },
    { prefix: "/pos/tables/manager/edit", requirement: { resourceKey: "tables.manager.feature", action: "access" } },
    { prefix: "/pos/tables/manager", requirement: { resourceKey: "tables.manager.feature", action: "access" } },
    { prefix: "/pos/tables", requirement: { resourceKey: "tables.page", action: "view" } },
    { prefix: "/pos/products/manage/add", requirement: { resourceKey: "products.create.feature", action: "create" } },
    { prefix: "/pos/products/manage/edit", requirement: { resourceKey: "products.manager.feature", action: "access" } },
    { prefix: "/pos/products/manage", requirement: { resourceKey: "products.manager.feature", action: "access" } },
    { prefix: "/pos/productsUnit/manager/add", requirement: { resourceKey: "products_unit.create.feature", action: "create" } },
    { prefix: "/pos/productsUnit/manager/edit", requirement: { resourceKey: "products_unit.manager.feature", action: "access" } },
    { prefix: "/pos/productsUnit/manager", requirement: { resourceKey: "products_unit.manager.feature", action: "access" } },
    { prefix: "/pos/productsUnit", requirement: { resourceKey: "products_unit.page", action: "view" } },
    { prefix: "/pos/topping/manager/add", requirement: { resourceKey: "topping.create.feature", action: "create" } },
    { prefix: "/pos/topping/manager/edit", requirement: { resourceKey: "topping.manager.feature", action: "access" } },
    { prefix: "/pos/topping/manager", requirement: { resourceKey: "topping.manager.feature", action: "access" } },
    { prefix: "/pos/toppingGroup/manager/add", requirement: { resourceKey: "topping_group.create.feature", action: "create" } },
    { prefix: "/pos/toppingGroup/manager/edit", requirement: { resourceKey: "topping_group.manager.feature", action: "access" } },
    { prefix: "/pos/toppingGroup/manager", requirement: { resourceKey: "topping_group.manager.feature", action: "access" } },
    { prefix: "/pos/toppingGroup", requirement: { resourceKey: "topping_group.page", action: "view" } },
    { prefix: "/pos/topping", requirement: { resourceKey: "topping.page", action: "view" } },
    { prefix: "/pos/products", requirement: { resourceKey: "products.page", action: "view" } },
    { prefix: "/pos/payments", requirement: { resourceKey: "payments.page", action: "view" } },
    { prefix: "/pos/shiftHistory", requirement: { resourceKey: "shift_history.page", action: "view" } },
    { prefix: "/pos/shift", requirement: { resourceKey: "shifts.page", action: "view" } },
    { prefix: "/pos/dashboard", requirement: { resourceKey: "reports.sales.page", action: "view" } },
    { prefix: "/pos/list", requirement: { resourceKey: "orders.serving_board.feature", action: "view" } },
    { prefix: "/pos/orders", requirement: { resourceKey: "orders.page", action: "view" } },

    // POS channel buying flows: channel workspace is visible, but order creation is separated.
    { prefix: "/pos/channels/takeaway/buying", requirement: { resourceKey: "orders.channel_create.feature", action: "create" } },

    // POS item payment flows: require checkout capability to prevent deep-linking without settlement permission.
    { prefix: "/pos/items/payment", requirement: { resourceKey: "payments.checkout.feature", action: "create" } },
    { prefix: "/pos/items/delivery", requirement: { resourceKey: "payments.checkout.feature", action: "create" } },

    { prefix: "/pos/channels", requirement: { resourceKey: "orders.channels.feature", action: "view" } },
    { prefix: "/pos/items", requirement: { resourceKey: "orders.page", action: "view" } },
    { prefix: "/pos", requirement: { resourceKey: "orders.channels.feature", action: "view" } },

    // Stock: split add vs edit so create-only users can access add page.
    { prefix: "/stock/ingredients/manage/add", requirement: { resourceKey: "stock.ingredients.page", action: "create" } },
    { prefix: "/stock/ingredients/manage/edit", requirement: { resourceKey: "stock.ingredients.page", action: "update" } },
    { prefix: "/stock/ingredients/manage", requirement: { resourceKey: "stock.ingredients.page", action: "update" } },
    { prefix: "/stock/ingredients", requirement: { resourceKey: "stock.ingredients.page", action: "view" } },
    { prefix: "/stock/category/manage/add", requirement: { resourceKey: "stock.category.page", action: "create" } },
    { prefix: "/stock/category/manage/edit", requirement: { resourceKey: "stock.category.page", action: "update" } },
    { prefix: "/stock/category/manage", requirement: { resourceKey: "stock.category.page", action: "update" } },
    { prefix: "/stock/category", requirement: { resourceKey: "stock.category.page", action: "view" } },
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
    if (pathname.startsWith("/pos/dashboard/")) {
        return { resourceKey: "reports.sales.order_detail.feature", action: "access" };
    }

    if (pathname.startsWith("/pos/channels/dine-in/")) {
        return { resourceKey: "orders.channel_create.feature", action: "create" };
    }

    if (pathname.startsWith("/pos/channels/delivery/")) {
        return { resourceKey: "orders.channel_create.feature", action: "create" };
    }

    if (pathname.startsWith("/pos/orders/")) {
        return { resourceKey: "orders.detail.feature", action: "access" };
    }

    for (const rule of PAGE_PERMISSION_MAP) {
        if (pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`)) {
            return rule.requirement;
        }
    }
    return undefined;
}
