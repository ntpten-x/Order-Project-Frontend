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
    Grid,
    Input,
    Modal,
    Progress,
    Row,
    Segmented,
    Space,
    Switch,
    Table,
    Tag,
    Spin,
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
    ReloadOutlined,
} from "@ant-design/icons";
import { roleService } from "../../../../services/roles.service";
import { permissionsService } from "../../../../services/permissions.service";
import { userService } from "../../../../services/users.service";
import { useAuth } from "../../../../contexts/AuthContext";
import { useEffectivePermissions } from "../../../../hooks/useEffectivePermissions";
import { Role } from "../../../../types/api/roles";
import { User } from "../../../../types/api/users";
import { ModalSelector } from "../../../../components/ui/select/ModalSelector";
import { AccessGuardFallback } from "../../../../components/pos/AccessGuard";
import { getCsrfTokenCached } from "../../../../utils/pos/csrf";
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
type SystemGroup = "main" | "pos" | "stock" | "users" | "branch" | "audit" | "other";
type ResourceKind = "menu" | "page";
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

const SYSTEM_FILTER_OPTIONS: Array<{ label: string; value: SystemGroup | "all" }> = [
    { label: "ทั้งหมด", value: "all" },
    { label: "หน้าหลัก (/)", value: "main" },
    { label: "POS", value: "pos" },
    { label: "Stock", value: "stock" },
    { label: "Users", value: "users" },
    { label: "Branch", value: "branch" },
    { label: "Audit", value: "audit" },
];

const MAIN_PAGE_LABEL_BY_RESOURCE_KEY: Record<string, string> = {
    "menu.module.pos": "ระบบขาย (POS)",
    "menu.module.stock": "จัดการสต๊อก",
    "menu.module.users": "ตั้งค่าและสิทธิ์ผู้ใช้",
    "menu.module.branch": "จัดการสาขา",
    "menu.module.audit": "Audit Logs",
};

const MENU_NAV_LABEL_BY_RESOURCE_KEY: Record<string, string> = {
    "menu.pos.home": "หน้าแรก",
    "menu.pos.sell": "ขาย",
    "menu.pos.orders": "ออเดอร์",
    "menu.pos.kitchen": "ครัว",
    "menu.pos.shift": "กะการทำงาน",
    "menu.pos.shiftHistory": "ประวัติกะ",
    "menu.pos.dashboard": "สรุป",
    "menu.pos.tables": "โต๊ะ",
    "menu.pos.delivery": "เดลิเวอรี่",
    "menu.pos.category": "หมวดหมู่",
    "menu.pos.products": "สินค้า",
    "menu.pos.productsUnit": "หน่วยสินค้า",
    "menu.pos.discounts": "ส่วนลด",
    "menu.pos.payment": "วิธีชำระเงิน",
    "menu.pos.settings": "ตั้งค่า",
    "menu.stock.home": "หน้าแรก",
    "menu.stock.buying": "สั่งซื้อ",
    "menu.stock.orders": "รายการ",
    "menu.stock.history": "ประวัติ",
    "menu.stock.ingredients": "วัตถุดิบ",
    "menu.stock.ingredientsUnit": "หน่วยวัตถุดิบ",
    "menu.users.home": "ผู้ใช้",
    "menu.branch.home": "สาขา",
    "menu.module.audit": "Audit Logs",
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
    if (scope === "all") return <Tag color="gold">ทุกข้อมูล</Tag>;
    if (scope === "branch") return <Tag color="blue">ตามสาขา</Tag>;
    if (scope === "own") return <Tag color="purple">เฉพาะของตนเอง</Tag>;
    return <Tag color="default">ไม่เห็นข้อมูล</Tag>;
}

function approvalStatusTag(status: PermissionOverrideApprovalStatus) {
    if (status === "approved") return <Tag color="green">อนุมัติแล้ว</Tag>;
    if (status === "rejected") return <Tag color="red">ไม่อนุมัติ</Tag>;
    return <Tag color="orange">รออนุมัติ</Tag>;
}

function getResourceKind(resourceKey: string): ResourceKind {
    if (resourceKey in MAIN_PAGE_LABEL_BY_RESOURCE_KEY) return "page";
    return resourceKey.startsWith("menu.") ? "menu" : "page";
}

function getSystemGroup(resourceKey: string, route?: string): SystemGroup {
    const key = resourceKey.toLowerCase();
    const path = (route || "").toLowerCase();

    if (resourceKey in MAIN_PAGE_LABEL_BY_RESOURCE_KEY || path === "/" || path.startsWith("/?")) return "main";
    if (key.includes("stock") || path.startsWith("/stock")) return "stock";
    if (key.includes("pos") || path.startsWith("/pos")) return "pos";
    if (key.includes("audit") || path.startsWith("/audit")) return "audit";
    if (key.includes("branch") || path.startsWith("/branch")) return "branch";
    if (key.includes("users") || key.includes("permissions") || path.startsWith("/users")) return "users";
    return "other";
}

function systemGroupTag(group: SystemGroup) {
    if (group === "main") return <Tag color="magenta">หน้าหลัก</Tag>;
    if (group === "pos") return <Tag color="geekblue">POS</Tag>;
    if (group === "stock") return <Tag color="green">Stock</Tag>;
    if (group === "users") return <Tag color="purple">Users</Tag>;
    if (group === "branch") return <Tag color="gold">Branch</Tag>;
    if (group === "audit") return <Tag color="red">Audit</Tag>;
    return <Tag>อื่น ๆ</Tag>;
}

function resourceKindTag(kind: ResourceKind) {
    if (kind === "menu") return <Tag color="cyan">เมนู</Tag>;
    return <Tag color="blue">หน้าใช้งาน</Tag>;
}

function riskLevelLabel(level: string) {
    const normalized = String(level).toLowerCase();
    if (normalized === "high") return "สูง";
    if (normalized === "medium") return "กลาง";
    if (normalized === "low") return "ต่ำ";
    return "ไม่มี";
}

function changeTypeLabel(changeType: string) {
    if (changeType === "Grant") return "เพิ่มสิทธิ์";
    if (changeType === "Revoke") return "ลดสิทธิ์";
    if (changeType === "Scope Widen") return "ขยายขอบเขต";
    if (changeType === "Scope Tighten") return "จำกัดขอบเขต";
    return changeType;
}

function permissionFieldLabel(field: string) {
    if (field === "canAccess") return "เข้าใช้งาน";
    if (field === "canView") return "ดู";
    if (field === "canCreate") return "เพิ่ม";
    if (field === "canUpdate") return "แก้ไข";
    if (field === "canDelete") return "ลบ";
    if (field === "dataScope") return "ขอบเขตข้อมูล";
    return field;
}

