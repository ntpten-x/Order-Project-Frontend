export type SupportedRoleName = "Admin" | "Manager" | "Employee";

export type ToppingGroupCapabilityAction = "access" | "view" | "create" | "update" | "delete";

export type ToppingGroupCapability = {
    resourceKey: string;
    title: string;
    description: string;
    action: ToppingGroupCapabilityAction;
    recommendedRoles: SupportedRoleName[];
    securityLevel: "core" | "sensitive" | "governance";
};

export const TOPPING_GROUP_CAPABILITIES: ToppingGroupCapability[] = [
    {
        resourceKey: "topping_group.page",
        title: "Open topping-group workspace",
        description: "Open the topping-group catalog page and review grouping strategy for toppings.",
        action: "view",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "core",
    },
    {
        resourceKey: "topping_group.search.feature",
        title: "Search topping groups",
        description: "Search topping-group names from the catalog page to find a group quickly.",
        action: "view",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "core",
    },
    {
        resourceKey: "topping_group.filter.feature",
        title: "Filter and sort topping groups",
        description: "Filter by active status and sort topping groups for branch review.",
        action: "view",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "core",
    },
    {
        resourceKey: "topping_group.manager.feature",
        title: "Open topping-group manager workspace",
        description: "Open add and edit workspace for topping-group governance and branch catalog operations.",
        action: "access",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "topping_group.create.feature",
        title: "Create topping group",
        description: "Create a new topping group for product and topping organization.",
        action: "create",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "topping_group.edit.feature",
        title: "Edit topping group details",
        description: "Rename a topping group without deleting its historical references.",
        action: "update",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "topping_group.status.feature",
        title: "Toggle topping-group active status",
        description: "Enable or disable a topping group from product and topping setup flows.",
        action: "update",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "topping_group.delete.feature",
        title: "Delete topping group",
        description: "Permanently delete an unused topping group when it is no longer referenced.",
        action: "delete",
        recommendedRoles: ["Admin"],
        securityLevel: "governance",
    },
];

export const TOPPING_GROUP_ROLE_BLUEPRINT: Array<{
    roleName: SupportedRoleName;
    title: string;
    summary: string;
    allowed: string[];
    denied: string[];
}> = [
    {
        roleName: "Admin",
        title: "Topping Group Governor",
        summary: "Owns full topping-group governance including create, rename, status control, and deletion.",
        allowed: [
            "Open topping-group workspace and review the full catalog",
            "Search, filter, open manager workspace, create, edit, and toggle active status",
            "Delete obsolete topping groups when they are no longer referenced",
        ],
        denied: [],
    },
    {
        roleName: "Manager",
        title: "Branch Group Operator",
        summary: "Maintains topping-group master data for the branch but should not permanently remove records.",
        allowed: [
            "Open topping-group workspace and review the full catalog",
            "Search, filter, open manager workspace, create, edit, and toggle active status",
        ],
        denied: [
            "Delete topping-group records",
        ],
    },
    {
        roleName: "Employee",
        title: "Read-only Group Viewer",
        summary: "Can inspect topping groups for sales operations but cannot modify the grouping catalog.",
        allowed: [
            "Open topping-group workspace",
            "Search and filter topping groups",
        ],
        denied: [
            "Open manager workspace",
            "Create, edit, toggle status, or delete topping groups",
        ],
    },
];

export function isToppingGroupCapabilityResource(resourceKey: string): boolean {
    return resourceKey === "topping_group.page" || resourceKey.startsWith("topping_group.");
}

export function getToppingGroupCapability(resourceKey: string): ToppingGroupCapability | undefined {
    return TOPPING_GROUP_CAPABILITIES.find((item) => item.resourceKey === resourceKey);
}
