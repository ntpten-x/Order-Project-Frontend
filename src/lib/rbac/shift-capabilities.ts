export type SupportedRoleName = "Admin" | "Manager" | "Employee";

export type ShiftCapabilityAction = "access" | "view" | "create" | "update";

export type ShiftCapability = {
    resourceKey: string;
    title: string;
    description: string;
    action: ShiftCapabilityAction;
    recommendedRoles: SupportedRoleName[];
    securityLevel: "core" | "sensitive" | "governance";
};

export const SHIFT_CAPABILITIES: ShiftCapability[] = [
    {
        resourceKey: "shifts.page",
        title: "Open current shift workspace",
        description: "Open the current-shift page and review the active shift status for the branch.",
        action: "view",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "core",
    },
    {
        resourceKey: "shifts.open.feature",
        title: "Open shift",
        description: "Start a new working shift with opening cash for branch operations.",
        action: "create",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "core",
    },
    {
        resourceKey: "shifts.close_preview.feature",
        title: "Preview shift close",
        description: "Validate counted cash, pending orders, and expected close variance before confirming shift close.",
        action: "access",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "shifts.close.feature",
        title: "Close shift",
        description: "Confirm closing the active shift after cash reconciliation and pending-order validation.",
        action: "update",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "shifts.summary.feature",
        title: "View shift KPI summary",
        description: "See headline sales, cost, profit, and shift performance summary cards.",
        action: "view",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "core",
    },
    {
        resourceKey: "shifts.financials.feature",
        title: "View cash drawer and payment breakdown",
        description: "See opening cash, expected cash, payment method mix, and cash variance values for the current shift.",
        action: "view",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "governance",
    },
    {
        resourceKey: "shifts.channels.feature",
        title: "View channel sales mix",
        description: "See dine-in, takeaway, delivery, and expected sales distribution for the active shift.",
        action: "view",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "core",
    },
    {
        resourceKey: "shifts.top_products.feature",
        title: "View top products in shift",
        description: "Inspect top-performing products by quantity and revenue during the current shift.",
        action: "view",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "core",
    },
    {
        resourceKey: "shifts.history_nav.feature",
        title: "Navigate to shift history",
        description: "Open shift-history workflow from the current-shift workspace for audit follow-up.",
        action: "view",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "core",
    },
];

export const SHIFT_ROLE_BLUEPRINT: Array<{
    roleName: SupportedRoleName;
    title: string;
    summary: string;
    allowed: string[];
    denied: string[];
}> = [
    {
        roleName: "Admin",
        title: "Shift Operations Governor",
        summary: "Owns live shift operations, cash governance, reconciliation, and operational review across the branch.",
        allowed: [
            "Open and close any current shift",
            "Review KPI summary, channel mix, top products, and cash breakdown",
            "Navigate to shift history for investigation and follow-up",
        ],
        denied: [],
    },
    {
        roleName: "Manager",
        title: "Branch Shift Operator",
        summary: "Runs branch shift operations end-to-end, including reconciliation and live performance monitoring.",
        allowed: [
            "Open and close current shift",
            "Review KPI summary, channel mix, top products, and cash breakdown",
            "Navigate to shift history and supervise shift health",
        ],
        denied: [],
    },
    {
        roleName: "Employee",
        title: "Operational Shift User",
        summary: "Can operate the current shift, open and close their own shift, and monitor non-sensitive live performance, but cash governance remains limited to own-shift context.",
        allowed: [
            "Open shift and close own shift after preview",
            "View KPI summary, channel mix, top products, and shift-history entry point",
        ],
        denied: [
            "View cash drawer and payment breakdown for shifts outside own scope",
        ],
    },
];

export function isShiftCapabilityResource(resourceKey: string): boolean {
    return resourceKey === "shifts.page" || resourceKey.startsWith("shifts.");
}

export function getShiftCapability(resourceKey: string): ShiftCapability | undefined {
    return SHIFT_CAPABILITIES.find((item) => item.resourceKey === resourceKey);
}
