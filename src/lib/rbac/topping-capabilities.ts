export type SupportedRoleName = "Admin" | "Manager" | "Employee";

export type ToppingCapabilityAction = "access" | "view" | "create" | "update" | "delete";

export type ToppingCapability = {
    resourceKey: string;
    title: string;
    description: string;
    action: ToppingCapabilityAction;
    recommendedRoles: SupportedRoleName[];
    securityLevel: "core" | "sensitive" | "governance";
};

export const TOPPING_CAPABILITIES: ToppingCapability[] = [
    {
        resourceKey: "topping.page",
        title: "Open topping workspace",
        description: "Open the topping catalog page and review available topping options for the branch.",
        action: "view",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "core",
    },
    {
        resourceKey: "topping.search.feature",
        title: "Search toppings",
        description: "Search topping names from the list page to find a catalog item quickly.",
        action: "view",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "core",
    },
    {
        resourceKey: "topping.filter.feature",
        title: "Filter and sort toppings",
        description: "Filter by status or category and sort the topping catalog for branch review.",
        action: "view",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "core",
    },
    {
        resourceKey: "topping.manager.feature",
        title: "Open topping manager workspace",
        description: "Open add and edit workspace for topping governance and branch catalog operations.",
        action: "access",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "topping.create.feature",
        title: "Create topping",
        description: "Create a new topping record with catalog, pricing, and category/group mapping.",
        action: "create",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "topping.catalog.feature",
        title: "Edit topping catalog",
        description: "Edit topping name, image, categories, and topping-group mapping.",
        action: "update",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "topping.pricing.feature",
        title: "Edit topping pricing",
        description: "Change in-store and delivery pricing for a topping without deleting the record.",
        action: "update",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "topping.status.feature",
        title: "Toggle topping active status",
        description: "Enable or disable a topping from POS selection while keeping the master record.",
        action: "update",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "topping.delete.feature",
        title: "Delete topping",
        description: "Permanently remove an obsolete topping from the branch topping catalog.",
        action: "delete",
        recommendedRoles: ["Admin"],
        securityLevel: "governance",
    },
];

export const TOPPING_ROLE_BLUEPRINT: Array<{
    roleName: SupportedRoleName;
    title: string;
    summary: string;
    allowed: string[];
    denied: string[];
}> = [
    {
        roleName: "Admin",
        title: "Topping Catalog Governor",
        summary: "Owns the full topping catalog lifecycle including create, catalog design, pricing, status control, and deletion.",
        allowed: [
            "Open topping workspace and review the full catalog",
            "Search, filter, open manager workspace, create, edit catalog, edit pricing, and toggle status",
            "Delete obsolete topping records when they are no longer part of the branch offering",
        ],
        denied: [],
    },
    {
        roleName: "Manager",
        title: "Branch Topping Operator",
        summary: "Maintains daily topping catalog quality for the branch but should not permanently delete master records.",
        allowed: [
            "Open topping workspace and review the full catalog",
            "Search, filter, open manager workspace, create toppings, edit catalog, edit pricing, and toggle status",
        ],
        denied: [
            "Delete topping records",
        ],
    },
    {
        roleName: "Employee",
        title: "Read-only Topping Viewer",
        summary: "Can inspect topping availability for sales operations but cannot modify the topping catalog.",
        allowed: [
            "Open topping workspace",
            "Search and filter toppings",
        ],
        denied: [
            "Open manager workspace",
            "Create, edit, change pricing, toggle status, or delete toppings",
        ],
    },
];

export function isToppingCapabilityResource(resourceKey: string): boolean {
    return resourceKey === "topping.page" || resourceKey.startsWith("topping.");
}

export function getToppingCapability(resourceKey: string): ToppingCapability | undefined {
    return TOPPING_CAPABILITIES.find((item) => item.resourceKey === resourceKey);
}