function normalizeResourceToken(token: string) {
    const withSpaces = token
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/[_-]/g, " ")
        .trim();
    if (!withSpaces) return token;
    return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}

function fallbackPermissionLabel(resourceKey: string) {
    const parts = resourceKey.split(".").filter(Boolean);
    if (parts.length === 0) return resourceKey;
    if (parts[0] === "menu") {
        const menuPath = parts.slice(1).map(normalizeResourceToken).join(" > ");
        return menuPath ? `เมนู ${menuPath}` : "เมนู";
    }
    return parts.map(normalizeResourceToken).join(" > ");
}

function resolvePermissionLabel(resourceKey: string, pageLabel?: string | null) {
    const trimmed = (pageLabel ?? "").trim();
    return trimmed || fallbackPermissionLabel(resourceKey);
}

function mapPermissionRow(item: EffectiveRolePermissionRow): PermissionRow {
    return {
        ...item,
        key: item.resourceKey,
        pageLabel: resolvePermissionLabel(item.resourceKey, item.pageLabel),
        route: (item.route ?? "").trim(),
        canAccess: Boolean(item.canAccess),
        canView: Boolean(item.canView),
        canCreate: Boolean(item.canCreate),
        canUpdate: Boolean(item.canUpdate),
        canDelete: Boolean(item.canDelete),
        dataScope: (item.dataScope ?? "none") as PermissionScope,
    };
}

function normalizeRoleName(name?: string | null) {
    return String(name ?? "").trim().toLowerCase();
}

function getDefaultScopeByRoleName(roleName?: string | null): PermissionScope {
    const normalized = normalizeRoleName(roleName);
    if (normalized === "admin") return "all";
    if (normalized === "manager" || normalized === "employee") return "branch";
    return "own";
}

function resolvePageName(row: PermissionRow): string {
    const byMenu = MENU_NAV_LABEL_BY_RESOURCE_KEY[row.resourceKey];
    if (byMenu) return byMenu;
    const byResource = MAIN_PAGE_LABEL_BY_RESOURCE_KEY[row.resourceKey];
    if (byResource) return byResource;
    return resolvePermissionLabel(row.resourceKey, row.pageLabel);
}



