export type SupportedRoleName = "Admin" | "Manager" | "Employee";

export type ShiftHistoryCapabilityAction = "access" | "view";

export type ShiftHistoryCapability = {
    resourceKey: string;
    title: string;
    description: string;
    action: ShiftHistoryCapabilityAction;
    recommendedRoles: SupportedRoleName[];
    securityLevel: "core" | "sensitive" | "governance";
};

export const SHIFT_HISTORY_CAPABILITIES: ShiftHistoryCapability[] = [
    {
        resourceKey: "shift_history.page",
        title: "Open shift-history workspace",
        description: "Open the shift-history page and review timeline records that match the actor data scope.",
        action: "view",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "core",
    },
    {
        resourceKey: "shift_history.search.feature",
        title: "Search shift history",
        description: "Search shift records by shift id or operator identity within the allowed scope.",
        action: "view",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "core",
    },
    {
        resourceKey: "shift_history.filter.feature",
        title: "Filter and sort shift history",
        description: "Filter shift history by status, date range, and sort order for operational review.",
        action: "view",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "core",
    },
    {
        resourceKey: "shift_history.stats.feature",
        title: "View branch shift stats",
        description: "See shift counters and branch-level shift aggregates above the history list.",
        action: "view",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "shift_history.summary.feature",
        title: "Open shift summary",
        description: "Open the detailed shift summary modal with sales, category, and performance evidence.",
        action: "access",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "shift_history.financials.feature",
        title: "View shift financial amounts",
        description: "See start cash, expected amount, counted cash, and variance values in history cards.",
        action: "view",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "governance",
    },
];

export const SHIFT_HISTORY_ROLE_BLUEPRINT: Array<{
    roleName: SupportedRoleName;
    title: string;
    summary: string;
    allowed: string[];
    denied: string[];
}> = [
    {
        roleName: "Admin",
        title: "Shift Audit Governor",
        summary: "Owns shift-history review across the branch, including branch aggregates, cash evidence, and shift summaries.",
        allowed: [
            "Open shift-history workspace",
            "Search and filter all branch shifts",
            "View branch stats, financial amounts, and detailed shift summary",
        ],
        denied: [],
    },
    {
        roleName: "Manager",
        title: "Shift Operations Reviewer",
        summary: "Reviews branch shift execution and cash evidence without broader system-administration privileges.",
        allowed: [
            "Open shift-history workspace",
            "Search and filter all branch shifts",
            "View branch stats, financial amounts, and detailed shift summary",
        ],
        denied: [],
    },
    {
        roleName: "Employee",
        title: "Own Shift Timeline Viewer",
        summary: "Can review only their own shift timeline for operational follow-up but cannot inspect branch cash aggregates or summaries.",
        allowed: [
            "Open shift-history workspace",
            "Search and filter only shifts within own scope",
        ],
        denied: [
            "View branch shift stats",
            "View shift financial amounts",
            "Open shift summary",
        ],
    },
];

export function isShiftHistoryCapabilityResource(resourceKey: string): boolean {
    return resourceKey === "shift_history.page" || resourceKey.startsWith("shift_history.");
}

export function getShiftHistoryCapability(resourceKey: string): ShiftHistoryCapability | undefined {
    return SHIFT_HISTORY_CAPABILITIES.find((item) => item.resourceKey === resourceKey);
}
