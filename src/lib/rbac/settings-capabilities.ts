export type SupportedRoleName = "Admin" | "Manager" | "Employee";

export type SettingsCapabilityAction = "access" | "view" | "create" | "update" | "delete";

export type SettingsCapability = {
    resourceKey: string;
    title: string;
    description: string;
    action: SettingsCapabilityAction;
    recommendedRoles: SupportedRoleName[];
    securityLevel: "core" | "sensitive" | "governance";
};

export const SETTINGS_CAPABILITIES: SettingsCapability[] = [
    {
        resourceKey: "pos_settings.page",
        title: "Open POS Settings",
        description: "Open the branch settings landing page and governance summary.",
        action: "view",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "core",
    },
    {
        resourceKey: "shop_profile.page",
        title: "Read Shop Profile Data",
        description: "Read branch shop profile data used by POS experiences and settings summaries.",
        action: "view",
        recommendedRoles: ["Admin", "Manager", "Employee"],
        securityLevel: "core",
    },
    {
        resourceKey: "shop_profile.identity.feature",
        title: "Edit Branch Identity",
        description: "Update the branch shop name and identity-facing settings from the settings landing page.",
        action: "update",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "shop_profile.contact.feature",
        title: "Edit Branch Contact",
        description: "Update address and phone contact details used by receipts and customer-facing flows.",
        action: "update",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "payment_accounts.page",
        title: "Open Payment Accounts",
        description: "Open the payment account workspace for the branch.",
        action: "view",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "core",
    },
    {
        resourceKey: "payment_accounts.search.feature",
        title: "Search Payment Accounts",
        description: "Use account search on the payment account manager page.",
        action: "view",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "core",
    },
    {
        resourceKey: "payment_accounts.filter.feature",
        title: "Filter Payment Accounts",
        description: "Filter payment accounts by account status or governance state.",
        action: "view",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "core",
    },
    {
        resourceKey: "payment_accounts.detail.feature",
        title: "View Payment Account Detail",
        description: "Open a specific payment account record and read detail metadata.",
        action: "view",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "payment_accounts.manager.feature",
        title: "Open Payment Account Manager",
        description: "Enter the payment account manager workspace and navigate between manage flows.",
        action: "access",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "payment_accounts.create.feature",
        title: "Create Payment Account",
        description: "Create a new PromptPay payment account for the branch.",
        action: "create",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "payment_accounts.edit.feature",
        title: "Edit Payment Account",
        description: "Edit account metadata such as account name, number, phone, and notes.",
        action: "update",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "sensitive",
    },
    {
        resourceKey: "payment_accounts.activate.feature",
        title: "Set Active Payment Account",
        description: "Promote one payment account to the active branch payment account.",
        action: "update",
        recommendedRoles: ["Admin", "Manager"],
        securityLevel: "governance",
    },
    {
        resourceKey: "payment_accounts.delete.feature",
        title: "Delete Payment Account",
        description: "Delete a non-primary payment account when branch policy allows it.",
        action: "delete",
        recommendedRoles: ["Admin"],
        securityLevel: "governance",
    },
];

export const SETTINGS_ROLE_BLUEPRINT: Array<{
    roleName: SupportedRoleName;
    title: string;
    summary: string;
    allowed: string[];
    denied: string[];
}> = [
    {
        roleName: "Admin",
        title: "Branch Settings Governor",
        summary: "Controls settings landing, branch identity/contact, payment account lifecycle, active account policy, and destructive cleanup.",
        allowed: [
            "Open settings and payment-account workspaces",
            "Edit branch identity and contact metadata",
            "Create, edit, activate, and delete payment accounts",
        ],
        denied: [],
    },
    {
        roleName: "Manager",
        title: "Branch Settings Operator",
        summary: "Operates branch settings and payment-account maintenance, but should not delete payment-account history.",
        allowed: [
            "Open settings and payment-account workspaces",
            "Edit branch identity and contact metadata",
            "Create, edit, search, filter, and activate payment accounts",
        ],
        denied: [
            "Delete payment accounts",
        ],
    },
    {
        roleName: "Employee",
        title: "Operational User",
        summary: "Uses published branch settings indirectly during POS operations and should not enter settings governance screens.",
        allowed: [
            "Read branch profile data indirectly in operational screens",
        ],
        denied: [
            "Open POS settings",
            "Open payment-account manager",
            "Create, edit, activate, or delete payment accounts",
        ],
    },
];

export function isSettingsCapabilityResource(resourceKey: string): boolean {
    return (
        resourceKey === "pos_settings.page" ||
        resourceKey === "shop_profile.page" ||
        resourceKey.startsWith("shop_profile.") ||
        resourceKey === "payment_accounts.page" ||
        resourceKey.startsWith("payment_accounts.")
    );
}

export function getSettingsCapability(resourceKey: string): SettingsCapability | undefined {
    return SETTINGS_CAPABILITIES.find((item) => item.resourceKey === resourceKey);
}
