import type {
    EffectiveRolePermissionRow,
    PermissionAction,
} from "../../types/api/permissions";

type PermissionRequirement = {
    resourceKey: string;
    action?: PermissionAction;
};

type MenuVisibilityRule = {
    explicitAnyOf?: PermissionRequirement[];
    fallbackAnyOf?: PermissionRequirement[];
    defaultVisible?: boolean;
};

type MenuVisibilityContext = {
    rows: EffectiveRolePermissionRow[];
    can: (resourceKey: string, action?: PermissionAction) => boolean;
    canAny: (checks: Array<{ resourceKey: string; action?: PermissionAction }>) => boolean;
};

export const MENU_VISIBILITY_RULES: Record<string, MenuVisibilityRule> = {
    // Global main navigation
    "menu.main.home": {
        explicitAnyOf: [{ resourceKey: "menu.main.home", action: "view" }],
        defaultVisible: true,
    },
    "menu.main.stock": {
        explicitAnyOf: [{ resourceKey: "menu.main.stock", action: "view" }],
        fallbackAnyOf: [{ resourceKey: "stock.orders.page", action: "view" }],
    },
    "menu.main.orders": {
        explicitAnyOf: [{ resourceKey: "menu.main.orders", action: "view" }],
        fallbackAnyOf: [{ resourceKey: "stock.orders.page", action: "view" }],
    },
    "menu.main.users": {
        explicitAnyOf: [{ resourceKey: "menu.main.users", action: "view" }],
        fallbackAnyOf: [{ resourceKey: "users.page", action: "view" }],
    },

    // Landing modules
    "menu.module.pos": {
        explicitAnyOf: [{ resourceKey: "menu.module.pos", action: "view" }],
        fallbackAnyOf: [
            { resourceKey: "orders.page", action: "view" },
            { resourceKey: "products.page", action: "view" },
            { resourceKey: "reports.sales.page", action: "view" },
        ],
    },
    "menu.module.stock": {
        explicitAnyOf: [{ resourceKey: "menu.module.stock", action: "view" }],
        fallbackAnyOf: [
            { resourceKey: "stock.orders.page", action: "view" },
            { resourceKey: "stock.ingredients.page", action: "view" },
            { resourceKey: "stock.ingredients_unit.page", action: "view" },
        ],
    },
    "menu.module.users": {
        explicitAnyOf: [{ resourceKey: "menu.module.users", action: "view" }],
        fallbackAnyOf: [{ resourceKey: "users.page", action: "view" }],
    },
    "menu.module.branch": {
        explicitAnyOf: [{ resourceKey: "menu.module.branch", action: "view" }],
        fallbackAnyOf: [{ resourceKey: "branches.page", action: "view" }],
    },
    "menu.module.audit": {
        explicitAnyOf: [{ resourceKey: "menu.module.audit", action: "view" }],
        fallbackAnyOf: [{ resourceKey: "audit.page", action: "view" }],
    },

    // POS bottom navigation
    "menu.pos.home": {
        explicitAnyOf: [{ resourceKey: "menu.pos.home", action: "view" }],
        defaultVisible: true,
    },
    "menu.pos.sell": {
        explicitAnyOf: [{ resourceKey: "menu.pos.sell", action: "view" }],
        fallbackAnyOf: [{ resourceKey: "orders.page", action: "view" }],
    },
    "menu.pos.orders": {
        explicitAnyOf: [{ resourceKey: "menu.pos.orders", action: "view" }],
        fallbackAnyOf: [{ resourceKey: "orders.page", action: "view" }],
    },
    "menu.pos.kitchen": {
        explicitAnyOf: [{ resourceKey: "menu.pos.kitchen", action: "view" }],
        fallbackAnyOf: [{ resourceKey: "orders.page", action: "view" }],
    },
    "menu.pos.shift": {
        explicitAnyOf: [{ resourceKey: "menu.pos.shift", action: "view" }],
        fallbackAnyOf: [
            { resourceKey: "shifts.page", action: "view" },
            { resourceKey: "shifts.page", action: "create" },
            { resourceKey: "shifts.page", action: "update" },
        ],
    },
    "menu.pos.shiftHistory": {
        explicitAnyOf: [{ resourceKey: "menu.pos.shiftHistory", action: "view" }],
        fallbackAnyOf: [
            { resourceKey: "shifts.page", action: "view" },
            { resourceKey: "shifts.page", action: "create" },
            { resourceKey: "shifts.page", action: "update" },
        ],
    },
    "menu.pos.dashboard": {
        explicitAnyOf: [{ resourceKey: "menu.pos.dashboard", action: "view" }],
        fallbackAnyOf: [{ resourceKey: "reports.sales.page", action: "view" }],
    },
    "menu.pos.tables": {
        explicitAnyOf: [{ resourceKey: "menu.pos.tables", action: "view" }],
        fallbackAnyOf: [{ resourceKey: "tables.page", action: "view" }],
    },
    "menu.pos.delivery": {
        explicitAnyOf: [{ resourceKey: "menu.pos.delivery", action: "view" }],
        fallbackAnyOf: [{ resourceKey: "delivery.page", action: "view" }],
    },
    "menu.pos.category": {
        explicitAnyOf: [{ resourceKey: "menu.pos.category", action: "view" }],
        fallbackAnyOf: [{ resourceKey: "category.page", action: "view" }],
    },
    "menu.pos.products": {
        explicitAnyOf: [{ resourceKey: "menu.pos.products", action: "view" }],
        fallbackAnyOf: [{ resourceKey: "products.page", action: "view" }],
    },
    "menu.pos.productsUnit": {
        explicitAnyOf: [{ resourceKey: "menu.pos.productsUnit", action: "view" }],
        fallbackAnyOf: [{ resourceKey: "products.page", action: "view" }],
    },
    "menu.pos.discounts": {
        explicitAnyOf: [{ resourceKey: "menu.pos.discounts", action: "view" }],
        fallbackAnyOf: [{ resourceKey: "discounts.page", action: "view" }],
    },
    "menu.pos.payment": {
        explicitAnyOf: [{ resourceKey: "menu.pos.payment", action: "view" }],
        fallbackAnyOf: [{ resourceKey: "payment_method.page", action: "view" }],
    },
    "menu.pos.settings": {
        explicitAnyOf: [{ resourceKey: "menu.pos.settings", action: "view" }],
        fallbackAnyOf: [
            { resourceKey: "payment_accounts.page", action: "view" },
            { resourceKey: "shop_profile.page", action: "view" },
            { resourceKey: "shop_profile.page", action: "update" },
        ],
    },

    // Stock bottom navigation
    "menu.stock.home": {
        explicitAnyOf: [{ resourceKey: "menu.stock.home", action: "view" }],
        defaultVisible: true,
    },
    "menu.stock.buying": {
        explicitAnyOf: [{ resourceKey: "menu.stock.buying", action: "view" }],
        fallbackAnyOf: [{ resourceKey: "stock.orders.page", action: "view" }],
    },
    "menu.stock.orders": {
        explicitAnyOf: [{ resourceKey: "menu.stock.orders", action: "view" }],
        fallbackAnyOf: [{ resourceKey: "stock.orders.page", action: "view" }],
    },
    "menu.stock.history": {
        explicitAnyOf: [{ resourceKey: "menu.stock.history", action: "view" }],
        fallbackAnyOf: [{ resourceKey: "stock.orders.page", action: "view" }],
    },
    "menu.stock.ingredients": {
        explicitAnyOf: [{ resourceKey: "menu.stock.ingredients", action: "view" }],
        fallbackAnyOf: [{ resourceKey: "stock.ingredients.page", action: "view" }],
    },
    "menu.stock.ingredientsUnit": {
        explicitAnyOf: [{ resourceKey: "menu.stock.ingredientsUnit", action: "view" }],
        fallbackAnyOf: [{ resourceKey: "stock.ingredients_unit.page", action: "view" }],
    },

    // Section bottom navigation (single button)
    "menu.users.home": {
        explicitAnyOf: [{ resourceKey: "menu.users.home", action: "view" }],
        defaultVisible: true,
    },
    "menu.branch.home": {
        explicitAnyOf: [{ resourceKey: "menu.branch.home", action: "view" }],
        defaultVisible: true,
    },
};

function hasAnyRow(rows: EffectiveRolePermissionRow[], checks: PermissionRequirement[]): boolean {
    const rowSet = new Set(rows.map((row) => row.resourceKey));
    return checks.some((check) => rowSet.has(check.resourceKey));
}

export function canViewMenu(menuKey: string, context: MenuVisibilityContext): boolean {
    const rule = MENU_VISIBILITY_RULES[menuKey];
    if (!rule) return true;

    const explicitAnyOf = rule.explicitAnyOf ?? [];
    if (explicitAnyOf.length > 0 && hasAnyRow(context.rows, explicitAnyOf)) {
        return context.canAny(explicitAnyOf);
    }

    if (rule.fallbackAnyOf && rule.fallbackAnyOf.length > 0) {
        return context.canAny(rule.fallbackAnyOf);
    }

    return rule.defaultVisible ?? true;
}
