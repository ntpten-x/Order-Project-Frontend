export type SupportedRoleName = "Admin" | "Manager" | "Employee";

export type OrderWorkflowCapabilityAction = "access" | "view" | "create" | "update";

export type OrderWorkflowCapability = {
    resourceKey: string;
    title: string;
    description: string;
    action: OrderWorkflowCapabilityAction;
    recommendedRoles: SupportedRoleName[];
    securityLevel: "core" | "sensitive" | "governance";
};

export const ORDER_WORKFLOW_CAPABILITIES: OrderWorkflowCapability[] = [
    {
        resourceKey: "orders.page",
        title: "Open order workspace",
        description: "Open the main order workspace and monitor active branch orders.",
        action: "view",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "core",
    },
    {
        resourceKey: "orders.search.feature",
        title: "Search orders",
        description: "Search by order number, table, customer, or delivery reference during live operations.",
        action: "view",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "core",
    },
    {
        resourceKey: "orders.filter.feature",
        title: "Filter and sort order queues",
        description: "Filter by status or channel and sort operational queues without opening raw datasets.",
        action: "view",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "core",
    },
    {
        resourceKey: "orders.summary.feature",
        title: "View order summary and stats",
        description: "Load queue summary, KPI counts, and live order totals used by orders and channels pages.",
        action: "view",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "core",
    },
    {
        resourceKey: "orders.detail.feature",
        title: "Open order detail",
        description: "Open individual order detail and payment preparation workflows for branch orders.",
        action: "access",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "core",
    },
    {
        resourceKey: "orders.channels.feature",
        title: "Open channel workspace",
        description: "Access dine-in, takeaway, and delivery channel workspaces during active service.",
        action: "view",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "core",
    },
    {
        resourceKey: "orders.channel_create.feature",
        title: "Create order from channel",
        description: "Start a new takeaway or delivery order from channel-specific operational flows.",
        action: "create",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "core",
    },
    {
        resourceKey: "orders.serving_board.feature",
        title: "View serving board",
        description: "Open the serving board and inspect preparation and served queues in real time.",
        action: "view",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "core",
    },
    {
        resourceKey: "orders.serving_board_update.feature",
        title: "Update serving board status",
        description: "Mark single items or full batches as served or pending from the serving board.",
        action: "update",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "orders.line_items.feature",
        title: "Manage order items",
        description: "Add items, edit quantity or notes, and remove line items while the order is still active.",
        action: "update",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "orders.item_status.feature",
        title: "Update order item status",
        description: "Cancel or transition individual line items without cancelling the full order.",
        action: "update",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "orders.edit.feature",
        title: "Edit order workflow state",
        description: "Move active orders between pending and waiting-for-payment stages and reopen payment flows for correction.",
        action: "update",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "orders.cancel.feature",
        title: "Cancel full order",
        description: "Cancel the whole order and roll back branch operational capacity such as table availability.",
        action: "access",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "governance",
    },
    {
        resourceKey: "payments.checkout.feature",
        title: "Create checkout payment",
        description: "Confirm payment settlement from payment and delivery checkout flows.",
        action: "create",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "sensitive",
    },
];

export const ORDER_WORKFLOW_ROLE_BLUEPRINT: Array<{
    roleName: SupportedRoleName;
    title: string;
    summary: string;
    allowed: string[];
    denied: string[];
}> = [
    {
        roleName: "Admin",
        title: "Order Workflow Governor",
        summary: "Owns the full live order workflow across channels, line-item control, serving, checkout, and cancellation governance.",
        allowed: [
            "Open orders, channels, serving board, and order detail",
            "Create orders, manage line items, update serving state, and complete checkout",
            "Cancel full orders when operational rollback is required",
        ],
        denied: [],
    },
    {
        roleName: "Manager",
        title: "Branch Order Operator",
        summary: "Runs branch order operations end-to-end, including queue handling, serving, checkout, and full-order cancellation.",
        allowed: [
            "Open all branch order workflows and create channel orders",
            "Manage line items, update serving state, and complete checkout",
            "Cancel full orders for operational correction",
        ],
        denied: [],
    },
    {
        roleName: "Employee",
        title: "Frontline Order User",
        summary: "Can execute day-to-day branch order handling, serving, editing, and checkout, but full-order cancellation remains restricted.",
        allowed: [
            "Open orders, channels, serving board, and checkout flows",
            "Create channel orders, manage line items, and update serving state",
            "Complete checkout payments for active orders",
        ],
        denied: [
            "Cancel full orders",
        ],
    },
];

export function isOrderWorkflowCapabilityResource(resourceKey: string): boolean {
    return resourceKey === "orders.page" || resourceKey.startsWith("orders.") || resourceKey === "payments.checkout.feature";
}

export function getOrderWorkflowCapability(resourceKey: string): OrderWorkflowCapability | undefined {
    return ORDER_WORKFLOW_CAPABILITIES.find((item) => item.resourceKey === resourceKey);
}
