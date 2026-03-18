export type SupportedRoleName = "Admin" | "Manager" | "Employee";

export type QrCodeCapabilityAction = "access" | "view" | "update";

export type QrCodeCapability = {
    resourceKey: string;
    title: string;
    description: string;
    action: QrCodeCapabilityAction;
    recommendedRoles: SupportedRoleName[];
    securityLevel: "core" | "sensitive" | "governance";
};

export const QR_CODE_CAPABILITIES: QrCodeCapability[] = [
    {
        resourceKey: "qr_code.page",
        title: "Open QR code workspace",
        description: "Open the QR code console for table and takeaway ordering links.",
        action: "view",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "core",
    },
    {
        resourceKey: "qr_code.search.feature",
        title: "Search QR catalog",
        description: "Search table QR entries by table name and current list context.",
        action: "view",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "core",
    },
    {
        resourceKey: "qr_code.filter.feature",
        title: "Filter and sort QR list",
        description: "Filter by active status, table state, and sort order before reviewing QR coverage.",
        action: "view",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "core",
    },
    {
        resourceKey: "qr_code.preview.feature",
        title: "Preview table QR",
        description: "Open an enlarged QR preview for in-store support and validation.",
        action: "view",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "core",
    },
    {
        resourceKey: "qr_code.customer_link.feature",
        title: "Open customer ordering link",
        description: "Open the customer-facing ordering page behind a table QR link.",
        action: "view",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "qr_code.rotate.feature",
        title: "Rotate table QR token",
        description: "Refresh a table QR token and invalidate the previous ordering link.",
        action: "update",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "governance",
    },
    {
        resourceKey: "qr_code.single_export.feature",
        title: "Export single table QR",
        description: "Print or download one table QR as receipt, A4, or PNG output.",
        action: "update",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "qr_code.bulk_export.feature",
        title: "Bulk export QR set",
        description: "Generate a full QR package for all visible tables in the current list scope.",
        action: "update",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "governance",
    },
    {
        resourceKey: "qr_code.takeaway.feature",
        title: "Open takeaway QR workspace",
        description: "Open the dedicated takeaway ordering QR modal and inspect its live link.",
        action: "view",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "core",
    },
    {
        resourceKey: "qr_code.takeaway_rotate.feature",
        title: "Rotate takeaway QR token",
        description: "Refresh the takeaway ordering QR token and invalidate the previous link.",
        action: "update",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "governance",
    },
    {
        resourceKey: "qr_code.takeaway_customer_link.feature",
        title: "Open or copy takeaway ordering link",
        description: "Copy or open the live customer page behind the takeaway QR.",
        action: "view",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "qr_code.takeaway_export.feature",
        title: "Export takeaway QR",
        description: "Print or download the takeaway QR as receipt, A4, or PNG output.",
        action: "update",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "sensitive",
    },
];

export const QR_CODE_ROLE_BLUEPRINT: Array<{
    roleName: SupportedRoleName;
    title: string;
    summary: string;
    allowed: string[];
    denied: string[];
}> = [
    {
        roleName: "Admin",
        title: "QR Governance Owner",
        summary: "Owns full lifecycle control of dine-in and takeaway QR channels, including rotation, export, and recovery.",
        allowed: [
            "Open QR workspace and review all table or takeaway QR links",
            "Search, filter, preview, open customer links, and export single or bulk QR",
            "Rotate table QR and takeaway QR tokens when links must be reissued",
        ],
        denied: [],
    },
    {
        roleName: "Manager",
        title: "QR Operations Supervisor",
        summary: "Manages branch QR readiness, rotates compromised links, and prepares export packs for operations.",
        allowed: [
            "Open QR workspace and review all table or takeaway QR links",
            "Search, filter, preview, open customer links, and export single or bulk QR",
            "Rotate table QR and takeaway QR tokens when operations require refresh",
        ],
        denied: [],
    },
    {
        roleName: "Employee",
        title: "Frontline QR Support",
        summary: "Supports customers at the counter or table with preview, link access, and single QR export without governance actions.",
        allowed: [
            "Open QR workspace, search, filter, and preview QR codes",
            "Open or copy customer links and export a single table or takeaway QR",
            "Open takeaway QR for customer assistance",
        ],
        denied: [
            "Rotate table QR or takeaway QR tokens",
            "Export all table QR codes in bulk",
        ],
    },
];

export function isQrCodeCapabilityResource(resourceKey: string): boolean {
    return resourceKey === "qr_code.page" || resourceKey.startsWith("qr_code.");
}

export function getQrCodeCapability(resourceKey: string): QrCodeCapability | undefined {
    return QR_CODE_CAPABILITIES.find((item) => item.resourceKey === resourceKey);
}
