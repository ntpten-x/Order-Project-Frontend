export type SupportedRoleName = "Admin" | "Manager" | "Employee";

export type TablesCapabilityAction = "access" | "view" | "create" | "update" | "delete";

export type TablesCapability = {
    resourceKey: string;
    title: string;
    description: string;
    action: TablesCapabilityAction;
    recommendedRoles: SupportedRoleName[];
    securityLevel: "core" | "sensitive" | "governance";
};

export const TABLES_CAPABILITIES: TablesCapability[] = [
    {
        resourceKey: "tables.page",
        title: "Open tables workspace",
        description: "Open the table catalog page and review dine-in table coverage for the branch.",
        action: "view",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "core",
    },
    {
        resourceKey: "tables.search.feature",
        title: "Search tables",
        description: "Search tables by name to find the table used in the branch floor plan.",
        action: "view",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "core",
    },
    {
        resourceKey: "tables.filter.feature",
        title: "Filter and sort tables",
        description: "Filter by active state or table status and sort the table list for operations review.",
        action: "view",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "core",
    },
    {
        resourceKey: "tables.manager.feature",
        title: "Open table manager workspace",
        description: "Open add and edit workspace for table master data and table governance.",
        action: "access",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "tables.create.feature",
        title: "Create table",
        description: "Create a new table record for dine-in ordering and branch floor layout.",
        action: "create",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "tables.edit.feature",
        title: "Edit table details",
        description: "Rename a table and adjust its operational status in the master table record.",
        action: "update",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "tables.status.feature",
        title: "Toggle table active status",
        description: "Enable or disable a table from POS selection without deleting the master record.",
        action: "update",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "tables.delete.feature",
        title: "Delete table",
        description: "Permanently delete an unused table from the branch table catalog.",
        action: "delete",
        recommendedRoles: ["Admin"],
        securityLevel: "governance",
    },
];

export const TABLES_ROLE_BLUEPRINT: Array<{
    roleName: SupportedRoleName;
    title: string;
    summary: string;
    allowed: string[];
    denied: string[];
}> = [
    {
        roleName: "Admin",
        title: "Floor Plan Governor",
        summary: "Owns full table master data governance including creation, edits, status control, and deletion.",
        allowed: [
            "Open tables workspace and review the full table catalog",
            "Search, filter, open manager workspace, create, edit, and toggle active status",
            "Delete obsolete table records when branch layout changes",
        ],
        denied: [],
    },
    {
        roleName: "Manager",
        title: "Branch Floor Operator",
        summary: "Operates branch table master data for daily use but should not permanently remove table records.",
        allowed: [
            "Open tables workspace and review the full table catalog",
            "Search, filter, open manager workspace, create, edit, and toggle active status",
        ],
        denied: [
            "Delete table records",
        ],
    },
    {
        roleName: "Employee",
        title: "Read-only Table Viewer",
        summary: "Can inspect branch tables for dine-in operations but cannot modify the master table layout.",
        allowed: [
            "Open tables workspace",
            "Search and filter tables",
        ],
        denied: [
            "Open manager workspace",
            "Create, edit, toggle active status, or delete tables",
        ],
    },
];

export function isTablesCapabilityResource(resourceKey: string): boolean {
    return resourceKey === "tables.page" || resourceKey.startsWith("tables.");
}

export function getTablesCapability(resourceKey: string): TablesCapability | undefined {
    return TABLES_CAPABILITIES.find((item) => item.resourceKey === resourceKey);
}
