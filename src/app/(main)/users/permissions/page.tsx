"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert,
    Badge,
    Button,
    Card,
    Col,
    DatePicker,
    Divider,
    Input,
    Modal,
    Progress,
    Row,
    Segmented,
    Select,
    Space,
    Switch,
    Table,
    Tag,
    message,
    Typography,
} from "antd";
import {
    AppstoreOutlined,
    CheckCircleOutlined,
    ControlOutlined,
    DiffOutlined,
    DownloadOutlined,
    StopOutlined,
    DatabaseOutlined,
    SafetyCertificateOutlined,
    UserOutlined,
} from "@ant-design/icons";
import { roleService } from "../../../../services/roles.service";
import { permissionsService } from "../../../../services/permissions.service";
import { userService } from "../../../../services/users.service";
import { authService } from "../../../../services/auth.service";
import { Role } from "../../../../types/api/roles";
import { User } from "../../../../types/api/users";
import {
    EffectiveRolePermissionRow,
    PermissionAuditItem,
    PermissionOverrideApprovalItem,
    PermissionOverrideApprovalStatus,
    PermissionScope,
    SimulatePermissionResult,
} from "../../../../types/api/permissions";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

type PermissionRow = EffectiveRolePermissionRow & { key: string };
type PermissionSnapshot = {
    resourceKey: string;
    pageLabel?: string;
    route?: string;
    canAccess: boolean;
    canView: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    dataScope: PermissionScope;
};

type SemanticDiffRow = {
    key: string;
    resourceKey: string;
    pageLabel: string;
    field: string;
    changeType: string;
    before: string;
    after: string;
    riskLevel: "none" | "low" | "medium" | "high";
    riskPoints: number;
};

const SCOPE_RANK: Record<PermissionScope, number> = {
    none: 0,
    own: 1,
    branch: 2,
    all: 3,
};

function getRiskMeta(
    field: string,
    beforeValue: string,
    afterValue: string
): { changeType: string; riskLevel: "none" | "low" | "medium" | "high"; riskPoints: number } {
    if (field === "dataScope") {
        const beforeRank = SCOPE_RANK[(beforeValue as PermissionScope) ?? "none"] ?? 0;
        const afterRank = SCOPE_RANK[(afterValue as PermissionScope) ?? "none"] ?? 0;
        if (afterRank > beforeRank) {
            const diff = afterRank - beforeRank;
            return {
                changeType: "Scope Widen",
                riskLevel: diff >= 2 ? "high" : "medium",
                riskPoints: diff >= 2 ? 3 : 2,
            };
        }
        return { changeType: "Scope Tighten", riskLevel: "low", riskPoints: 0 };
    }

    const isGrant = beforeValue === "false" && afterValue === "true";
    if (isGrant) {
        if (field === "canAccess" || field === "canDelete") {
            return { changeType: "Grant", riskLevel: "high", riskPoints: 3 };
        }
        return { changeType: "Grant", riskLevel: "medium", riskPoints: 2 };
    }

    return { changeType: "Revoke", riskLevel: "low", riskPoints: 0 };
}

function buildSemanticDiffRows(beforeRaw: PermissionSnapshot[], afterRaw: PermissionSnapshot[]): SemanticDiffRow[] {
    const beforeMap = new Map(beforeRaw.map((row) => [row.resourceKey, row]));
    const afterMap = new Map(afterRaw.map((row) => [row.resourceKey, row]));
    const keys = Array.from(
        new Set(Array.from(beforeMap.keys()).concat(Array.from(afterMap.keys())))
    );
    const rows: SemanticDiffRow[] = [];
    const fields: Array<keyof PermissionSnapshot> = [
        "canAccess",
        "canView",
        "canCreate",
        "canUpdate",
        "canDelete",
        "dataScope",
    ];

    for (const resourceKey of keys) {
        const before = beforeMap.get(resourceKey);
        const after = afterMap.get(resourceKey);
        const label = after?.pageLabel || before?.pageLabel || resourceKey;

        for (const field of fields) {
            const beforeValue = before ? String(before[field]) : "-";
            const afterValue = after ? String(after[field]) : "-";
            if (beforeValue !== afterValue) {
                const risk = getRiskMeta(String(field), beforeValue, afterValue);
                rows.push({
                    key: `${resourceKey}:${field}`,
                    resourceKey,
                    pageLabel: label,
                    field,
                    changeType: risk.changeType,
                    before: beforeValue,
                    after: afterValue,
                    riskLevel: risk.riskLevel,
                    riskPoints: risk.riskPoints,
                });
            }
        }
    }

    return rows;
}

function scopeTag(scope: PermissionScope) {
    if (scope === "all") return <Tag color="gold">All data</Tag>;
    if (scope === "branch") return <Tag color="blue">Branch</Tag>;
    if (scope === "own") return <Tag color="purple">Own</Tag>;
    return <Tag color="default">No data</Tag>;
}

