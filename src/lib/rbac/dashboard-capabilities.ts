export type SupportedRoleName = "Admin" | "Manager" | "Employee";

export type DashboardCapabilityAction = "access" | "view" | "update";

export type DashboardCapability = {
    resourceKey: string;
    title: string;
    description: string;
    action: DashboardCapabilityAction;
    recommendedRoles: SupportedRoleName[];
    securityLevel: "core" | "sensitive" | "governance";
};

export const DASHBOARD_CAPABILITIES: DashboardCapability[] = [
    {
        resourceKey: "reports.sales.page",
        title: "Open sales dashboard",
        description: "Open the dashboard workspace and load the branch sales overview.",
        action: "view",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "core",
    },
    {
        resourceKey: "reports.sales.summary.feature",
        title: "View KPI summary",
        description: "See total sales, total orders, average order value, discount total, and daily sales table.",
        action: "view",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "core",
    },
    {
        resourceKey: "reports.sales.filters.feature",
        title: "Use advanced date filters",
        description: "Switch to custom date-time range and inspect dashboard data outside standard presets.",
        action: "view",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "reports.sales.channels.feature",
        title: "View channel and payment mix",
        description: "See dine-in, takeaway, delivery, cash, and QR breakdown for the selected period.",
        action: "view",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "reports.sales.top_items.feature",
        title: "View top selling products",
        description: "See top products by quantity and revenue for merchandising and demand review.",
        action: "view",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "core",
    },
    {
        resourceKey: "reports.sales.recent_orders.feature",
        title: "View recent orders feed",
        description: "Inspect the latest paid or completed orders directly from the dashboard.",
        action: "view",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "reports.sales.order_detail.feature",
        title: "Open order detail from dashboard",
        description: "Open dashboard order detail pages and retrieve order-level sales evidence.",
        action: "access",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "reports.sales.export.feature",
        title: "Export or print dashboard report",
        description: "Export XLSX or print A4 and receipt-format dashboard reports.",
        action: "update",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "governance",
    },
    {
        resourceKey: "reports.sales.receipt.feature",
        title: "Print receipt from order detail",
        description: "Print a receipt copy from the dashboard order detail page.",
        action: "update",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "governance",
    },
];

export const DASHBOARD_ROLE_BLUEPRINT: Array<{
    roleName: SupportedRoleName;
    title: string;
    summary: string;
    allowed: string[];
    denied: string[];
}> = [
    {
        roleName: "Admin",
        title: "Sales Governance Owner",
        summary: "Owns branch performance review, operational follow-up, export, and receipt evidence from the dashboard.",
        allowed: [
            "Open dashboard and review KPI summary",
            "Use preset and advanced date filters",
            "See channel mix, top items, and recent orders",
            "Open order detail, export reports, and print receipts",
        ],
        denied: [],
    },
    {
        roleName: "Manager",
        title: "Branch Performance Operator",
        summary: "Runs branch-level performance review and operational follow-up without broader administration duties.",
        allowed: [
            "Open dashboard and review KPI summary",
            "Use preset and advanced date filters",
            "See channel mix, top items, and recent orders",
            "Open order detail, export reports, and print receipts",
        ],
        denied: [],
    },
    {
        roleName: "Employee",
        title: "Limited Performance Viewer",
        summary: "Can monitor headline performance and top products but cannot inspect order-level or sensitive revenue mix details.",
        allowed: [
            "Open dashboard",
            "View KPI summary and top selling products",
        ],
        denied: [
            "Use advanced date filters",
            "View channel mix and recent orders",
            "Open order detail, export reports, or print receipts",
        ],
    },
];

export function isDashboardCapabilityResource(resourceKey: string): boolean {
    return resourceKey === "reports.sales.page" || resourceKey.startsWith("reports.sales.");
}

export function getDashboardCapability(resourceKey: string): DashboardCapability | undefined {
    return DASHBOARD_CAPABILITIES.find((item) => item.resourceKey === resourceKey);
}