export default function PermissionsPage() {
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;
    const { user: authUser } = useAuth();
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(authUser?.id) });
    const canViewPermissions = can("permissions.page", "view");
    const canUpdatePermissions = can("permissions.page", "update");
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
    const [tableSearch, setTableSearch] = useState("");
    const [systemFilter, setSystemFilter] = useState<SystemGroup | "all">("all");
    const isUserMode = targetType === "user";
    const isRoleMode = targetType === "role";
    const canEditPermissions = (isUserMode || isRoleMode) && canUpdatePermissions;
    const riskTag = (risk: "none" | "low" | "medium" | "high") => {
        if (risk === "high") return <Tag color="red">สูง</Tag>;
        if (risk === "medium") return <Tag color="orange">กลาง</Tag>;
        if (risk === "low") return <Tag color="green">ต่ำ</Tag>;
        return <Tag>ไม่มี</Tag>;
    };

    const isAdminUser = String(authUser?.role ?? "").toLowerCase() === "admin";

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
        if (!dirty) return [] as SemanticDiffRow[];
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
    }, [dirty, baselineRows, rows]);

    const pendingRiskSummary = useMemo(() => {
        const total = pendingDiffRows.reduce((acc, row) => acc + row.riskPoints, 0);
        const level =
            total >= 8 ? "High" :
                total >= 4 ? "Medium" :
                    total > 0 ? "Low" : "None";
        return { total, level };
    }, [pendingDiffRows]);

    const pendingChangeCount = pendingDiffRows.length;
    const editedResourceCount = useMemo(
        () => new Set(pendingDiffRows.map((row) => row.resourceKey)).size,
        [pendingDiffRows]
    );

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
                label: `${u.name || u.username} (${u.roles?.display_name || u.roles?.roles_name || "ไม่ระบุบทบาท"})`,
                value: u.id,
            })),
        [users]
    );

    const usersById = useMemo(() => {
        const map = new Map<string, User>();
        for (const u of users) {
            map.set(u.id, u);
        }
        return map;
    }, [users]);

    const selectedRoleName = useMemo(() => {
        if (isRoleMode) {
            const role = roles.find((r) => r.id === selectedRole);
            return role?.display_name || role?.roles_name || "";
        }
        const user = users.find((u) => u.id === selectedUser);
        return user?.roles?.display_name || user?.roles?.roles_name || "";
    }, [isRoleMode, roles, selectedRole, users, selectedUser]);

    const isAdminTarget = useMemo(() => normalizeRoleName(selectedRoleName) === "admin", [selectedRoleName]);

    const defaultViewScope = useMemo(() => getDefaultScopeByRoleName(selectedRoleName), [selectedRoleName]);

    const normalizeScopeByTargetRole = useCallback(
        (scope: PermissionScope, canView: boolean): PermissionScope => {
            if (!canView) return "none";
            if (isAdminTarget) return scope === "none" ? "all" : scope;
            if (scope === "all" || scope === "none") return "branch";
            return scope;
        },
        [isAdminTarget]
    );

    const filteredRows = useMemo(() => {
        const q = tableSearch.trim().toLowerCase();
        return rows.filter((row) => {
            const system = getSystemGroup(row.resourceKey, row.route);
            if (systemFilter !== "all" && system !== systemFilter) return false;
            if (!q) return true;
            return (
                row.resourceKey.toLowerCase().includes(q) ||
                (row.pageLabel || "").toLowerCase().includes(q) ||
                (row.route || "").toLowerCase().includes(q)
            );
        });
    }, [rows, tableSearch, systemFilter]);

    const selectedSystemLabel = useMemo(() => {
        if (systemFilter === "all") return "ทั้งหมด";
        return SYSTEM_FILTER_OPTIONS.find((item) => item.value === systemFilter)?.label || "ทั้งหมด";
    }, [systemFilter]);

    const pageRows = useMemo(
        () => filteredRows.filter((row) => getResourceKind(row.resourceKey) === "page"),
        [filteredRows]
    );

    const menuRows = useMemo(
        () => filteredRows.filter((row) => getResourceKind(row.resourceKey) === "menu"),
        [filteredRows]
    );

    const sectionSummary = useMemo(() => {
        const base = {
            total: rows.length,
            main: 0,
            pos: 0,
            stock: 0,
            users: 0,
            branch: 0,
            audit: 0,
            other: 0,
            menu: 0,
            page: 0,
        };
        for (const row of rows) {
            const system = getSystemGroup(row.resourceKey, row.route);
            const kind = getResourceKind(row.resourceKey);
            base[system] += 1;
            base[kind] += 1;
        }
        return base;
    }, [rows]);

    useEffect(() => {
        if (!authUser || !canViewPermissions || !isAdminUser) return;
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
                message.error(error instanceof Error ? error.message : "ไม่สามารถเริ่มต้นหน้าจัดการสิทธิ์ได้");
            }
        };
        bootstrap();
    }, [authUser, canViewPermissions, isAdminUser]);

    useEffect(() => {
        const loadRolePermissions = async () => {
            if (!selectedRole || targetType !== "role") return;
            setLoading(true);
            setDirty(false);
            try {
                const data = await permissionsService.getRoleEffectivePermissions(selectedRole);
                const mapped = data.permissions.map((item) => {
                    const row = mapPermissionRow(item);
                    return {
                        ...row,
                        dataScope: normalizeScopeByTargetRole(row.dataScope, row.canView),
                    };
                });
                setRows(mapped);
                setBaselineRows(mapped);
            } catch (error) {
                message.error(error instanceof Error ? error.message : "ไม่สามารถโหลดสิทธิ์ของบทบาทได้");
                setRows([]);
            } finally {
                setLoading(false);
            }
        };
        loadRolePermissions();
    }, [selectedRole, targetType, normalizeScopeByTargetRole]);

    useEffect(() => {
        const loadUserPermissions = async () => {
            if (!selectedUser || targetType !== "user") return;
            setLoading(true);
            setDirty(false);
            try {
                const data = await permissionsService.getUserEffectivePermissions(selectedUser);
                const mapped = data.permissions.map((item) => {
                    const row = mapPermissionRow(item);
                    return {
                        ...row,
                        dataScope: normalizeScopeByTargetRole(row.dataScope, row.canView),
                    };
                });
                setRows(mapped);
                setBaselineRows(mapped);
            } catch (error) {
                message.error(error instanceof Error ? error.message : "ไม่สามารถโหลดสิทธิ์ของผู้ใช้ได้");
                setRows([]);
            } finally {
                setLoading(false);
            }
        };
        loadUserPermissions();
    }, [selectedUser, targetType, normalizeScopeByTargetRole]);

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
            message.error(error instanceof Error ? error.message : "ไม่สามารถโหลดบันทึกการเปลี่ยนสิทธิ์ได้");
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
            message.error(error instanceof Error ? error.message : "ไม่สามารถโหลดรายการคำขออนุมัติได้");
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
            patch.dataScope = checked ? defaultViewScope : "none";
        }
        if (action === "create") patch.canCreate = checked;
        if (action === "update") patch.canUpdate = checked;
        if (action === "delete") patch.canDelete = checked;
        updateRow(key, patch);
    };

    const renderActionSwitch = (value: boolean, row: PermissionRow, action: "access" | "view" | "create" | "update" | "delete") => (
        <Switch
            checked={value}
            disabled={!canEditPermissions}
            size="small"
            onChange={(checked) => toggleAction(row.key, action, checked)}
        />
    );

    const pageColumns = [
        {
            title: "หน้า",
            key: "page",
            render: (_: unknown, row: PermissionRow) => (
                <Text strong>{resolvePageName(row)}</Text>
            ),
            width: 220,
        },
        {
            title: "ทรัพยากร",
            dataIndex: "pageLabel",
            key: "pageLabel",
            render: (value: string, row: PermissionRow) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{resolvePermissionLabel(row.resourceKey, value)}</Text>
                    <Text type="secondary">{row.route || row.resourceKey}</Text>
                </Space>
            ),
            width: 240,
        },
        {
            title: "ระบบ",
            key: "system",
            align: "center" as const,
            render: (_: unknown, row: PermissionRow) => systemGroupTag(getSystemGroup(row.resourceKey, row.route)),
            width: 130,
        },
        {
            title: "ประเภท",
            key: "kind",
            align: "center" as const,
            render: (_: unknown, row: PermissionRow) => resourceKindTag(getResourceKind(row.resourceKey)),
            width: 110,
        },
        {
            title: "เข้าใช้งาน",
            dataIndex: "canAccess",
            key: "canAccess",
            align: "center" as const,
            render: (value: boolean, row: PermissionRow) => renderActionSwitch(value, row, "access"),
            width: 100,
        },
        {
            title: "ดู",
            dataIndex: "canView",
            key: "canView",
            align: "center" as const,
            render: (value: boolean, row: PermissionRow) => renderActionSwitch(value, row, "view"),
            width: 90,
        },
        {
            title: "เพิ่ม",
            dataIndex: "canCreate",
            key: "canCreate",
            align: "center" as const,
            render: (value: boolean, row: PermissionRow) => renderActionSwitch(value, row, "create"),
            width: 90,
        },
        {
            title: "แก้ไข",
            dataIndex: "canUpdate",
            key: "canUpdate",
            align: "center" as const,
            render: (value: boolean, row: PermissionRow) => renderActionSwitch(value, row, "update"),
            width: 90,
        },
        {
            title: "ลบ",
            dataIndex: "canDelete",
            key: "canDelete",
            align: "center" as const,
            render: (value: boolean, row: PermissionRow) => renderActionSwitch(value, row, "delete"),
            width: 90,
        },
        {
            title: "ขอบเขตข้อมูล",
            dataIndex: "dataScope",
            key: "dataScope",
            render: (scope: PermissionScope, row: PermissionRow) => {
                if (!canEditPermissions) return scopeTag(scope);
                return (
                    <ModalSelector
                        value={scope}
                        title="เลือกขอบเขตข้อมูล"
                        onChange={(value) => updateRow(row.key, { dataScope: value as PermissionScope })}
                        options={[
                            { label: "ไม่เห็นข้อมูล", value: "none" },
                            { label: "เฉพาะของตนเอง", value: "own" },
                            { label: "ตามสาขา", value: "branch" },
                            ...(isAdminTarget ? [{ label: "ทุกข้อมูล", value: "all" }] : []),
                        ]}
                        style={{ width: "100%", minWidth: 130 }}
                        disabled={!row.canView}
                    />
                );
            },
            width: 150,
        },
    ];

    const menuColumns = [
        {
            title: "หน้า",
            key: "page",
            render: (_: unknown, row: PermissionRow) => (
                <Text strong>{resolvePageName(row)}</Text>
            ),
            width: 220,
        },
        {
            title: "ทรัพยากร",
            dataIndex: "resourceKey",
            key: "resourceKey",
            render: (value: string) => <Text type="secondary">{value}</Text>,
            width: 240,
        },
        {
            title: "ระบบ",
            key: "system",
            align: "center" as const,
            render: (_: unknown, row: PermissionRow) => systemGroupTag(getSystemGroup(row.resourceKey, row.route)),
            width: 130,
        },
        {
            title: "ประเภท",
            key: "kind",
            align: "center" as const,
            render: () => resourceKindTag("menu"),
            width: 110,
        },
        {
            title: "การมองเห็นเมนู",
            key: "menuVisibility",
            width: 180,
            render: (_: unknown, row: PermissionRow) => {
                const visible = row.canView || row.canAccess;
                if (!canEditPermissions) return <Tag color={visible ? "green" : "default"}>{visible ? "เห็น" : "ไม่เห็น"}</Tag>;
                return (
                    <ModalSelector
                        value={visible ? "visible" : "hidden"}
                        title="เลือกการมองเห็นเมนู"
                        onChange={(value) => {
                            const canSee = value === "visible";
                            updateRow(row.key, {
                                canAccess: canSee,
                                canView: canSee,
                                dataScope: canSee ? defaultViewScope : "none",
                            });
                        }}
                        options={[
                            { label: "ไม่เห็น", value: "hidden" },
                            { label: "เห็น", value: "visible" },
                        ]}
                        style={{ width: "100%", minWidth: 140 }}
                    />
                );
            },
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
        const mapped = data.permissions.map(mapPermissionRow);
        setRows(mapped);
        setBaselineRows(mapped);
        setDirty(false);
    }, [selectedUser, targetType]);

    const saveDisabled = isUserMode
        ? (
            !selectedUser ||
            !dirty ||
            (pendingRiskSummary.level === "High" && saveReason.trim().length < 10) ||
            (pendingRiskSummary.level === "High" && !highRiskConfirmed)
        )
        : (
            !selectedRole ||
            !dirty
        );

    const handleSavePermissions = async () => {
        if (!dirty) return;
        const normalizedReason = saveReason.trim();
        const reasonPayload = normalizedReason.length >= 3 ? normalizedReason : undefined;

        const serializedPermissions = rows.map((row) => ({
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

        if (isRoleMode) {
            if (!selectedRole) return;
            setSaving(true);
            try {
                const csrfToken = await getCsrfTokenCached();
                await permissionsService.updateRolePermissions(
                    selectedRole,
                    {
                        permissions: serializedPermissions,
                        reason: reasonPayload,
                    },
                    csrfToken
                );
                setDirty(false);
                setBaselineRows(rows);
                setSaveReason("");
                setHighRiskConfirmed(false);
                setLastApprovalRequestId("");
                message.success("บันทึกแม่แบบบทบาทเรียบร้อย");
            } catch (error) {
                message.error(error instanceof Error ? error.message : "บันทึกแม่แบบบทบาทไม่สำเร็จ");
            } finally {
                setSaving(false);
            }
            return;
        }

        if (!selectedUser) return;
        if (pendingRiskSummary.level === "High" && saveReason.trim().length < 10) {
            message.error("การเปลี่ยนแปลงความเสี่ยงสูง ต้องระบุเหตุผลอย่างน้อย 10 ตัวอักษร");
            return;
        }
        if (pendingRiskSummary.level === "High" && !highRiskConfirmed) {
            message.error("การเปลี่ยนแปลงความเสี่ยงสูง ต้องยืนยันโดยผู้ดูแลระบบก่อนบันทึก");
            return;
        }

        const doSave = async () => {
            setSaving(true);
            try {
                const csrfToken = await getCsrfTokenCached();
                const result = await permissionsService.updateUserPermissions(
                    selectedUser,
                    {
                        permissions: serializedPermissions,
                        reason: reasonPayload,
                    },
                    csrfToken
                );

                setSaveReason("");
                setHighRiskConfirmed(false);

                if (result.updated && !result.approvalRequired) {
                    setDirty(false);
                    setBaselineRows(rows);
                    message.success("บันทึกสิทธิ์ผู้ใช้เรียบร้อย");
                } else if (!result.updated && result.approvalRequired) {
                    setLastApprovalRequestId(result.approvalRequest.id);
                    message.warning(`ส่งคำขออนุมัติแล้ว (${result.approvalRequest.id})`);
                    await reloadSelectedUserEffective();
                }

                await Promise.all([loadAudits(), loadApprovals()]);
            } catch (error) {
                message.error(error instanceof Error ? error.message : "บันทึกสิทธิ์ผู้ใช้ไม่สำเร็จ");
            } finally {
                setSaving(false);
            }
        };

        if (pendingRiskSummary.total > 0) {
            Modal.confirm({
                title: "ยืนยันการบันทึกสิทธิ์",
                content: `การเปลี่ยนแปลงนี้มีความเสี่ยงระดับ ${riskLevelLabel(pendingRiskSummary.level)} (คะแนน ${pendingRiskSummary.total}) ต้องการดำเนินการต่อหรือไม่`,
                okText: "ยืนยัน",
                cancelText: "ยกเลิก",
                centered: true,
                onOk: doSave,
            });
            return;
        }

        await doSave();
    };

    const handleResetUnsavedChanges = () => {
        if (!dirty) return;
        setRows(baselineRows.map((row) => ({ ...row })));
        setDirty(false);
        setHighRiskConfirmed(false);
        setSaveReason("");
        message.success(`ล้างการแก้ไขที่ยังไม่บันทึกแล้ว (${pendingChangeCount} รายการเปลี่ยนแปลง)`);
    };

    const handleApprove = async (approval: PermissionOverrideApprovalItem) => {
        if (authUser?.id && approval.requestedByUserId === authUser.id) {
            message.warning("ไม่สามารถอนุมัติคำขอของตนเองได้ (Two-person approval required)");
            return;
        }
        setApprovalActionLoadingId(approval.id);
        try {
            const csrfToken = await getCsrfTokenCached();
            await permissionsService.approveOverride(approval.id, {}, csrfToken);
            message.success("อนุมัติคำขอเรียบร้อย");
            if (selectedUser && approval.targetUserId === selectedUser) {
                await reloadSelectedUserEffective();
            }
            await Promise.all([loadAudits(), loadApprovals()]);
        } catch (error) {
            message.error(error instanceof Error ? error.message : "ไม่สามารถอนุมัติคำขอได้");
        } finally {
            setApprovalActionLoadingId("");
        }
    };

    const openRejectModal = (approval: PermissionOverrideApprovalItem) => {
        if (authUser?.id && approval.requestedByUserId === authUser.id) {
            message.warning("ไม่สามารถรีวิวคำขอของตนเองได้ (Two-person approval required)");
            return;
        }
        setRejectApprovalId(approval.id);
        setRejectReason("");
        setRejectModalOpen(true);
    };

    const submitReject = async () => {
        if (!rejectApprovalId) return;
        if (rejectReason.trim().length < 3) {
            message.error("เหตุผลการไม่อนุมัติต้องมีอย่างน้อย 3 ตัวอักษร");
            return;
        }
        setApprovalActionLoadingId(rejectApprovalId);
        try {
            const csrfToken = await getCsrfTokenCached();
            await permissionsService.rejectOverride(
                rejectApprovalId,
                { reviewReason: rejectReason.trim() },
                csrfToken
            );
            setRejectModalOpen(false);
            setRejectApprovalId("");
            setRejectReason("");
            message.success("ไม่อนุมัติคำขอเรียบร้อย");
            await Promise.all([loadAudits(), loadApprovals()]);
        } catch (error) {
            message.error(error instanceof Error ? error.message : "ไม่สามารถไม่อนุมัติคำขอได้");
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
            message.error(error instanceof Error ? error.message : "จำลองสิทธิ์ไม่สำเร็จ");
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

    if (permissionLoading) {
        return (
            <div style={{ minHeight: "70vh", display: "grid", placeItems: "center" }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!authUser || !canViewPermissions || !isAdminUser) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้" tone="danger" />;
    }

    return (
        <div style={{ padding: isMobile ? 12 : 24, background: "#f6f8fb", minHeight: "100vh" }}>
            <Row gutter={[isMobile ? 12 : 16, isMobile ? 12 : 16]}>
                <Col span={24}>
                    <Card bordered={false}>
                        <Space direction="vertical" size={4} style={{ width: "100%" }}>
                            <Space align="center" wrap>
                                <SafetyCertificateOutlined style={{ color: "#2563eb", fontSize: 20 }} />
                                <Title level={isMobile ? 4 : 3} style={{ margin: 0 }}>
                                    จัดการสิทธิ์ผู้ใช้งาน
                                </Title>
                                <Badge status="processing" text="ระบบอนุมัติ 2 ชั้น" />
                            </Space>
                            <Text type="secondary">
                                กำหนดสิทธิ์การเข้าถึงแบบละเอียด แยกตามระบบ POS/Stock และแยกประเภท เมนู/หน้าใช้งาน ได้ในหน้าเดียว
                            </Text>
                        </Space>
                    </Card>
                </Col>

                <Col xs={24} lg={16}>
                    <Card
                        title={
                            <Space>
                                <ControlOutlined />
                                <span>ตารางกำหนดสิทธิ์</span>
                            </Space>
                        }
                        extra={!isMobile ? (
                            <Space>
                                <Button
                                    icon={<ReloadOutlined />}
                                    onClick={handleResetUnsavedChanges}
                                    disabled={!dirty || saving}
                                >
                                    รีเฟรช ({pendingChangeCount})
                                </Button>
                                <Button
                                    type="primary"
                                    onClick={handleSavePermissions}
                                    disabled={saveDisabled}
                                    loading={saving}
                                >
                                    {isRoleMode ? "บันทึกแม่แบบบทบาท" : "บันทึกสิทธิ์เฉพาะผู้ใช้"}
                                </Button>
                            </Space>
                        ) : undefined}
                        bordered={false}
                    >
                        <Space direction="vertical" style={{ width: "100%" }} size={12}>
                            {isMobile && (
                                <Space style={{ width: "100%" }}>
                                    <Button
                                        icon={<ReloadOutlined />}
                                        onClick={handleResetUnsavedChanges}
                                        disabled={!dirty || saving}
                                        style={{ flex: 1 }}
                                    >
                                        รีเฟรช ({pendingChangeCount})
                                    </Button>
                                    <Button
                                        type="primary"
                                        onClick={handleSavePermissions}
                                        disabled={saveDisabled}
                                        loading={saving}
                                        style={{ flex: 1 }}
                                    >
                                        {isRoleMode ? "บันทึกแม่แบบบทบาท" : "บันทึกสิทธิ์เฉพาะผู้ใช้"}
                                    </Button>
                                </Space>
                            )}
                            <Segmented
                                value={targetType}
                                options={[
                                    {
                                        label: (
                                            <Space>
                                                <UserOutlined />
                                                ผู้ใช้
                                            </Space>
                                        ),
                                        value: "user",
                                    },
                                    {
                                        label: (
                                            <Space>
                                                <AppstoreOutlined />
                                                แม่แบบบทบาท
                                            </Space>
                                        ),
                                        value: "role",
                                    },
                                ]}
                                onChange={(value) => setTargetType(value as "user" | "role")}
                            />

                            {targetType === "user" ? (
                                <ModalSelector
                                    title="เลือกผู้ใช้"
                                    placeholder="เลือกผู้ใช้"
                                    value={selectedUser}
                                    onChange={setSelectedUser}
                                    options={userOptions}
                                    style={{ width: "100%", maxWidth: 420 }}
                                    showSearch
                                />
                            ) : (
                                <ModalSelector
                                    title="เลือกบทบาท"
                                    placeholder="เลือกบทบาท"
                                    value={selectedRole}
                                    onChange={setSelectedRole}
                                    options={roleOptions}
                                    style={{ width: "100%", maxWidth: 320 }}
                                />
                            )}

                            <Row gutter={[8, 8]}>
                                <Col xs={24} md={10}>
                                    <Input
                                        allowClear
                                        value={tableSearch}
                                        onChange={(event) => setTableSearch(event.target.value)}
                                        placeholder="ค้นหา ชื่อหน้า / เส้นทาง / resource key"
                                    />
                                </Col>
                                <Col xs={24} md={14}>
                                    <div style={{ overflowX: "auto", paddingBottom: 2 }}>
                                        <Space size={8} style={{ minWidth: "max-content" }}>
                                            {SYSTEM_FILTER_OPTIONS.map((opt) => (
                                                <Button
                                                    key={opt.value}
                                                    type={systemFilter === opt.value ? "primary" : "default"}
                                                    onClick={() => setSystemFilter(opt.value)}
                                                    style={{ whiteSpace: "nowrap" }}
                                                >
                                                    {opt.label}
                                                </Button>
                                            ))}
                                        </Space>
                                    </div>
                                </Col>
                            </Row>

                            <Row gutter={[8, 8]}>
                                <Col xs={12} md={4}>
                                    <Card size="small">
                                        <Text type="secondary">ทั้งหมด</Text>
                                        <Title level={5} style={{ margin: 0 }}>{sectionSummary.total}</Title>
                                    </Card>
                                </Col>
                                <Col xs={12} md={4}>
                                    <Card size="small">
                                        <Text type="secondary">หน้าหลัก</Text>
                                        <Title level={5} style={{ margin: 0 }}>{sectionSummary.main}</Title>
                                    </Card>
                                </Col>
                                <Col xs={12} md={4}>
                                    <Card size="small">
                                        <Text type="secondary">POS</Text>
                                        <Title level={5} style={{ margin: 0 }}>{sectionSummary.pos}</Title>
                                    </Card>
                                </Col>
                                <Col xs={12} md={4}>
                                    <Card size="small">
                                        <Text type="secondary">Stock</Text>
                                        <Title level={5} style={{ margin: 0 }}>{sectionSummary.stock}</Title>
                                    </Card>
                                </Col>
                                <Col xs={12} md={4}>
                                    <Card size="small">
                                        <Text type="secondary">เมนู</Text>
                                        <Title level={5} style={{ margin: 0 }}>{sectionSummary.menu}</Title>
                                    </Card>
                                </Col>
                                <Col xs={12} md={4}>
                                    <Card size="small">
                                        <Text type="secondary">หน้าใช้งาน</Text>
                                        <Title level={5} style={{ margin: 0 }}>{sectionSummary.page}</Title>
                                    </Card>
                                </Col>
                                <Col xs={12} md={4}>
                                    <Card size="small">
                                        <Text type="secondary">Users</Text>
                                        <Title level={5} style={{ margin: 0 }}>{sectionSummary.users}</Title>
                                    </Card>
                                </Col>
                                <Col xs={12} md={4}>
                                    <Card size="small">
                                        <Text type="secondary">Branch</Text>
                                        <Title level={5} style={{ margin: 0 }}>{sectionSummary.branch}</Title>
                                    </Card>
                                </Col>
                                <Col xs={12} md={4}>
                                    <Card size="small">
                                        <Text type="secondary">Audit</Text>
                                        <Title level={5} style={{ margin: 0 }}>{sectionSummary.audit}</Title>
                                    </Card>
                                </Col>
                            </Row>

                            {canEditPermissions && dirty && (
                                <Alert
                                    type="info"
                                    showIcon
                                    message="มีการเปลี่ยนแปลงที่ยังไม่บันทึก"
                                    description={`${isRoleMode ? "คุณได้แก้ไขแม่แบบบทบาทนี้แล้ว" : "คุณได้แก้ไขสิทธิ์เฉพาะของผู้ใช้นี้แล้ว"} (${pendingChangeCount} รายการเปลี่ยนแปลง / ${editedResourceCount} ทรัพยากร)`}
                                />
                            )}

                            {canEditPermissions && dirty && pendingRiskSummary.total > 0 && (
                                <Alert
                                    type={pendingRiskSummary.level === "High" ? "error" : pendingRiskSummary.level === "Medium" ? "warning" : "info"}
                                    showIcon
                                    message={`ความเสี่ยงปัจจุบัน: ${riskLevelLabel(pendingRiskSummary.level)} (คะแนน ${pendingRiskSummary.total})`}
                                    description="ระบบจะตรวจสอบความเสี่ยงและขอการยืนยันก่อนบันทึก"
                                />
                            )}

                            {isUserMode && lastApprovalRequestId && (
                                <Alert
                                    type="warning"
                                    showIcon
                                    closable
                                    onClose={() => setLastApprovalRequestId("")}
                                    message="ต้องรอการอนุมัติ"
                                    description={`ส่งคำขอแล้ว กำลังรอผู้อนุมัติ: ${lastApprovalRequestId}`}
                                />
                            )}

                            {isUserMode && dirty && pendingRiskSummary.level === "High" && (
                                <Alert
                                    type="error"
                                    showIcon
                                    message="ยืนยันโดยผู้ดูแลระบบ (ความเสี่ยงสูง)"
                                    description={
                                        <Space align="center">
                                            <Switch checked={highRiskConfirmed} onChange={setHighRiskConfirmed} />
                                            <Text>ฉันยืนยันและรับทราบการเปลี่ยนแปลงสิทธิ์ความเสี่ยงสูงนี้</Text>
                                        </Space>
                                    }
                                />
                            )}

                            {canEditPermissions && (
                                <Input
                                    value={saveReason}
                                    onChange={(e) => setSaveReason(e.target.value)}
                                    placeholder={
                                        isUserMode && pendingRiskSummary.level === "High"
                                            ? "เหตุผลสำหรับการเปลี่ยนแปลงความเสี่ยงสูง (อย่างน้อย 10 ตัวอักษร)"
                                            : "เหตุผลการเปลี่ยนสิทธิ์ (ไม่บังคับ)"
                                    }
                                    maxLength={500}
                                    status={isUserMode && pendingRiskSummary.level === "High" && saveReason.trim().length < 10 ? "error" : ""}
                                />
                            )}

                            <Card size="small" title={`ส่วนหน้า (${selectedSystemLabel})`} style={{ borderRadius: 12 }}>
                                <Table
                                    rowKey="key"
                                    columns={pageColumns}
                                    dataSource={pageRows}
                                    pagination={false}
                                    size="middle"
                                    scroll={{ x: 1500 }}
                                    loading={loading}
                                    locale={{ emptyText: `ไม่มีหน้าในระบบ ${selectedSystemLabel}` }}
                                />
                            </Card>

                            <Card size="small" title={`ส่วนเมนู (${selectedSystemLabel})`} style={{ borderRadius: 12 }}>
                                <Table
                                    rowKey="key"
                                    columns={menuColumns}
                                    dataSource={menuRows}
                                    pagination={false}
                                    size="middle"
                                    scroll={{ x: 980 }}
                                    loading={loading}
                                    locale={{ emptyText: `ไม่มีเมนูในระบบ ${selectedSystemLabel}` }}
                                />
                            </Card>
                        </Space>
                    </Card>
                </Col>

                <Col xs={24} lg={8}>
                    <Card
                        title={
                            <Space>
                                <DatabaseOutlined />
                                <span>สรุปนโยบายสิทธิ์</span>
                            </Space>
                        }
                        bordered={false}
                    >
                        <Space direction="vertical" size={12} style={{ width: "100%" }}>
                            <Text strong>ความครอบคลุมของสิทธิ์</Text>
                            <Progress percent={permissionCoverage} />
                            <Divider style={{ margin: "8px 0" }} />
                            <Alert
                                type="info"
                                showIcon
                                message="หลักการแก้ความขัดแย้ง"
                                description="หากมีสิทธิ์แบบปฏิเสธชัดเจน ระบบจะยึดปฏิเสธก่อนเสมอ"
                            />
                            <Alert
                                type="success"
                                showIcon
                                message="ระบบอนุมัติหลายขั้นเปิดใช้งานแล้ว"
                                description="รองรับสิทธิ์เฉพาะผู้ใช้, ตัวจำลองสิทธิ์, ประวัติการเปลี่ยนแปลง และอนุมัติ 2 ชั้น"
                            />
                            <Alert
                                type="warning"
                                showIcon
                                message="ขอบเขตข้อมูล"
                                description="ขอบเขตข้อมูลจะมีผลเมื่อเปิดสิทธิ์ ดู เท่านั้น"
                            />
                        </Space>
                    </Card>

                    <Card title="ตัวจำลองสิทธิ์" bordered={false} style={{ marginTop: 16 }}>
                        <Space direction="vertical" size={10} style={{ width: "100%" }}>
                            <ModalSelector
                                title="เลือกทรัพยากรที่ต้องการจำลอง"
                                placeholder="เลือกทรัพยากร"
                                value={simulateResource}
                                onChange={setSimulateResource}
                                options={rows.map((r) => ({
                                    label: `[${getSystemGroup(r.resourceKey, r.route).toUpperCase()}] ${getResourceKind(r.resourceKey) === "menu" ? "เมนู" : "หน้า"} - ${resolvePermissionLabel(r.resourceKey, r.pageLabel)}`,
                                    value: r.resourceKey,
                                }))}
                                showSearch
                            />
                            <ModalSelector
                                title="เลือกการกระทำ"
                                value={simulateAction}
                                onChange={(v) => setSimulateAction(v)}
                                options={[
                                    { label: "เข้าใช้งาน", value: "access" },
                                    { label: "ดู", value: "view" },
                                    { label: "เพิ่ม", value: "create" },
                                    { label: "แก้ไข", value: "update" },
                                    { label: "ลบ", value: "delete" },
                                ]}
                            />
                            <Button onClick={handleSimulate} loading={simulating} disabled={!selectedUser || !simulateResource} style={{ marginTop: 8 }}>
                                จำลองสิทธิ์
                            </Button>
                            {simulateResult && (
                                <Alert
                                    type={simulateResult.allowed ? "success" : "error"}
                                    showIcon
                                    message={simulateResult.allowed ? "อนุญาต" : "ไม่อนุญาต"}
                                    description={`ขอบเขตข้อมูล: ${simulateResult.scope}`}
                                />
                            )}
                        </Space>
                    </Card>

                    <Card title="บันทึกการเปลี่ยนสิทธิ์" bordered={false} style={{ marginTop: 16 }}>
                        <Space direction="vertical" size={8} style={{ width: "100%", marginBottom: 12 }}>
                            <ModalSelector
                                title="กรองตามการกระทำ"
                                placeholder="กรองตามการกระทำ"
                                value={auditActionFilter}
                                onChange={(v) => setAuditActionFilter(v || "")}
                                options={[
                                    { label: "ทั้งหมด", value: "" },
                                    { label: "แก้ไขสิทธิ์เฉพาะผู้ใช้", value: "update_overrides" },
                                    { label: "ส่งคำขออนุมัติ", value: "override_update_request" },
                                    { label: "อนุมัติคำขอ", value: "override_update_approve" },
                                    { label: "ไม่อนุมัติคำขอ", value: "override_update_reject" },
                                ]}
                            />
                            <ModalSelector
                                title="กรองตามผู้ดำเนินการ"
                                placeholder="กรองตามผู้ดำเนินการ"
                                value={auditActorFilter}
                                onChange={(v) => setAuditActorFilter(v || "")}
                                options={[{ label: "ทั้งหมด", value: "" }, ...userOptions]}
                                showSearch
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
                                ส่งออก CSV
                            </Button>
                        </Space>
                        <Table
                            rowKey="id"
                            loading={auditLoading}
                            size="small"
                            pagination={false}
                            scroll={{ x: isMobile ? 720 : 860 }}
                            tableLayout="fixed"
                            dataSource={audits}
                            columns={[
                                {
                                    title: "เวลา",
                                    dataIndex: "created_at",
                                    key: "created_at",
                                    width: 170,
                                    render: (v: string) => (
                                        <Text style={{ whiteSpace: "nowrap" }}>
                                            {new Date(v).toLocaleString()}
                                        </Text>
                                    ),
                                },
                                {
                                    title: "การกระทำ",
                                    dataIndex: "action_type",
                                    key: "action_type",
                                    width: 180,
                                    ellipsis: true,
                                    render: (v: string) => (
                                        <Text
                                            ellipsis={{ tooltip: v || "-" }}
                                            style={{ maxWidth: 170, display: "inline-block" }}
                                        >
                                            {v || "-"}
                                        </Text>
                                    ),
                                },
                                {
                                    title: "เหตุผล",
                                    dataIndex: "reason",
                                    key: "reason",
                                    width: 320,
                                    ellipsis: true,
                                    render: (v: string | null) => (
                                        <Text
                                            ellipsis={{ tooltip: v || "-" }}
                                            style={{ maxWidth: 300, display: "inline-block" }}
                                        >
                                            {v || "-"}
                                        </Text>
                                    ),
                                },
                                {
                                    title: "รายละเอียด",
                                    key: "diff",
                                    width: 140,
                                    align: "center",
                                    render: (_: unknown, row: PermissionAuditItem) => (
                                        <Button icon={<DiffOutlined />} size="small" onClick={() => setSelectedAudit(row)}>
                                            ดู Diff
                                        </Button>
                                    ),
                                },
                            ]}
                        />
                    </Card>

                    <Card title="รายการอนุมัติสิทธิ์เฉพาะผู้ใช้" bordered={false} style={{ marginTop: 16 }}>
                        <Space direction="vertical" size={8} style={{ width: "100%", marginBottom: 12 }}>
                            <ModalSelector
                                title="กรองตามสถานะ"
                                placeholder="กรองตามสถานะ"
                                value={approvalStatusFilter}
                                onChange={(v) => setApprovalStatusFilter((v as PermissionOverrideApprovalStatus) || "")}
                                options={[
                                    { label: "ทั้งหมด", value: "" },
                                    { label: "รออนุมัติ", value: "pending" },
                                    { label: "อนุมัติแล้ว", value: "approved" },
                                    { label: "ไม่อนุมัติ", value: "rejected" },
                                ]}
                            />
                            <Switch
                                checked={approvalsOnlySelectedUser}
                                onChange={setApprovalsOnlySelectedUser}
                            />
                            <Text type="secondary">แสดงเฉพาะผู้ใช้ที่เลือก</Text>
                        </Space>
                        <Table
                            rowKey="id"
                            loading={approvalsLoading}
                            size="small"
                            pagination={false}
                            scroll={{ x: isMobile ? 980 : 1120 }}
                            tableLayout="fixed"
                            dataSource={approvals}
                            columns={[
                                {
                                    title: "เวลา",
                                    dataIndex: "createdAt",
                                    key: "createdAt",
                                    width: 170,
                                    render: (v: string) => (
                                        <Text style={{ whiteSpace: "nowrap" }}>
                                            {new Date(v).toLocaleString()}
                                        </Text>
                                    ),
                                },
                                {
                                    title: "ผู้ส่งคำขอ",
                                    dataIndex: "requestedByUserId",
                                    key: "requestedByUserId",
                                    width: 260,
                                    render: (requestedByUserId: string) => {
                                        const requester = usersById.get(requestedByUserId);
                                        const username = requester?.username || requester?.name || "-";
                                        return (
                                            <Space direction="vertical" size={0}>
                                                <Text strong ellipsis={{ tooltip: username }} style={{ maxWidth: 230 }}>
                                                    {username}
                                                </Text>
                                                <Text type="secondary" ellipsis={{ tooltip: requestedByUserId }} style={{ maxWidth: 230 }}>
                                                    ID: {requestedByUserId}
                                                </Text>
                                            </Space>
                                        );
                                    },
                                },
                                {
                                    title: "สถานะ",
                                    dataIndex: "status",
                                    key: "status",
                                    width: 120,
                                    align: "center",
                                    render: (status: PermissionOverrideApprovalStatus) => approvalStatusTag(status),
                                },
                                {
                                    title: "ความเสี่ยง",
                                    dataIndex: "riskFlags",
                                    key: "riskFlags",
                                    width: 280,
                                    ellipsis: true,
                                    render: (flags: string[]) => {
                                        const text = flags.length ? flags.join(", ") : "-";
                                        return (
                                            <Text
                                                ellipsis={{ tooltip: text }}
                                                style={{ maxWidth: 260, display: "inline-block" }}
                                            >
                                                {text}
                                            </Text>
                                        );
                                    },
                                },
                                {
                                    title: "ดำเนินการ",
                                    key: "action",
                                    width: 260,
                                    render: (_: unknown, row: PermissionOverrideApprovalItem) => {
                                        const selfReviewBlocked = Boolean(authUser?.id && row.requestedByUserId === authUser.id);
                                        const disableAction = row.status !== "pending" || selfReviewBlocked;
                                        return (
                                            <Space size={4}>
                                                <Button
                                                    size="small"
                                                    type="primary"
                                                    icon={<CheckCircleOutlined />}
                                                    disabled={disableAction}
                                                    loading={approvalActionLoadingId === row.id}
                                                    title={selfReviewBlocked ? "คำขอนี้ถูกส่งโดยผู้ใช้ปัจจุบัน จึงรีวิวเองไม่ได้" : undefined}
                                                    onClick={() =>
                                                        Modal.confirm({
                                                            title: "ยืนยันอนุมัติคำขอนี้หรือไม่",
                                                            centered: true,
                                                            onOk: () => handleApprove(row),
                                                        })
                                                    }
                                                >
                                                    อนุมัติ
                                                </Button>
                                                <Button
                                                    size="small"
                                                    danger
                                                    icon={<StopOutlined />}
                                                    disabled={disableAction}
                                                    loading={approvalActionLoadingId === row.id}
                                                    title={selfReviewBlocked ? "คำขอนี้ถูกส่งโดยผู้ใช้ปัจจุบัน จึงรีวิวเองไม่ได้" : undefined}
                                                    onClick={() => openRejectModal(row)}
                                                >
                                                    ไม่อนุมัติ
                                                </Button>
                                            </Space>
                                        );
                                    },
                                },
                            ]}
                        />
                    </Card>

                    <Card title="สถานะฟีเจอร์ความปลอดภัย" bordered={false} style={{ marginTop: 16 }}>
                        <Space direction="vertical" size={8}>
                            <Tag color="blue">Phase 1: โครง RBAC พื้นฐาน</Tag>
                            <Tag color="purple">Phase 2: สิทธิ์เฉพาะผู้ใช้ (Override)</Tag>
                            <Tag color="cyan">Phase 3: Policy Engine / ABAC</Tag>
                            <Tag color="green">Phase 4: จำลองสิทธิ์ + Audit Trail</Tag>
                            <Tag color="orange">Phase 8: อนุมัติ 2 ชั้น</Tag>
                        </Space>
                    </Card>
                </Col>
            </Row>
            <Modal
                title="รายละเอียดความแตกต่างของสิทธิ์"
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
                            message={`คะแนนความเสี่ยง: ${riskSummary.total}`}
                            description={`ระดับความเสี่ยง: ${riskLevelLabel(riskSummary.level)}`}
                        />
                        <Table
                            rowKey="key"
                            size="small"
                            pagination={false}
                            dataSource={semanticDiffRows}
                            columns={[
                                { title: "ทรัพยากร", dataIndex: "pageLabel", key: "pageLabel" },
                                {
                                    title: "ฟิลด์",
                                    dataIndex: "field",
                                    key: "field",
                                    render: (value: string) => permissionFieldLabel(value),
                                },
                                {
                                    title: "การเปลี่ยนแปลง",
                                    dataIndex: "changeType",
                                    key: "changeType",
                                    render: (v: string) => {
                                        if (v === "Grant" || v === "Scope Widen") return <Tag color="red">{changeTypeLabel(v)}</Tag>;
                                        if (v === "Revoke" || v === "Scope Tighten") return <Tag color="green">{changeTypeLabel(v)}</Tag>;
                                        return <Tag>{changeTypeLabel(v)}</Tag>;
                                    },
                                },
                                { title: "ค่าเดิม", dataIndex: "before", key: "before" },
                                { title: "ค่าใหม่", dataIndex: "after", key: "after" },
                                {
                                    title: "ความเสี่ยง",
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
                            <Text strong>ก่อนเปลี่ยน</Text>
                            <pre style={{ background: "#f5f5f5", padding: 12, borderRadius: 8, maxHeight: 420, overflow: "auto" }}>
                                {JSON.stringify(selectedAudit?.payload_before ?? {}, null, 2)}
                            </pre>
                        </Col>
                        <Col span={12}>
                            <Text strong>หลังเปลี่ยน</Text>
                            <pre style={{ background: "#f5f5f5", padding: 12, borderRadius: 8, maxHeight: 420, overflow: "auto" }}>
                                {JSON.stringify(selectedAudit?.payload_after ?? {}, null, 2)}
                            </pre>
                        </Col>
                    </Row>
                )}
            </Modal>
            <Modal
                title="ไม่อนุมัติคำขอเปลี่ยนสิทธิ์"
                open={rejectModalOpen}
                onCancel={() => {
                    setRejectModalOpen(false);
                    setRejectApprovalId("");
                    setRejectReason("");
                }}
                onOk={submitReject}
                okText="ยืนยันไม่อนุมัติ"
                okButtonProps={{
                    danger: true,
                    loading: approvalActionLoadingId === rejectApprovalId,
                    disabled: rejectReason.trim().length < 3,
                }}
            >
                <Space direction="vertical" style={{ width: "100%" }} size={8}>
                    <Text type="secondary">กรุณาระบุเหตุผลการไม่อนุมัติ อย่างน้อย 3 ตัวอักษร</Text>
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