function approvalStatusTag(status: PermissionOverrideApprovalStatus) {
    if (status === "approved") return <Tag color="green">Approved</Tag>;
    if (status === "rejected") return <Tag color="red">Rejected</Tag>;
    return <Tag color="orange">Pending</Tag>;
}

export default function PermissionsPage() {
    const [targetType, setTargetType] = useState<"user" | "role">("user");
    const [selectedUser, setSelectedUser] = useState<string>("");
    const [selectedRole, setSelectedRole] = useState<string>("");
    const [roles, setRoles] = useState<Role[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [rows, setRows] = useState<PermissionRow[]>([]);
    const [baselineRows, setBaselineRows] = useState<PermissionRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [saveReason, setSaveReason] = useState("");
    const [highRiskConfirmed, setHighRiskConfirmed] = useState(false);
    const [simulateAction, setSimulateAction] = useState<"access" | "view" | "create" | "update" | "delete">("view");
    const [simulateResource, setSimulateResource] = useState<string>("");
    const [simulateResult, setSimulateResult] = useState<SimulatePermissionResult | null>(null);
    const [simulating, setSimulating] = useState(false);
    const [audits, setAudits] = useState<PermissionAuditItem[]>([]);
    const [auditLoading, setAuditLoading] = useState(false);
    const [auditActionFilter, setAuditActionFilter] = useState<string>("");
    const [auditActorFilter, setAuditActorFilter] = useState<string>("");
    const [auditDateRange, setAuditDateRange] = useState<[string, string] | null>(null);
    const [selectedAudit, setSelectedAudit] = useState<PermissionAuditItem | null>(null);
    const [approvals, setApprovals] = useState<PermissionOverrideApprovalItem[]>([]);
    const [approvalsLoading, setApprovalsLoading] = useState(false);
    const [approvalStatusFilter, setApprovalStatusFilter] = useState<PermissionOverrideApprovalStatus | "">("pending");
    const [approvalsOnlySelectedUser, setApprovalsOnlySelectedUser] = useState(true);
    const [approvalActionLoadingId, setApprovalActionLoadingId] = useState<string>("");
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectApprovalId, setRejectApprovalId] = useState<string>("");
    const [rejectReason, setRejectReason] = useState("");
    const [lastApprovalRequestId, setLastApprovalRequestId] = useState<string>("");
    const editable = targetType === "user";
    const riskTag = (risk: "none" | "low" | "medium" | "high") => {
        if (risk === "high") return <Tag color="red">High</Tag>;
        if (risk === "medium") return <Tag color="orange">Medium</Tag>;
        if (risk === "low") return <Tag color="green">Low</Tag>;
        return <Tag>None</Tag>;
    };

    const semanticDiffRows = useMemo<SemanticDiffRow[]>(() => {
        if (!selectedAudit) return [];

        const beforeRaw = ((selectedAudit.payload_before as { permissions?: PermissionSnapshot[] } | null)?.permissions ?? []) as PermissionSnapshot[];
        const afterRaw = ((selectedAudit.payload_after as { permissions?: PermissionSnapshot[] } | null)?.permissions ?? []) as PermissionSnapshot[];
        if (beforeRaw.length === 0 && afterRaw.length === 0) return [];
        return buildSemanticDiffRows(beforeRaw, afterRaw);
    }, [selectedAudit]);

    const riskSummary = useMemo(() => {
        const total = semanticDiffRows.reduce((acc, row) => acc + row.riskPoints, 0);
        const level =
            total >= 8 ? "High" :
                total >= 4 ? "Medium" :
                    total > 0 ? "Low" : "None";
        return { total, level };
    }, [semanticDiffRows]);

    const pendingDiffRows = useMemo(() => {
        if (!editable || !dirty) return [] as SemanticDiffRow[];
        const beforeRaw: PermissionSnapshot[] = baselineRows.map((row) => ({
            resourceKey: row.resourceKey,
            pageLabel: row.pageLabel,
            route: row.route,
            canAccess: row.canAccess,
            canView: row.canView,
            canCreate: row.canCreate,
            canUpdate: row.canUpdate,
            canDelete: row.canDelete,
            dataScope: row.dataScope,
        }));
        const afterRaw: PermissionSnapshot[] = rows.map((row) => ({
            resourceKey: row.resourceKey,
            pageLabel: row.pageLabel,
            route: row.route,
            canAccess: row.canAccess,
            canView: row.canView,
            canCreate: row.canCreate,
            canUpdate: row.canUpdate,
            canDelete: row.canDelete,
            dataScope: row.dataScope,
        }));
        return buildSemanticDiffRows(beforeRaw, afterRaw);
    }, [editable, dirty, baselineRows, rows]);

    const pendingRiskSummary = useMemo(() => {
        const total = pendingDiffRows.reduce((acc, row) => acc + row.riskPoints, 0);
        const level =
            total >= 8 ? "High" :
                total >= 4 ? "Medium" :
                    total > 0 ? "Low" : "None";
        return { total, level };
    }, [pendingDiffRows]);

    const roleOptions = useMemo(
        () =>
            roles.map((role) => ({
                label: role.display_name || role.roles_name,
                value: role.id,
            })),
        [roles]
    );

    const userOptions = useMemo(
        () =>
            users.map((u) => ({
                label: `${u.name || u.username} (${u.roles?.display_name || u.roles?.roles_name || "No role"})`,
                value: u.id,
            })),
        [users]
    );

    useEffect(() => {
        const bootstrap = async () => {
            try {
                const [roleData, userData] = await Promise.all([
                    roleService.getAllRoles(),
                    userService.getAllUsers(),
                ]);
                setRoles(roleData);
                setUsers(userData);
                if (roleData.length > 0) setSelectedRole((prev) => prev || roleData[0].id);
                if (userData.length > 0) setSelectedUser((prev) => prev || userData[0].id);
            } catch (error) {
                message.error(error instanceof Error ? error.message : "Failed to initialize permissions page");
            }
        };
        bootstrap();
    }, []);

    useEffect(() => {
        const loadRolePermissions = async () => {
            if (!selectedRole || targetType !== "role") return;
            setLoading(true);
            setDirty(false);
            try {
                const data = await permissionsService.getRoleEffectivePermissions(selectedRole);
                const mapped = data.permissions.map((item) => ({ ...item, key: item.resourceKey }));
                setRows(mapped);
                setBaselineRows(mapped);
            } catch (error) {
                message.error(error instanceof Error ? error.message : "Failed to load role permissions");
                setRows([]);
            } finally {
                setLoading(false);
            }
        };
        loadRolePermissions();
    }, [selectedRole, targetType]);

    useEffect(() => {
        const loadUserPermissions = async () => {
            if (!selectedUser || targetType !== "user") return;
            setLoading(true);
            setDirty(false);
            try {
                const data = await permissionsService.getUserEffectivePermissions(selectedUser);
                const mapped = data.permissions.map((item) => ({ ...item, key: item.resourceKey }));
                setRows(mapped);
                setBaselineRows(mapped);
            } catch (error) {
                message.error(error instanceof Error ? error.message : "Failed to load user permissions");
                setRows([]);
            } finally {
                setLoading(false);
            }
        };
        loadUserPermissions();
    }, [selectedUser, targetType]);

    const loadAudits = useCallback(async () => {
        if (!selectedUser || targetType !== "user") return;
        setAuditLoading(true);
        try {
            const data = await permissionsService.getPermissionAudits({
                targetType: "user",
                targetId: selectedUser,
                actionType: auditActionFilter || undefined,
                actorUserId: auditActorFilter || undefined,
                from: auditDateRange?.[0],
                to: auditDateRange?.[1],
                page: 1,
                limit: 20,
            });
            setAudits(data.data);
        } catch (error) {
            message.error(error instanceof Error ? error.message : "Failed to load permission audits");
            setAudits([]);
        } finally {
            setAuditLoading(false);
        }
    }, [selectedUser, targetType, auditActionFilter, auditActorFilter, auditDateRange]);

    useEffect(() => {
        loadAudits();
    }, [loadAudits]);

    const loadApprovals = useCallback(async () => {
        if (targetType !== "user") return;
        setApprovalsLoading(true);
        try {
            const data = await permissionsService.getOverrideApprovals({
                status: approvalStatusFilter || undefined,
                targetUserId: approvalsOnlySelectedUser ? selectedUser || undefined : undefined,
                page: 1,
                limit: 20,
            });
            setApprovals(data.data);
        } catch (error) {
            message.error(error instanceof Error ? error.message : "Failed to load approval requests");
            setApprovals([]);
        } finally {
            setApprovalsLoading(false);
        }
    }, [approvalStatusFilter, approvalsOnlySelectedUser, selectedUser, targetType]);

    useEffect(() => {
        loadApprovals();
    }, [loadApprovals]);

    useEffect(() => {
        if (!simulateResource && rows.length > 0) {
            setSimulateResource(rows[0].resourceKey);
        }
    }, [rows, simulateResource]);

    useEffect(() => {
        if (pendingRiskSummary.level !== "High" && highRiskConfirmed) {
            setHighRiskConfirmed(false);
        }
    }, [pendingRiskSummary.level, highRiskConfirmed]);

    const updateRow = (key: string, patch: Partial<PermissionRow>) => {
        setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
        setDirty(true);
    };

    const toggleAction = (key: string, action: "access" | "view" | "create" | "update" | "delete", checked: boolean) => {
        const patch: Partial<PermissionRow> = {};
        if (action === "access") patch.canAccess = checked;
        if (action === "view") {
            patch.canView = checked;
            if (!checked) patch.dataScope = "none";
        }
        if (action === "create") patch.canCreate = checked;
        if (action === "update") patch.canUpdate = checked;
        if (action === "delete") patch.canDelete = checked;
        updateRow(key, patch);
    };

    const renderActionSwitch = (value: boolean, row: PermissionRow, action: "access" | "view" | "create" | "update" | "delete") => {
        return (
            <Switch
                checked={value}
                disabled={!editable}
                size="small"
                onChange={(checked) => toggleAction(row.key, action, checked)}
            />
        );
    };

    const columns = [
            {
                title: "Page",
                dataIndex: "pageLabel",
                key: "pageLabel",
                render: (value: string, row: PermissionRow) => (
                    <Space direction="vertical" size={0}>
                        <Text strong>{value}</Text>
                        <Text type="secondary">{row.route}</Text>
                    </Space>
                ),
                fixed: "left" as const,
                width: 220,
            },
            {
                title: "Access",
                dataIndex: "canAccess",
                key: "canAccess",
                align: "center" as const,
                render: (value: boolean, row: PermissionRow) => renderActionSwitch(value, row, "access"),
                width: 90,
            },
            {
                title: "View",
                dataIndex: "canView",
                key: "canView",
                align: "center" as const,
                render: (value: boolean, row: PermissionRow) => renderActionSwitch(value, row, "view"),
                width: 90,
            },
            {
                title: "Create",
                dataIndex: "canCreate",
                key: "canCreate",
                align: "center" as const,
                render: (value: boolean, row: PermissionRow) => renderActionSwitch(value, row, "create"),
                width: 90,
            },
            {
                title: "Update",
                dataIndex: "canUpdate",
                key: "canUpdate",
                align: "center" as const,
                render: (value: boolean, row: PermissionRow) => renderActionSwitch(value, row, "update"),
                width: 90,
            },
            {
                title: "Delete",
                dataIndex: "canDelete",
                key: "canDelete",
                align: "center" as const,
                render: (value: boolean, row: PermissionRow) => renderActionSwitch(value, row, "delete"),
                width: 90,
            },
            {
                title: "Data Scope",
                dataIndex: "dataScope",
                key: "dataScope",
                render: (scope: PermissionScope, row: PermissionRow) => {
                    if (!editable) return scopeTag(scope);
                    return (
                        <Select
                            value={scope}
                            size="small"
                            style={{ width: 110 }}
                            disabled={!row.canView}
                            options={[
                                { label: "No data", value: "none" },
                                { label: "Own", value: "own" },
                                { label: "Branch", value: "branch" },
                                { label: "All", value: "all" },
                            ]}
                            onChange={(value) => updateRow(row.key, { dataScope: value as PermissionScope })}
                        />
                    );
                },
                width: 130,
            },
        ];

    const permissionCoverage = useMemo(() => {
        if (!rows.length) return 0;
        const total = rows.length * 6;
        const enabled = rows.reduce((acc, row) => {
            return (
                acc +
                Number(row.canAccess) +
                Number(row.canView) +
                Number(row.canCreate) +
                Number(row.canUpdate) +
                Number(row.canDelete) +
                Number(row.dataScope !== "none")
            );
        }, 0);
        return Math.round((enabled / total) * 100);
    }, [rows]);

    const reloadSelectedUserEffective = useCallback(async () => {
        if (!selectedUser || targetType !== "user") return;
        const data = await permissionsService.getUserEffectivePermissions(selectedUser);
        const mapped = data.permissions.map((item) => ({ ...item, key: item.resourceKey }));
        setRows(mapped);
        setBaselineRows(mapped);
        setDirty(false);
    }, [selectedUser, targetType]);

    const handleSaveUserOverrides = async () => {
        if (!editable || !selectedUser || !dirty) return;
        if (pendingRiskSummary.level === "High" && saveReason.trim().length < 10) {
            message.error("High-risk changes require a reason with at least 10 characters.");
            return;
        }
        if (pendingRiskSummary.level === "High" && !highRiskConfirmed) {
            message.error("High-risk changes require explicit admin confirmation.");
            return;
        }

        const doSave = async () => {
            setSaving(true);
            try {
                const csrfToken = await authService.getCsrfToken();
                const result = await permissionsService.updateUserPermissions(
                    selectedUser,
                    {
                        permissions: rows.map((row) => ({
                            resourceKey: row.resourceKey,
                            pageLabel: row.pageLabel,
                            route: row.route,
                            canAccess: row.canAccess,
                            canView: row.canView,
                            canCreate: row.canCreate,
                            canUpdate: row.canUpdate,
                            canDelete: row.canDelete,
                            dataScope: row.dataScope,
                        })),
                        reason: saveReason || undefined,
                    },
                    csrfToken
                );

                setSaveReason("");
                setHighRiskConfirmed(false);

                if (result.updated && !result.approvalRequired) {
                    setDirty(false);
                    setBaselineRows(rows);
                    message.success("User permission overrides updated");
                } else if (!result.updated && result.approvalRequired) {
                    setLastApprovalRequestId(result.approvalRequest.id);
                    message.warning(`Approval request submitted (${result.approvalRequest.id})`);
                    await reloadSelectedUserEffective();
                }

                await Promise.all([loadAudits(), loadApprovals()]);
            } catch (error) {
                message.error(error instanceof Error ? error.message : "Failed to save user permissions");
            } finally {
                setSaving(false);
            }
        };

        if (pendingRiskSummary.total > 0) {
            Modal.confirm({
                title: "Confirm Permission Update",
                content: `This change has ${pendingRiskSummary.level} risk (score ${pendingRiskSummary.total}). Continue?`,
                okText: "Confirm",
                cancelText: "Cancel",
                centered: true,
                onOk: doSave,
            });
            return;
        }

        await doSave();
    };

    const handleApprove = async (approval: PermissionOverrideApprovalItem) => {
        setApprovalActionLoadingId(approval.id);
        try {
            const csrfToken = await authService.getCsrfToken();
            await permissionsService.approveOverride(approval.id, {}, csrfToken);
            message.success("Approval request approved");
            if (selectedUser && approval.targetUserId === selectedUser) {
                await reloadSelectedUserEffective();
            }
            await Promise.all([loadAudits(), loadApprovals()]);
        } catch (error) {
            message.error(error instanceof Error ? error.message : "Failed to approve request");
        } finally {
            setApprovalActionLoadingId("");
        }
    };

    const openRejectModal = (approval: PermissionOverrideApprovalItem) => {
        setRejectApprovalId(approval.id);
        setRejectReason("");
        setRejectModalOpen(true);
    };

    const submitReject = async () => {
        if (!rejectApprovalId) return;
        if (rejectReason.trim().length < 3) {
            message.error("Reject reason must be at least 3 characters.");
            return;
        }
        setApprovalActionLoadingId(rejectApprovalId);
        try {
            const csrfToken = await authService.getCsrfToken();
            await permissionsService.rejectOverride(
                rejectApprovalId,
                { reviewReason: rejectReason.trim() },
                csrfToken
            );
            setRejectModalOpen(false);
            setRejectApprovalId("");
            setRejectReason("");
            message.success("Approval request rejected");
            await Promise.all([loadAudits(), loadApprovals()]);
        } catch (error) {
            message.error(error instanceof Error ? error.message : "Failed to reject request");
        } finally {
            setApprovalActionLoadingId("");
        }
    };

    const handleSimulate = async () => {
        if (!selectedUser || !simulateResource) return;
        setSimulating(true);
        try {
            const result = await permissionsService.simulatePermission({
                userId: selectedUser,
                resourceKey: simulateResource,
                actionKey: simulateAction,
            });
            setSimulateResult(result);
        } catch (error) {
            message.error(error instanceof Error ? error.message : "Failed to simulate permission");
            setSimulateResult(null);
        } finally {
            setSimulating(false);
        }
    };

    const handleExportAudits = () => {
        if (audits.length === 0) return;
        const headers = ["created_at", "action_type", "actor_user_id", "target_type", "target_id", "reason"];
        const rowsCsv = audits.map((item) =>
            [
                item.created_at,
                item.action_type,
                item.actor_user_id,
                item.target_type,
                item.target_id,
                (item.reason || "").replace(/"/g, '""'),
            ].map((value) => `"${value}"`).join(",")
        );
        const csv = [headers.join(","), ...rowsCsv].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `permission-audits-${new Date().toISOString()}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div style={{ padding: 24, background: "#f6f8fb", minHeight: "100vh" }}>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Card bordered={false}>
                        <Space direction="vertical" size={4} style={{ width: "100%" }}>
                            <Space align="center">
                                <SafetyCertificateOutlined style={{ color: "#2563eb", fontSize: 20 }} />
                                <Title level={3} style={{ margin: 0 }}>
                                    User Permissions
                                </Title>
                                <Badge status="processing" text="Phase 2" />
                            </Space>
                            <Text type="secondary">
                                Configure page access, action permissions, and data visibility scope by role or by user override.
                            </Text>
                        </Space>
                    </Card>
                </Col>

                <Col xs={24} lg={16}>
                    <Card
                        title={
                            <Space>
                                <ControlOutlined />
                                <span>Permission Matrix</span>
                            </Space>
                        }
                        extra={
                            <Button
                                type="primary"
                                onClick={handleSaveUserOverrides}
                                disabled={
                                    !editable ||
                                    !dirty ||
                                    (pendingRiskSummary.level === "High" && saveReason.trim().length < 10) ||
                                    (pendingRiskSummary.level === "High" && !highRiskConfirmed)
                                }
                                loading={saving}
                            >
                                Save Overrides
                            </Button>
                        }
                        bordered={false}
                    >
                        <Space direction="vertical" style={{ width: "100%" }} size={12}>
                            <Segmented
                                value={targetType}
                                options={[
                                    {
                                        label: (
                                            <Space>
                                                <UserOutlined />
                                                User
                                            </Space>
                                        ),
                                        value: "user",
                                    },
                                    {
                                        label: (
                                            <Space>
                                                <AppstoreOutlined />
                                                Role Template
                                            </Space>
                                        ),
                                        value: "role",
                                    },
                                ]}
                                onChange={(value) => setTargetType(value as "user" | "role")}
                            />

                            {targetType === "user" ? (
                                <Select
                                    value={selectedUser || undefined}
                                    onChange={setSelectedUser}
                                    options={userOptions}
                                    style={{ width: 420, maxWidth: "100%" }}
                                    placeholder="Select user"
                                    showSearch
                                    optionFilterProp="label"
                                />
                            ) : (
                                <Select
                                    value={selectedRole || undefined}
                                    onChange={setSelectedRole}
                                    options={roleOptions}
                                    style={{ width: 320, maxWidth: "100%" }}
                                    placeholder="Select role"
                                />
                            )}

                            {editable && dirty && (
                                <Alert
                                    type="info"
                                    showIcon
                                    message="Unsaved changes"
                                    description="You have modified permission overrides for this user."
                                />
                            )}

                            {editable && dirty && pendingRiskSummary.total > 0 && (
                                <Alert
                                    type={pendingRiskSummary.level === "High" ? "error" : pendingRiskSummary.level === "Medium" ? "warning" : "info"}
                                    showIcon
                                    message={`Pending risk: ${pendingRiskSummary.level} (score ${pendingRiskSummary.total})`}
                                    description="Approval gate will require confirmation before saving."
                                />
                            )}

                            {lastApprovalRequestId && (
                                <Alert
                                    type="warning"
                                    showIcon
                                    closable
                                    onClose={() => setLastApprovalRequestId("")}
                                    message="Approval required"
                                    description={`Request submitted and waiting for reviewer: ${lastApprovalRequestId}`}
                                />
                            )}

                            {editable && dirty && pendingRiskSummary.level === "High" && (
                                <Alert
                                    type="error"
                                    showIcon
                                    message="High-risk admin confirmation"
                                    description={
                                        <Space align="center">
                                            <Switch checked={highRiskConfirmed} onChange={setHighRiskConfirmed} />
                                            <Text>I acknowledge and approve this high-risk permission change.</Text>
                                        </Space>
                                    }
                                />
                            )}

                            {editable && (
                                <Input
                                    value={saveReason}
                                    onChange={(e) => setSaveReason(e.target.value)}
                                    placeholder={
                                        pendingRiskSummary.level === "High"
                                            ? "Reason is required for high-risk changes (min 10 chars)"
                                            : "Reason for permission change (optional)"
                                    }
                                    maxLength={500}
                                    status={pendingRiskSummary.level === "High" && saveReason.trim().length < 10 ? "error" : ""}
                                />
                            )}

                            <Table
                                rowKey="key"
                                columns={columns}
                                dataSource={rows}
                                pagination={false}
                                size="middle"
                                scroll={{ x: 920 }}
                                loading={loading}
                            />
                        </Space>
                    </Card>
                </Col>

                <Col xs={24} lg={8}>
                    <Card
                        title={
                            <Space>
                                <DatabaseOutlined />
                                <span>Policy Summary</span>
                            </Space>
                        }
                        bordered={false}
                    >
                        <Space direction="vertical" size={12} style={{ width: "100%" }}>
                            <Text strong>Permission coverage</Text>
                            <Progress percent={permissionCoverage} />
                            <Divider style={{ margin: "8px 0" }} />
                            <Alert
                                type="info"
                                showIcon
                                message="Conflict resolution"
                                description="Deny-first strategy is applied when explicit deny exists."
                            />
                            <Alert
                                type="success"
                                showIcon
                                message="Phase 8 enabled"
                                description="User override, simulator, audit trail, and two-person approval workflow are active."
                            />
                            <Alert
                                type="warning"
                                showIcon
                                message="Scope control"
                                description="Data scope only applies when View permission is enabled."
                            />
                        </Space>
                    </Card>

                    <Card title="Permission Simulator" bordered={false} style={{ marginTop: 16 }}>
                        <Space direction="vertical" size={10} style={{ width: "100%" }}>
                            <Select
                                value={simulateResource || undefined}
                                onChange={setSimulateResource}
                                options={rows.map((r) => ({ label: r.pageLabel, value: r.resourceKey }))}
                                placeholder="Resource"
                            />
                            <Select
                                value={simulateAction}
                                onChange={(v) => setSimulateAction(v)}
                                options={[
                                    { label: "Access", value: "access" },
                                    { label: "View", value: "view" },
                                    { label: "Create", value: "create" },
                                    { label: "Update", value: "update" },
                                    { label: "Delete", value: "delete" },
                                ]}
                            />
                            <Button onClick={handleSimulate} loading={simulating} disabled={!selectedUser || !simulateResource}>
                                Simulate
                            </Button>
                            {simulateResult && (
                                <Alert
                                    type={simulateResult.allowed ? "success" : "error"}
                                    showIcon
                                    message={simulateResult.allowed ? "Allowed" : "Denied"}
                                    description={`Scope: ${simulateResult.scope}`}
                                />
                            )}
                        </Space>
                    </Card>

                    <Card title="Permission Audits" bordered={false} style={{ marginTop: 16 }}>
                        <Space direction="vertical" size={8} style={{ width: "100%", marginBottom: 12 }}>
                            <Select
                                allowClear
                                placeholder="Filter action"
                                value={auditActionFilter || undefined}
                                onChange={(v) => setAuditActionFilter(v || "")}
                                options={[
                                    { label: "update_overrides", value: "update_overrides" },
                                    { label: "override_update_request", value: "override_update_request" },
                                    { label: "override_update_approve", value: "override_update_approve" },
                                    { label: "override_update_reject", value: "override_update_reject" },
                                ]}
                            />
                            <Select
                                allowClear
                                showSearch
                                optionFilterProp="label"
                                placeholder="Filter actor"
                                value={auditActorFilter || undefined}
                                onChange={(v) => setAuditActorFilter(v || "")}
                                options={userOptions}
                            />
                            <RangePicker
                                showTime
                                onChange={(values) => {
                                    if (!values || values.length !== 2 || !values[0] || !values[1]) {
                                        setAuditDateRange(null);
                                        return;
                                    }
                                    setAuditDateRange([values[0].toISOString(), values[1].toISOString()]);
                                }}
                            />
                            <Button icon={<DownloadOutlined />} onClick={handleExportAudits} disabled={audits.length === 0}>
                                Export CSV
                            </Button>
                        </Space>
                        <Table
                            rowKey="id"
                            loading={auditLoading}
                            size="small"
                            pagination={false}
                            dataSource={audits}
                            columns={[
                                {
                                    title: "When",
                                    dataIndex: "created_at",
                                    key: "created_at",
                                    render: (v: string) => new Date(v).toLocaleString(),
                                },
                                {
                                    title: "Action",
                                    dataIndex: "action_type",
                                    key: "action_type",
                                },
                                {
                                    title: "Reason",
                                    dataIndex: "reason",
                                    key: "reason",
                                    render: (v: string | null) => v || "-",
                                },
                                {
                                    title: "Diff",
                                    key: "diff",
                                    render: (_: unknown, row: PermissionAuditItem) => (
                                        <Button icon={<DiffOutlined />} size="small" onClick={() => setSelectedAudit(row)}>
                                            View
                                        </Button>
                                    ),
                                },
                            ]}
                        />
                    </Card>

                    <Card title="Override Approvals" bordered={false} style={{ marginTop: 16 }}>
                        <Space direction="vertical" size={8} style={{ width: "100%", marginBottom: 12 }}>
                            <Select
                                allowClear
                                placeholder="Filter status"
                                value={approvalStatusFilter || undefined}
                                onChange={(v) => setApprovalStatusFilter((v as PermissionOverrideApprovalStatus) || "")}
                                options={[
                                    { label: "pending", value: "pending" },
                                    { label: "approved", value: "approved" },
                                    { label: "rejected", value: "rejected" },
                                ]}
                            />
                            <Switch
                                checked={approvalsOnlySelectedUser}
                                onChange={setApprovalsOnlySelectedUser}
                            />
                            <Text type="secondary">Show only selected user</Text>
                        </Space>
                        <Table
                            rowKey="id"
                            loading={approvalsLoading}
                            size="small"
                            pagination={false}
                            dataSource={approvals}
                            columns={[
                                {
                                    title: "When",
                                    dataIndex: "createdAt",
                                    key: "createdAt",
                                    render: (v: string) => new Date(v).toLocaleString(),
                                },
                                {
                                    title: "Status",
                                    dataIndex: "status",
                                    key: "status",
                                    render: (status: PermissionOverrideApprovalStatus) => approvalStatusTag(status),
                                },
                                {
                                    title: "Risk",
                                    dataIndex: "riskFlags",
                                    key: "riskFlags",
                                    render: (flags: string[]) => flags.length ? flags.join(", ") : "-",
                                },
                                {
                                    title: "Action",
                                    key: "action",
                                    render: (_: unknown, row: PermissionOverrideApprovalItem) => (
                                        <Space size={4}>
                                            <Button
                                                size="small"
                                                type="primary"
                                                icon={<CheckCircleOutlined />}
                                                disabled={row.status !== "pending"}
                                                loading={approvalActionLoadingId === row.id}
                                                onClick={() =>
                                                    Modal.confirm({
                                                        title: "Approve permission request?",
                                                        centered: true,
                                                        onOk: () => handleApprove(row),
                                                    })
                                                }
                                            >
                                                Approve
                                            </Button>
                                            <Button
                                                size="small"
                                                danger
                                                icon={<StopOutlined />}
                                                disabled={row.status !== "pending"}
                                                loading={approvalActionLoadingId === row.id}
                                                onClick={() => openRejectModal(row)}
                                            >
                                                Reject
                                            </Button>
                                        </Space>
                                    ),
                                },
                            ]}
                        />
                    </Card>

                    <Card title="Phased Delivery" bordered={false} style={{ marginTop: 16 }}>
                        <Space direction="vertical" size={8}>
                            <Tag color="blue">Phase 1: RBAC baseline</Tag>
                            <Tag color="purple">Phase 2: user override active</Tag>
                            <Tag color="cyan">Phase 3: ABAC / policy engine</Tag>
                            <Tag color="green">Phase 4: simulator + audit trail</Tag>
                            <Tag color="orange">Phase 8: two-person approval</Tag>
                        </Space>
                    </Card>
                </Col>
            </Row>
            <Modal
                title="Permission Change Diff"
                open={!!selectedAudit}
                onCancel={() => setSelectedAudit(null)}
                footer={null}
                width={900}
            >
                {semanticDiffRows.length > 0 ? (
                    <Space direction="vertical" style={{ width: "100%" }} size={12}>
                        <Alert
                            type={riskSummary.level === "High" ? "error" : riskSummary.level === "Medium" ? "warning" : "info"}
                            showIcon
                            message={`Risk Score: ${riskSummary.total}`}
                            description={`Risk Level: ${riskSummary.level}`}
                        />
                        <Table
                            rowKey="key"
                            size="small"
                            pagination={false}
                            dataSource={semanticDiffRows}
                            columns={[
                                { title: "Page", dataIndex: "pageLabel", key: "pageLabel" },
                                { title: "Field", dataIndex: "field", key: "field" },
                                {
                                    title: "Change",
                                    dataIndex: "changeType",
                                    key: "changeType",
                                    render: (v: string) => {
                                        if (v === "Grant" || v === "Scope Widen") return <Tag color="red">{v}</Tag>;
                                        if (v === "Revoke" || v === "Scope Tighten") return <Tag color="green">{v}</Tag>;
                                        return <Tag>{v}</Tag>;
                                    },
                                },
                                { title: "Before", dataIndex: "before", key: "before" },
                                { title: "After", dataIndex: "after", key: "after" },
                                {
                                    title: "Risk",
                                    dataIndex: "riskLevel",
                                    key: "riskLevel",
                                    render: (risk: "none" | "low" | "medium" | "high") => riskTag(risk),
                                },
                            ]}
                        />
                    </Space>
                ) : (
                    <Row gutter={16}>
                        <Col span={12}>
                            <Text strong>Before</Text>
                            <pre style={{ background: "#f5f5f5", padding: 12, borderRadius: 8, maxHeight: 420, overflow: "auto" }}>
                                {JSON.stringify(selectedAudit?.payload_before ?? {}, null, 2)}
                            </pre>
                        </Col>
                        <Col span={12}>
                            <Text strong>After</Text>
                            <pre style={{ background: "#f5f5f5", padding: 12, borderRadius: 8, maxHeight: 420, overflow: "auto" }}>
                                {JSON.stringify(selectedAudit?.payload_after ?? {}, null, 2)}
                            </pre>
                        </Col>
                    </Row>
                )}
            </Modal>
            <Modal
                title="Reject Approval Request"
                open={rejectModalOpen}
                onCancel={() => {
                    setRejectModalOpen(false);
                    setRejectApprovalId("");
                    setRejectReason("");
                }}
                onOk={submitReject}
                okText="Reject"
                okButtonProps={{
                    danger: true,
                    loading: approvalActionLoadingId === rejectApprovalId,
                    disabled: rejectReason.trim().length < 3,
                }}
            >
                <Space direction="vertical" style={{ width: "100%" }} size={8}>
                    <Text type="secondary">Please provide a reason for rejection (at least 3 characters).</Text>
                    <Input.TextArea
                        value={rejectReason}
                        onChange={(event) => setRejectReason(event.target.value)}
                        rows={4}
                        maxLength={500}
                    />
                </Space>
            </Modal>
        </div>
    );
}
