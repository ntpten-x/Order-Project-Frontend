export type PermissionScope = "none" | "own" | "branch" | "all";
export type PermissionAction = "access" | "view" | "create" | "update" | "delete";
export type PermissionOverrideApprovalStatus = "pending" | "approved" | "rejected";
export type PermissionApprovalRiskFlag = "delete" | "all_scope";

export interface EffectiveRolePermissionRow {
    resourceKey: string;
    pageLabel: string;
    route: string;
    canAccess: boolean;
    canView: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    dataScope: PermissionScope;
}

export interface EffectiveRolePermissionsResponse {
    role: {
        id: string;
        roles_name: string;
        display_name: string;
    };
    permissions: EffectiveRolePermissionRow[];
}

export interface EffectiveUserPermissionsResponse {
    user: {
        id: string;
        username: string;
        name?: string;
        roleId: string;
    };
    role: {
        id: string;
        roles_name: string;
        display_name: string;
    };
    permissions: EffectiveRolePermissionRow[];
}

export interface UpdateUserPermissionsPayload {
    permissions: EffectiveRolePermissionRow[];
    reason?: string;
}

export interface UpdateRolePermissionsPayload {
    permissions: EffectiveRolePermissionRow[];
    reason?: string;
}

export type UpdateUserPermissionsResult =
    | {
        updated: true;
        approvalRequired: false;
    }
    | {
        updated: false;
        approvalRequired: true;
        approvalRequest: {
            id: string;
            status: PermissionOverrideApprovalStatus;
            targetUserId: string;
            requestedByUserId: string;
            riskFlags: PermissionApprovalRiskFlag[];
            createdAt: string;
            };
    };

export type UpdateRolePermissionsResult = {
    updated: true;
};

export interface SimulatePermissionPayload {
    userId: string;
    resourceKey: string;
    actionKey: "access" | "view" | "create" | "update" | "delete";
}

export interface SimulatePermissionResult {
    allowed: boolean;
    scope: PermissionScope;
    resourceKey: string;
    actionKey: string;
}

export interface PermissionAuditItem {
    id: string;
    actor_user_id: string;
    target_type: "role" | "user";
    target_id: string;
    action_type: string;
    payload_before?: Record<string, unknown> | null;
    payload_after?: Record<string, unknown> | null;
    reason?: string | null;
    created_at: string;
}

export interface PermissionOverrideApprovalItem {
    id: string;
    targetUserId: string;
    requestedByUserId: string;
    reviewedByUserId: string | null;
    status: PermissionOverrideApprovalStatus;
    reason: string | null;
    reviewReason: string | null;
    riskFlags: PermissionApprovalRiskFlag[];
    createdAt: string;
    reviewedAt: string | null;
}

export interface PermissionOverrideApprovalsQuery {
    status?: PermissionOverrideApprovalStatus;
    targetUserId?: string;
    requestedByUserId?: string;
    page?: number;
    limit?: number;
}

export interface ReviewOverrideApprovalPayload {
    reviewReason?: string;
}

export interface ReviewOverrideApprovalResult {
    approvalId: string;
    status: "approved" | "rejected";
    targetUserId: string;
    reviewedByUserId: string;
    reviewedAt: string | null;
}
