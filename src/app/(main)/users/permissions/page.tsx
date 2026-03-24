"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
    ArrowLeftOutlined,
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
import { downloadBlob } from "../../../../utils/browser/download";
import {
    PRINT_SETTINGS_CAPABILITIES,
    PRINT_SETTINGS_ROLE_BLUEPRINT,
    getPrintSettingsCapability,
    isPrintSettingsCapabilityResource,
} from "../../../../lib/rbac/print-settings-capabilities";
import {
    CATEGORY_CAPABILITIES,
    CATEGORY_ROLE_BLUEPRINT,
    getCategoryCapability,
    isCategoryCapabilityResource,
} from "../../../../lib/rbac/category-capabilities";
import {
    DELIVERY_CAPABILITIES,
    DELIVERY_ROLE_BLUEPRINT,
    getDeliveryCapability,
    isDeliveryCapabilityResource,
} from "../../../../lib/rbac/delivery-capabilities";
import {
    DISCOUNTS_CAPABILITIES,
    DISCOUNTS_ROLE_BLUEPRINT,
    getDiscountsCapability,
    isDiscountsCapabilityResource,
} from "../../../../lib/rbac/discounts-capabilities";
import {
    PAYMENT_METHOD_CAPABILITIES,
    PAYMENT_METHOD_ROLE_BLUEPRINT,
    getPaymentMethodCapability,
    isPaymentMethodCapabilityResource,
} from "../../../../lib/rbac/payment-method-capabilities";
import {
    SETTINGS_CAPABILITIES,
    SETTINGS_ROLE_BLUEPRINT,
    getSettingsCapability,
    isSettingsCapabilityResource,
} from "../../../../lib/rbac/settings-capabilities";
import {
    PRODUCTS_UNIT_CAPABILITIES,
    PRODUCTS_UNIT_ROLE_BLUEPRINT,
    getProductsUnitCapability,
    isProductsUnitCapabilityResource,
} from "../../../../lib/rbac/products-unit-capabilities";
import {
    PRODUCTS_CAPABILITIES,
    PRODUCTS_ROLE_BLUEPRINT,
    getProductsCapability,
    isProductsCapabilityResource,
} from "../../../../lib/rbac/products-capabilities";
import {
    SHIFT_HISTORY_CAPABILITIES,
    SHIFT_HISTORY_ROLE_BLUEPRINT,
    getShiftHistoryCapability,
    isShiftHistoryCapabilityResource,
} from "../../../../lib/rbac/shift-history-capabilities";
import {
    SHIFT_CAPABILITIES,
    SHIFT_ROLE_BLUEPRINT,
    getShiftCapability,
    isShiftCapabilityResource,
} from "../../../../lib/rbac/shift-capabilities";
import {
    DASHBOARD_CAPABILITIES,
    DASHBOARD_ROLE_BLUEPRINT,
    getDashboardCapability,
    isDashboardCapabilityResource,
} from "../../../../lib/rbac/dashboard-capabilities";
import {
    QR_CODE_CAPABILITIES,
    QR_CODE_ROLE_BLUEPRINT,
    getQrCodeCapability,
    isQrCodeCapabilityResource,
} from "../../../../lib/rbac/qr-code-capabilities";
import {
    TABLES_CAPABILITIES,
    TABLES_ROLE_BLUEPRINT,
    getTablesCapability,
    isTablesCapabilityResource,
} from "../../../../lib/rbac/tables-capabilities";
import {
    TOPPING_GROUP_CAPABILITIES,
    TOPPING_GROUP_ROLE_BLUEPRINT,
    getToppingGroupCapability,
    isToppingGroupCapabilityResource,
} from "../../../../lib/rbac/topping-group-capabilities";
import {
    TOPPING_CAPABILITIES,
    TOPPING_ROLE_BLUEPRINT,
    getToppingCapability,
    isToppingCapabilityResource,
} from "../../../../lib/rbac/topping-capabilities";
import {
    ORDER_WORKFLOW_CAPABILITIES,
    ORDER_WORKFLOW_ROLE_BLUEPRINT,
    getOrderWorkflowCapability,
    isOrderWorkflowCapabilityResource,
} from "../../../../lib/rbac/order-workflow-capabilities";
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
type SystemGroup = "main" | "print" | "qr" | "settings" | "pos" | "stock" | "users" | "branch" | "audit" | "other";
type ResourceKind = "menu" | "page" | "feature";
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
    { label: "Print Setting", value: "print" },
    { label: "QR Code", value: "qr" },
    { label: "POS Settings", value: "settings" },
    { label: "POS", value: "pos" },
    { label: "Stock", value: "stock" },
    { label: "Users", value: "users" },
    { label: "Branch", value: "branch" },
    { label: "Audit", value: "audit" },
];

const MAIN_PAGE_LABEL_BY_RESOURCE_KEY: Record<string, string> = {
    "menu.module.pos": "ระบบขาย (POS)",
    "menu.module.stock": "จัดการสต๊อก",
    "menu.module.print": "ตั้งค่าการพิมพ์",
    "menu.module.print-setting": "ตั้งค่าการพิมพ์",
    "menu.module.users": "ตั้งค่าและสิทธิ์ผู้ใช้",
    "menu.module.branch": "จัดการสาขา",
    "menu.module.audit": "Audit Logs",
};

const MENU_NAV_LABEL_BY_RESOURCE_KEY: Record<string, string> = {
    "menu.pos.home": "หน้าแรก",
    "menu.pos.sell": "ขาย",
    "menu.pos.orders": "ออเดอร์",
    "menu.pos.shift": "กะการทำงาน",
    "menu.pos.shiftHistory": "ประวัติกะ",
    "menu.pos.dashboard": "สรุป",
    "menu.pos.tables": "โต๊ะ",
    "menu.pos.delivery": "เดลิเวอรี่",
    "menu.pos.category": "หมวดหมู่",
    "menu.pos.products": "สินค้า",
    "menu.pos.productsUnit": "หน่วยสินค้า",
    "menu.pos.topping": "ท็อปปิ้ง",
    "menu.pos.toppingGroup": "กลุ่มท็อปปิ้ง",
    "menu.pos.discounts": "ส่วนลด",
    "menu.pos.payment": "วิธีชำระเงิน",
    "menu.pos.settings": "ตั้งค่า",
    "menu.stock.home": "หน้าแรก",
    "menu.stock.buying": "สั่งซื้อ",
    "menu.stock.orders": "รายการ",
    "menu.stock.history": "ประวัติ",
    "menu.stock.ingredients": "วัตถุดิบ",
    "menu.stock.category": "หมวดหมู่วัตถุดิบ",
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
    if (resourceKey.endsWith(".feature")) return "feature";
    return resourceKey.startsWith("menu.") ? "menu" : "page";
}

function getSystemGroup(resourceKey: string, route?: string): SystemGroup {
    const key = resourceKey.toLowerCase();
    const path = (route || "").toLowerCase();

    if (key.includes("print_settings") || key.includes("menu.module.print") || path.startsWith("/print-setting")) return "print";
    if (key.includes("qr_code") || path.startsWith("/pos/qr-code") || path.startsWith("/pos/takeaway-qr")) return "qr";
    if (key.includes("pos_settings") || key.includes("shop_profile") || key.includes("payment_accounts") || path.startsWith("/pos/settings")) return "settings";
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
    if (group === "print") return <Tag color="orange">Print Setting</Tag>;
    if (group === "qr") return <Tag color="cyan">QR Code</Tag>;
    if (group === "settings") return <Tag color="blue">POS Settings</Tag>;
    if (group === "pos") return <Tag color="geekblue">POS</Tag>;
    if (group === "stock") return <Tag color="green">Stock</Tag>;
    if (group === "users") return <Tag color="purple">Users</Tag>;
    if (group === "branch") return <Tag color="gold">Branch</Tag>;
    if (group === "audit") return <Tag color="red">Audit</Tag>;
    return <Tag>อื่น ๆ</Tag>;
}

function resourceKindTag(kind: ResourceKind) {
    if (kind === "menu") return <Tag color="cyan">เมนู</Tag>;
    if (kind === "feature") return <Tag color="volcano">Capability</Tag>;
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
    const orderWorkflowCapability = getOrderWorkflowCapability(resourceKey);
    if (orderWorkflowCapability) return orderWorkflowCapability.title;
    const settingsCapability = getSettingsCapability(resourceKey);
    if (settingsCapability) return settingsCapability.title;
    const shiftCapability = getShiftCapability(resourceKey);
    if (shiftCapability) return shiftCapability.title;
    const toppingGroupCapability = getToppingGroupCapability(resourceKey);
    if (toppingGroupCapability) return toppingGroupCapability.title;
    const toppingCapability = getToppingCapability(resourceKey);
    if (toppingCapability) return toppingCapability.title;
    const tablesCapability = getTablesCapability(resourceKey);
    if (tablesCapability) return tablesCapability.title;
    const qrCodeCapability = getQrCodeCapability(resourceKey);
    if (qrCodeCapability) return qrCodeCapability.title;
    const shiftHistoryCapability = getShiftHistoryCapability(resourceKey);
    if (shiftHistoryCapability) return shiftHistoryCapability.title;
    const dashboardCapability = getDashboardCapability(resourceKey);
    if (dashboardCapability) return dashboardCapability.title;
    const printCapability = getPrintSettingsCapability(resourceKey);
    if (printCapability) return printCapability.title;
    const categoryCapability = getCategoryCapability(resourceKey);
    if (categoryCapability) return categoryCapability.title;
    const deliveryCapability = getDeliveryCapability(resourceKey);
    if (deliveryCapability) return deliveryCapability.title;
    const discountsCapability = getDiscountsCapability(resourceKey);
    if (discountsCapability) return discountsCapability.title;
    const paymentMethodCapability = getPaymentMethodCapability(resourceKey);
    if (paymentMethodCapability) return paymentMethodCapability.title;
    const productsCapability = getProductsCapability(resourceKey);
    if (productsCapability) return productsCapability.title;
    const productsUnitCapability = getProductsUnitCapability(resourceKey);
    if (productsUnitCapability) return productsUnitCapability.title;
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
    const router = useRouter();
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
            return role?.roles_name || role?.display_name || "";
        }
        const user = users.find((u) => u.id === selectedUser);
        return user?.roles?.roles_name || user?.roles?.display_name || "";
    }, [isRoleMode, roles, selectedRole, users, selectedUser]);

    const selectedOrderWorkflowRoleBlueprint = useMemo(
        () =>
            ORDER_WORKFLOW_ROLE_BLUEPRINT.find(
                (item) => normalizeRoleName(item.roleName) === normalizeRoleName(selectedRoleName)
            ) ?? null,
        [selectedRoleName]
    );

    const selectedRoleBlueprint = useMemo(
        () =>
            PRINT_SETTINGS_ROLE_BLUEPRINT.find(
                (item) => normalizeRoleName(item.roleName) === normalizeRoleName(selectedRoleName)
            ) ?? null,
        [selectedRoleName]
    );

    const selectedSettingsRoleBlueprint = useMemo(
        () =>
            SETTINGS_ROLE_BLUEPRINT.find(
                (item) => normalizeRoleName(item.roleName) === normalizeRoleName(selectedRoleName)
            ) ?? null,
        [selectedRoleName]
    );

    const selectedCategoryRoleBlueprint = useMemo(
        () =>
            CATEGORY_ROLE_BLUEPRINT.find(
                (item) => normalizeRoleName(item.roleName) === normalizeRoleName(selectedRoleName)
            ) ?? null,
        [selectedRoleName]
    );

    const selectedDeliveryRoleBlueprint = useMemo(
        () =>
            DELIVERY_ROLE_BLUEPRINT.find(
                (item) => normalizeRoleName(item.roleName) === normalizeRoleName(selectedRoleName)
            ) ?? null,
        [selectedRoleName]
    );

    const selectedDiscountsRoleBlueprint = useMemo(
        () =>
            DISCOUNTS_ROLE_BLUEPRINT.find(
                (item) => normalizeRoleName(item.roleName) === normalizeRoleName(selectedRoleName)
            ) ?? null,
        [selectedRoleName]
    );

    const selectedPaymentMethodRoleBlueprint = useMemo(
        () =>
            PAYMENT_METHOD_ROLE_BLUEPRINT.find(
                (item) => normalizeRoleName(item.roleName) === normalizeRoleName(selectedRoleName)
            ) ?? null,
        [selectedRoleName]
    );

    const selectedProductsUnitRoleBlueprint = useMemo(
        () =>
            PRODUCTS_UNIT_ROLE_BLUEPRINT.find(
                (item) => normalizeRoleName(item.roleName) === normalizeRoleName(selectedRoleName)
            ) ?? null,
        [selectedRoleName]
    );

    const selectedProductsRoleBlueprint = useMemo(
        () =>
            PRODUCTS_ROLE_BLUEPRINT.find(
                (item) => normalizeRoleName(item.roleName) === normalizeRoleName(selectedRoleName)
            ) ?? null,
        [selectedRoleName]
    );

    const selectedShiftRoleBlueprint = useMemo(
        () =>
            SHIFT_ROLE_BLUEPRINT.find(
                (item) => normalizeRoleName(item.roleName) === normalizeRoleName(selectedRoleName)
            ) ?? null,
        [selectedRoleName]
    );

    const selectedShiftHistoryRoleBlueprint = useMemo(
        () =>
            SHIFT_HISTORY_ROLE_BLUEPRINT.find(
                (item) => normalizeRoleName(item.roleName) === normalizeRoleName(selectedRoleName)
            ) ?? null,
        [selectedRoleName]
    );

    const selectedDashboardRoleBlueprint = useMemo(
        () =>
            DASHBOARD_ROLE_BLUEPRINT.find(
                (item) => normalizeRoleName(item.roleName) === normalizeRoleName(selectedRoleName)
            ) ?? null,
        [selectedRoleName]
    );

    const selectedQrCodeRoleBlueprint = useMemo(
        () =>
            QR_CODE_ROLE_BLUEPRINT.find(
                (item) => normalizeRoleName(item.roleName) === normalizeRoleName(selectedRoleName)
            ) ?? null,
        [selectedRoleName]
    );

    const selectedTablesRoleBlueprint = useMemo(
        () =>
            TABLES_ROLE_BLUEPRINT.find(
                (item) => normalizeRoleName(item.roleName) === normalizeRoleName(selectedRoleName)
            ) ?? null,
        [selectedRoleName]
    );

    const selectedToppingRoleBlueprint = useMemo(
        () =>
            TOPPING_ROLE_BLUEPRINT.find(
                (item) => normalizeRoleName(item.roleName) === normalizeRoleName(selectedRoleName)
            ) ?? null,
        [selectedRoleName]
    );

    const selectedToppingGroupRoleBlueprint = useMemo(
        () =>
            TOPPING_GROUP_ROLE_BLUEPRINT.find(
                (item) => normalizeRoleName(item.roleName) === normalizeRoleName(selectedRoleName)
            ) ?? null,
        [selectedRoleName]
    );

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

    const orderWorkflowRows = useMemo(
        () => rows.filter((row) => isOrderWorkflowCapabilityResource(row.resourceKey)),
        [rows]
    );

    const printSettingsRows = useMemo(
        () => rows.filter((row) => isPrintSettingsCapabilityResource(row.resourceKey)),
        [rows]
    );

    const settingsRows = useMemo(
        () => rows.filter((row) => isSettingsCapabilityResource(row.resourceKey)),
        [rows]
    );

    const categoryRows = useMemo(
        () => rows.filter((row) => isCategoryCapabilityResource(row.resourceKey)),
        [rows]
    );

    const deliveryRows = useMemo(
        () => rows.filter((row) => isDeliveryCapabilityResource(row.resourceKey)),
        [rows]
    );

    const discountsRows = useMemo(
        () => rows.filter((row) => isDiscountsCapabilityResource(row.resourceKey)),
        [rows]
    );

    const paymentMethodRows = useMemo(
        () => rows.filter((row) => isPaymentMethodCapabilityResource(row.resourceKey)),
        [rows]
    );

    const productsRows = useMemo(
        () => rows.filter((row) => isProductsCapabilityResource(row.resourceKey)),
        [rows]
    );

    const shiftRows = useMemo(
        () => rows.filter((row) => isShiftCapabilityResource(row.resourceKey)),
        [rows]
    );

    const shiftHistoryRows = useMemo(
        () => rows.filter((row) => isShiftHistoryCapabilityResource(row.resourceKey)),
        [rows]
    );

    const dashboardRows = useMemo(
        () => rows.filter((row) => isDashboardCapabilityResource(row.resourceKey)),
        [rows]
    );

    const productsUnitRows = useMemo(
        () => rows.filter((row) => isProductsUnitCapabilityResource(row.resourceKey)),
        [rows]
    );

    const qrCodeRows = useMemo(
        () => rows.filter((row) => isQrCodeCapabilityResource(row.resourceKey)),
        [rows]
    );

    const tablesRows = useMemo(
        () => rows.filter((row) => isTablesCapabilityResource(row.resourceKey)),
        [rows]
    );

    const toppingRows = useMemo(
        () => rows.filter((row) => isToppingCapabilityResource(row.resourceKey)),
        [rows]
    );

    const toppingGroupRows = useMemo(
        () => rows.filter((row) => isToppingGroupCapabilityResource(row.resourceKey)),
        [rows]
    );

    const printSettingsAllowedCount = useMemo(
        () => printSettingsRows.filter((row) => row.canAccess || row.canView || row.canUpdate).length,
        [printSettingsRows]
    );

    const orderWorkflowAllowedCount = useMemo(
        () => orderWorkflowRows.filter((row) => row.canAccess || row.canView || row.canCreate || row.canUpdate || row.canDelete).length,
        [orderWorkflowRows]
    );

    const settingsAllowedCount = useMemo(
        () => settingsRows.filter((row) => row.canAccess || row.canView || row.canCreate || row.canUpdate || row.canDelete).length,
        [settingsRows]
    );

    const categoryAllowedCount = useMemo(
        () => categoryRows.filter((row) => row.canAccess || row.canView || row.canCreate || row.canUpdate || row.canDelete).length,
        [categoryRows]
    );

    const deliveryAllowedCount = useMemo(
        () => deliveryRows.filter((row) => row.canAccess || row.canView || row.canCreate || row.canUpdate || row.canDelete).length,
        [deliveryRows]
    );

    const discountsAllowedCount = useMemo(
        () => discountsRows.filter((row) => row.canAccess || row.canView || row.canCreate || row.canUpdate || row.canDelete).length,
        [discountsRows]
    );

    const paymentMethodAllowedCount = useMemo(
        () => paymentMethodRows.filter((row) => row.canAccess || row.canView || row.canCreate || row.canUpdate || row.canDelete).length,
        [paymentMethodRows]
    );

    const productsAllowedCount = useMemo(
        () => productsRows.filter((row) => row.canAccess || row.canView || row.canCreate || row.canUpdate || row.canDelete).length,
        [productsRows]
    );

    const shiftAllowedCount = useMemo(
        () => shiftRows.filter((row) => row.canAccess || row.canView || row.canCreate || row.canUpdate || row.canDelete).length,
        [shiftRows]
    );

    const shiftHistoryAllowedCount = useMemo(
        () => shiftHistoryRows.filter((row) => row.canAccess || row.canView || row.canCreate || row.canUpdate || row.canDelete).length,
        [shiftHistoryRows]
    );

    const dashboardAllowedCount = useMemo(
        () => dashboardRows.filter((row) => row.canAccess || row.canView || row.canCreate || row.canUpdate || row.canDelete).length,
        [dashboardRows]
    );

    const productsUnitAllowedCount = useMemo(
        () => productsUnitRows.filter((row) => row.canAccess || row.canView || row.canCreate || row.canUpdate || row.canDelete).length,
        [productsUnitRows]
    );

    const qrCodeAllowedCount = useMemo(
        () => qrCodeRows.filter((row) => row.canAccess || row.canView || row.canCreate || row.canUpdate || row.canDelete).length,
        [qrCodeRows]
    );

    const tablesAllowedCount = useMemo(
        () => tablesRows.filter((row) => row.canAccess || row.canView || row.canCreate || row.canUpdate || row.canDelete).length,
        [tablesRows]
    );

    const toppingAllowedCount = useMemo(
        () => toppingRows.filter((row) => row.canAccess || row.canView || row.canCreate || row.canUpdate || row.canDelete).length,
        [toppingRows]
    );

    const toppingGroupAllowedCount = useMemo(
        () => toppingGroupRows.filter((row) => row.canAccess || row.canView || row.canCreate || row.canUpdate || row.canDelete).length,
        [toppingGroupRows]
    );

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

    const featureRows = useMemo(
        () => filteredRows.filter((row) => getResourceKind(row.resourceKey) === "feature"),
        [filteredRows]
    );

    const sectionSummary = useMemo(() => {
        const base = {
            total: rows.length,
            main: 0,
            print: 0,
            qr: 0,
            settings: 0,
            pos: 0,
            stock: 0,
            users: 0,
            branch: 0,
            audit: 0,
            other: 0,
            menu: 0,
            page: 0,
            feature: 0,
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
        if (targetType !== "user") return;
        if (!selectedUser) return;
        const stillExists = users.some((u) => u.id === selectedUser);
        if (!stillExists) {
            setSelectedUser(users[0]?.id || "");
        }
    }, [selectedUser, targetType, users]);

    useEffect(() => {
        if (targetType !== "role") return;
        if (!selectedRole) return;
        const stillExists = roles.some((r) => r.id === selectedRole);
        if (!stillExists) {
            setSelectedRole(roles[0]?.id || "");
        }
    }, [roles, selectedRole, targetType]);

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
                if ((error as { status?: number })?.status === 404) {
                    const fallbackUserId = users[0]?.id || "";
                    if (fallbackUserId && fallbackUserId !== selectedUser) {
                        setSelectedUser(fallbackUserId);
                        return;
                    }
                }
                message.error(error instanceof Error ? error.message : "ไม่สามารถโหลดสิทธิ์ของผู้ใช้ได้");
                setRows([]);
            } finally {
                setLoading(false);
            }
        };
        loadUserPermissions();
    }, [selectedUser, targetType, normalizeScopeByTargetRole, users]);

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

    const featureColumns = [
        {
            title: "Capability",
            key: "capability",
            width: 260,
            render: (_: unknown, row: PermissionRow) => {
                const capability = getPrintSettingsCapability(row.resourceKey);
                return (
                    <Space direction="vertical" size={0}>
                        <Text strong>{capability?.title || resolvePermissionLabel(row.resourceKey, row.pageLabel)}</Text>
                        <Text type="secondary">{capability?.description || row.resourceKey}</Text>
                    </Space>
                );
            },
        },
        {
            title: "ระบบ",
            key: "system",
            align: "center" as const,
            render: (_: unknown, row: PermissionRow) => systemGroupTag(getSystemGroup(row.resourceKey, row.route)),
            width: 120,
        },
        {
            title: "ประเภท",
            key: "kind",
            align: "center" as const,
            render: () => resourceKindTag("feature"),
            width: 120,
        },
        {
            title: "เข้าใช้",
            dataIndex: "canAccess",
            key: "canAccess",
            align: "center" as const,
            render: (value: boolean, row: PermissionRow) => renderActionSwitch(value, row, "access"),
            width: 90,
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
            title: "แก้ไข/เผยแพร่",
            dataIndex: "canUpdate",
            key: "canUpdate",
            align: "center" as const,
            render: (value: boolean, row: PermissionRow) => renderActionSwitch(value, row, "update"),
            width: 120,
        },
        {
            title: "ระดับ",
            key: "securityLevel",
            width: 120,
            align: "center" as const,
            render: (_: unknown, row: PermissionRow) => {
                const level = getPrintSettingsCapability(row.resourceKey)?.securityLevel;
                if (level === "governance") return <Tag color="red">Governance</Tag>;
                if (level === "sensitive") return <Tag color="orange">Sensitive</Tag>;
                return <Tag color="green">Core</Tag>;
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
        downloadBlob(blob, `permission-audits-${new Date().toISOString()}.csv`);
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
        <div style={{ padding: isMobile ? 12 : 24, background: "#f6f8fb", minHeight: "100dvh" }}>
            <Row gutter={[isMobile ? 12 : 16, isMobile ? 12 : 16]}>
                <Col span={24}>
                    <Card bordered={false}>
                        <Space direction="vertical" size={4} style={{ width: "100%" }}>
                            <Button 
                                type="text" 
                                icon={<ArrowLeftOutlined />} 
                                onClick={() => router.push('/users')}
                                className="mb-2 pl-0 hover:bg-transparent hover:text-blue-600 self-start"
                            >
                                กลับหน้าจัดการผู้ใช้
                            </Button>
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
                                        <Text type="secondary">Print Setting</Text>
                                        <Title level={5} style={{ margin: 0 }}>{sectionSummary.print}</Title>
                                    </Card>
                                </Col>
                                <Col xs={12} md={4}>
                                    <Card size="small">
                                        <Text type="secondary">QR Code</Text>
                                        <Title level={5} style={{ margin: 0 }}>{sectionSummary.qr}</Title>
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
                                        <Text type="secondary">Capability</Text>
                                        <Title level={5} style={{ margin: 0 }}>{sectionSummary.feature}</Title>
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

                            {selectedOrderWorkflowRoleBlueprint && (
                                <Alert
                                    type="info"
                                    showIcon
                                    message={`Order workflow baseline สำหรับ ${selectedOrderWorkflowRoleBlueprint.roleName}`}
                                    description={`${selectedOrderWorkflowRoleBlueprint.summary} | ทำได้: ${selectedOrderWorkflowRoleBlueprint.allowed.join(", ")}${selectedOrderWorkflowRoleBlueprint.denied.length > 0 ? ` | จำกัด: ${selectedOrderWorkflowRoleBlueprint.denied.join(", ")}` : ""}`}
                                />
                            )}

                            {selectedRoleBlueprint && (
                                <Alert
                                    type="info"
                                    showIcon
                                    message={`Blueprint แนะนำสำหรับ ${selectedRoleBlueprint.roleName}`}
                                    description={`${selectedRoleBlueprint.summary} | ทำได้: ${selectedRoleBlueprint.allowed.join(", ")}${selectedRoleBlueprint.denied.length > 0 ? ` | จำกัด: ${selectedRoleBlueprint.denied.join(", ")}` : ""}`}
                                />
                            )}

                            {selectedSettingsRoleBlueprint && (
                                <Alert
                                    type="info"
                                    showIcon
                                    message={`Settings baseline สำหรับ ${selectedSettingsRoleBlueprint.roleName}`}
                                    description={`${selectedSettingsRoleBlueprint.summary} | ทำได้: ${selectedSettingsRoleBlueprint.allowed.join(", ")}${selectedSettingsRoleBlueprint.denied.length > 0 ? ` | จำกัด: ${selectedSettingsRoleBlueprint.denied.join(", ")}` : ""}`}
                                />
                            )}

                            {selectedCategoryRoleBlueprint && (
                                <Alert
                                    type="info"
                                    showIcon
                                    message={`Category baseline สำหรับ ${selectedCategoryRoleBlueprint.roleName}`}
                                    description={`${selectedCategoryRoleBlueprint.summary} | ทำได้: ${selectedCategoryRoleBlueprint.allowed.join(", ")}${selectedCategoryRoleBlueprint.denied.length > 0 ? ` | จำกัด: ${selectedCategoryRoleBlueprint.denied.join(", ")}` : ""}`}
                                />
                            )}

                            {selectedDeliveryRoleBlueprint && (
                                <Alert
                                    type="info"
                                    showIcon
                                    message={`Delivery baseline สำหรับ ${selectedDeliveryRoleBlueprint.roleName}`}
                                    description={`${selectedDeliveryRoleBlueprint.summary} | ทำได้: ${selectedDeliveryRoleBlueprint.allowed.join(", ")}${selectedDeliveryRoleBlueprint.denied.length > 0 ? ` | จำกัด: ${selectedDeliveryRoleBlueprint.denied.join(", ")}` : ""}`}
                                />
                            )}

                            {selectedDiscountsRoleBlueprint && (
                                <Alert
                                    type="info"
                                    showIcon
                                    message={`Discount baseline สำหรับ ${selectedDiscountsRoleBlueprint.roleName}`}
                                    description={`${selectedDiscountsRoleBlueprint.summary} | ทำได้: ${selectedDiscountsRoleBlueprint.allowed.join(", ")}${selectedDiscountsRoleBlueprint.denied.length > 0 ? ` | จำกัด: ${selectedDiscountsRoleBlueprint.denied.join(", ")}` : ""}`}
                                />
                            )}

                            {selectedPaymentMethodRoleBlueprint && (
                                <Alert
                                    type="info"
                                    showIcon
                                    message={`Payment method baseline สำหรับ ${selectedPaymentMethodRoleBlueprint.roleName}`}
                                    description={`${selectedPaymentMethodRoleBlueprint.summary} | ทำได้: ${selectedPaymentMethodRoleBlueprint.allowed.join(", ")}${selectedPaymentMethodRoleBlueprint.denied.length > 0 ? ` | จำกัด: ${selectedPaymentMethodRoleBlueprint.denied.join(", ")}` : ""}`}
                                />
                            )}

                            {selectedProductsRoleBlueprint && (
                                <Alert
                                    type="info"
                                    showIcon
                                    message={`Products baseline สำหรับ ${selectedProductsRoleBlueprint.roleName}`}
                                    description={`${selectedProductsRoleBlueprint.summary} | ทำได้: ${selectedProductsRoleBlueprint.allowed.join(", ")}${selectedProductsRoleBlueprint.denied.length > 0 ? ` | จำกัด: ${selectedProductsRoleBlueprint.denied.join(", ")}` : ""}`}
                                />
                            )}

                            {selectedShiftRoleBlueprint && (
                                <Alert
                                    type="info"
                                    showIcon
                                    message={`Shift baseline สำหรับ ${selectedShiftRoleBlueprint.roleName}`}
                                    description={`${selectedShiftRoleBlueprint.summary} | ทำได้: ${selectedShiftRoleBlueprint.allowed.join(", ")}${selectedShiftRoleBlueprint.denied.length > 0 ? ` | จำกัด: ${selectedShiftRoleBlueprint.denied.join(", ")}` : ""}`}
                                />
                            )}

                            {selectedShiftHistoryRoleBlueprint && (
                                <Alert
                                    type="info"
                                    showIcon
                                    message={`Shift History baseline สำหรับ ${selectedShiftHistoryRoleBlueprint.roleName}`}
                                    description={`${selectedShiftHistoryRoleBlueprint.summary} | ทำได้: ${selectedShiftHistoryRoleBlueprint.allowed.join(", ")}${selectedShiftHistoryRoleBlueprint.denied.length > 0 ? ` | จำกัด: ${selectedShiftHistoryRoleBlueprint.denied.join(", ")}` : ""}`}
                                />
                            )}

                            {selectedDashboardRoleBlueprint && (
                                <Alert
                                    type="info"
                                    showIcon
                                    message={`Dashboard baseline สำหรับ ${selectedDashboardRoleBlueprint.roleName}`}
                                    description={`${selectedDashboardRoleBlueprint.summary} | ทำได้: ${selectedDashboardRoleBlueprint.allowed.join(", ")}${selectedDashboardRoleBlueprint.denied.length > 0 ? ` | จำกัด: ${selectedDashboardRoleBlueprint.denied.join(", ")}` : ""}`}
                                />
                            )}

                            {selectedTablesRoleBlueprint && (
                                <Alert
                                    type="info"
                                    showIcon
                                    message={`Tables baseline สำหรับ ${selectedTablesRoleBlueprint.roleName}`}
                                    description={`${selectedTablesRoleBlueprint.summary} | ทำได้: ${selectedTablesRoleBlueprint.allowed.join(", ")}${selectedTablesRoleBlueprint.denied.length > 0 ? ` | จำกัด: ${selectedTablesRoleBlueprint.denied.join(", ")}` : ""}`}
                                />
                            )}

                            {selectedToppingRoleBlueprint && (
                                <Alert
                                    type="info"
                                    showIcon
                                    message={`Topping baseline สำหรับ ${selectedToppingRoleBlueprint.roleName}`}
                                    description={`${selectedToppingRoleBlueprint.summary} | ทำได้: ${selectedToppingRoleBlueprint.allowed.join(", ")}${selectedToppingRoleBlueprint.denied.length > 0 ? ` | จำกัด: ${selectedToppingRoleBlueprint.denied.join(", ")}` : ""}`}
                                />
                            )}

                            {selectedToppingGroupRoleBlueprint && (
                                <Alert
                                    type="info"
                                    showIcon
                                    message={`Topping Group baseline สำหรับ ${selectedToppingGroupRoleBlueprint.roleName}`}
                                    description={`${selectedToppingGroupRoleBlueprint.summary} | ทำได้: ${selectedToppingGroupRoleBlueprint.allowed.join(", ")}${selectedToppingGroupRoleBlueprint.denied.length > 0 ? ` | จำกัด: ${selectedToppingGroupRoleBlueprint.denied.join(", ")}` : ""}`}
                                />
                            )}

                            {selectedQrCodeRoleBlueprint && (
                                <Alert
                                    type="info"
                                    showIcon
                                    message={`QR Code baseline สำหรับ ${selectedQrCodeRoleBlueprint.roleName}`}
                                    description={`${selectedQrCodeRoleBlueprint.summary} | ทำได้: ${selectedQrCodeRoleBlueprint.allowed.join(", ")}${selectedQrCodeRoleBlueprint.denied.length > 0 ? ` | จำกัด: ${selectedQrCodeRoleBlueprint.denied.join(", ")}` : ""}`}
                                />
                            )}

                            {selectedProductsUnitRoleBlueprint && (
                                <Alert
                                    type="info"
                                    showIcon
                                    message={`Products unit baseline สำหรับ ${selectedProductsUnitRoleBlueprint.roleName}`}
                                    description={`${selectedProductsUnitRoleBlueprint.summary} | ทำได้: ${selectedProductsUnitRoleBlueprint.allowed.join(", ")}${selectedProductsUnitRoleBlueprint.denied.length > 0 ? ` | จำกัด: ${selectedProductsUnitRoleBlueprint.denied.join(", ")}` : ""}`}
                                />
                            )}

                            {orderWorkflowRows.length > 0 && (
                                <Alert
                                    type="success"
                                    showIcon
                                    message="Order workflow capability matrix"
                                    description={`Target นี้มีสิทธิ์ที่เกี่ยวกับ orders/list/items/channels ${orderWorkflowAllowedCount}/${orderWorkflowRows.length} รายการ`}
                                />
                            )}

                            {settingsRows.length > 0 && (
                                <Alert
                                    type="success"
                                    showIcon
                                    message="Settings capability matrix"
                                    description={`Target นี้มีสิทธิ์ที่เกี่ยวกับ pos/settings ${settingsAllowedCount}/${settingsRows.length} รายการ`}
                                />
                            )}

                            {categoryRows.length > 0 && (
                                <Alert
                                    type="success"
                                    showIcon
                                    message="Category capability matrix"
                                    description={`Target นี้มีสิทธิ์ที่เกี่ยวกับ pos/category ${categoryAllowedCount}/${categoryRows.length} รายการ`}
                                />
                            )}

                            {deliveryRows.length > 0 && (
                                <Alert
                                    type="success"
                                    showIcon
                                    message="Delivery capability matrix"
                                    description={`Target นี้มีสิทธิ์ที่เกี่ยวกับ pos/delivery ${deliveryAllowedCount}/${deliveryRows.length} รายการ`}
                                />
                            )}

                            {discountsRows.length > 0 && (
                                <Alert
                                    type="success"
                                    showIcon
                                    message="Discount capability matrix"
                                    description={`Target นี้มีสิทธิ์ที่เกี่ยวกับ pos/discounts ${discountsAllowedCount}/${discountsRows.length} รายการ`}
                                />
                            )}

                            {paymentMethodRows.length > 0 && (
                                <Alert
                                    type="success"
                                    showIcon
                                    message="Payment method capability matrix"
                                    description={`Target นี้มีสิทธิ์ที่เกี่ยวกับ pos/paymentMethod ${paymentMethodAllowedCount}/${paymentMethodRows.length} รายการ`}
                                />
                            )}

                            {productsRows.length > 0 && (
                                <Alert
                                    type="success"
                                    showIcon
                                    message="Products capability matrix"
                                    description={`Target นี้มีสิทธิ์ที่เกี่ยวกับ pos/products ${productsAllowedCount}/${productsRows.length} รายการ`}
                                />
                            )}

                            {shiftRows.length > 0 && (
                                <Alert
                                    type="success"
                                    showIcon
                                    message="Shift capability matrix"
                                    description={`Target นี้มีสิทธิ์ที่เกี่ยวกับ pos/shift ${shiftAllowedCount}/${shiftRows.length} รายการ`}
                                />
                            )}

                            {shiftHistoryRows.length > 0 && (
                                <Alert
                                    type="success"
                                    showIcon
                                    message="Shift History capability matrix"
                                    description={`Target นี้มีสิทธิ์ที่เกี่ยวกับ pos/shiftHistory ${shiftHistoryAllowedCount}/${shiftHistoryRows.length} รายการ`}
                                />
                            )}

                            {dashboardRows.length > 0 && (
                                <Alert
                                    type="success"
                                    showIcon
                                    message="Dashboard capability matrix"
                                    description={`Target นี้มีสิทธิ์ที่เกี่ยวกับ pos/dashboard ${dashboardAllowedCount}/${dashboardRows.length} รายการ`}
                                />
                            )}

                            {tablesRows.length > 0 && (
                                <Alert
                                    type="success"
                                    showIcon
                                    message="Tables capability matrix"
                                    description={`Target นี้มีสิทธิ์ที่เกี่ยวกับ pos/tables ${tablesAllowedCount}/${tablesRows.length} รายการ`}
                                />
                            )}

                            {toppingRows.length > 0 && (
                                <Alert
                                    type="success"
                                    showIcon
                                    message="Topping capability matrix"
                                    description={`Target นี้มีสิทธิ์ที่เกี่ยวกับ pos/topping ${toppingAllowedCount}/${toppingRows.length} รายการ`}
                                />
                            )}

                            {toppingGroupRows.length > 0 && (
                                <Alert
                                    type="success"
                                    showIcon
                                    message="Topping Group capability matrix"
                                    description={`Target นี้มีสิทธิ์ที่เกี่ยวกับ pos/toppingGroup ${toppingGroupAllowedCount}/${toppingGroupRows.length} รายการ`}
                                />
                            )}

                            {qrCodeRows.length > 0 && (
                                <Alert
                                    type="success"
                                    showIcon
                                    message="QR code capability matrix"
                                    description={`Target นี้มีสิทธิ์ที่เกี่ยวกับ pos/qr-code ${qrCodeAllowedCount}/${qrCodeRows.length} รายการ`}
                                />
                            )}

                            {productsUnitRows.length > 0 && (
                                <Alert
                                    type="success"
                                    showIcon
                                    message="Products unit capability matrix"
                                    description={`Target นี้มีสิทธิ์ที่เกี่ยวกับ pos/productsUnit ${productsUnitAllowedCount}/${productsUnitRows.length} รายการ`}
                                />
                            )}

                            {printSettingsRows.length > 0 && (
                                <Alert
                                    type="success"
                                    showIcon
                                    message="Print-setting capability matrix"
                                    description={`Target นี้มีสิทธิ์ที่เกี่ยวกับ print-setting ${printSettingsAllowedCount}/${printSettingsRows.length} รายการ`}
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

                            <Card size="small" title={`ส่วน capability (${selectedSystemLabel})`} style={{ borderRadius: 12 }}>
                                <Table
                                    rowKey="key"
                                    columns={featureColumns}
                                    dataSource={featureRows}
                                    pagination={false}
                                    size="middle"
                                    scroll={{ x: 900 }}
                                    loading={loading}
                                    locale={{ emptyText: `ไม่มี capability ในระบบ ${selectedSystemLabel}` }}
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
                            {selectedOrderWorkflowRoleBlueprint && (
                                <Card size="small" style={{ borderRadius: 12 }}>
                                    <Space direction="vertical" size={8} style={{ width: "100%" }}>
                                        <Text strong>Order Workflow Governance Baseline</Text>
                                        <Tag color="purple">{selectedOrderWorkflowRoleBlueprint.title}</Tag>
                                        <Text type="secondary">{selectedOrderWorkflowRoleBlueprint.summary}</Text>
                                        <Text strong>สิทธิ์ที่ควรมี</Text>
                                        <Space wrap>
                                            {selectedOrderWorkflowRoleBlueprint.allowed.map((item) => (
                                                <Tag key={item} color="green">{item}</Tag>
                                            ))}
                                        </Space>
                                        {selectedOrderWorkflowRoleBlueprint.denied.length > 0 && (
                                            <>
                                                <Text strong>สิทธิ์ที่ควรจำกัด</Text>
                                                <Space wrap>
                                                    {selectedOrderWorkflowRoleBlueprint.denied.map((item) => (
                                                        <Tag key={item} color="red">{item}</Tag>
                                                    ))}
                                                </Space>
                                            </>
                                        )}
                                    </Space>
                                </Card>
                            )}
                            {selectedRoleBlueprint && (
                                <Card size="small" style={{ borderRadius: 12 }}>
                                    <Space direction="vertical" size={8} style={{ width: "100%" }}>
                                        <Text strong>Recommended Role Baseline</Text>
                                        <Tag color="purple">{selectedRoleBlueprint.title}</Tag>
                                        <Text type="secondary">{selectedRoleBlueprint.summary}</Text>
                                        <Text strong>สิทธิ์ที่ควรมี</Text>
                                        <Space wrap>
                                            {selectedRoleBlueprint.allowed.map((item) => (
                                                <Tag key={item} color="green">{item}</Tag>
                                            ))}
                                        </Space>
                                        {selectedRoleBlueprint.denied.length > 0 && (
                                            <>
                                                <Text strong>สิทธิ์ที่ควรจำกัด</Text>
                                                <Space wrap>
                                                    {selectedRoleBlueprint.denied.map((item) => (
                                                        <Tag key={item} color="red">{item}</Tag>
                                                    ))}
                                                </Space>
                                            </>
                                        )}
                                    </Space>
                                </Card>
                            )}
                            {selectedSettingsRoleBlueprint && (
                                <Card size="small" style={{ borderRadius: 12 }}>
                                    <Space direction="vertical" size={8} style={{ width: "100%" }}>
                                        <Text strong>Settings Governance Baseline</Text>
                                        <Tag color="blue">{selectedSettingsRoleBlueprint.title}</Tag>
                                        <Text type="secondary">{selectedSettingsRoleBlueprint.summary}</Text>
                                        <Text strong>สิทธิ์ที่ควรมี</Text>
                                        <Space wrap>
                                            {selectedSettingsRoleBlueprint.allowed.map((item) => (
                                                <Tag key={item} color="green">{item}</Tag>
                                            ))}
                                        </Space>
                                        {selectedSettingsRoleBlueprint.denied.length > 0 && (
                                            <>
                                                <Text strong>สิทธิ์ที่ควรจำกัด</Text>
                                                <Space wrap>
                                                    {selectedSettingsRoleBlueprint.denied.map((item) => (
                                                        <Tag key={item} color="red">{item}</Tag>
                                                    ))}
                                                </Space>
                                            </>
                                        )}
                                    </Space>
                                </Card>
                            )}
                            {selectedCategoryRoleBlueprint && (
                                <Card size="small" style={{ borderRadius: 12 }}>
                                    <Space direction="vertical" size={8} style={{ width: "100%" }}>
                                        <Text strong>Category Governance Baseline</Text>
                                        <Tag color="geekblue">{selectedCategoryRoleBlueprint.title}</Tag>
                                        <Text type="secondary">{selectedCategoryRoleBlueprint.summary}</Text>
                                        <Text strong>สิทธิ์ที่ควรมี</Text>
                                        <Space wrap>
                                            {selectedCategoryRoleBlueprint.allowed.map((item) => (
                                                <Tag key={item} color="green">{item}</Tag>
                                            ))}
                                        </Space>
                                        {selectedCategoryRoleBlueprint.denied.length > 0 && (
                                            <>
                                                <Text strong>สิทธิ์ที่ควรจำกัด</Text>
                                                <Space wrap>
                                                    {selectedCategoryRoleBlueprint.denied.map((item) => (
                                                        <Tag key={item} color="red">{item}</Tag>
                                                    ))}
                                                </Space>
                                            </>
                                        )}
                                    </Space>
                                </Card>
                            )}
                            {selectedDeliveryRoleBlueprint && (
                                <Card size="small" style={{ borderRadius: 12 }}>
                                    <Space direction="vertical" size={8} style={{ width: "100%" }}>
                                        <Text strong>Delivery Governance Baseline</Text>
                                        <Tag color="cyan">{selectedDeliveryRoleBlueprint.title}</Tag>
                                        <Text type="secondary">{selectedDeliveryRoleBlueprint.summary}</Text>
                                        <Text strong>สิทธิ์ที่ควรมี</Text>
                                        <Space wrap>
                                            {selectedDeliveryRoleBlueprint.allowed.map((item) => (
                                                <Tag key={item} color="green">{item}</Tag>
                                            ))}
                                        </Space>
                                        {selectedDeliveryRoleBlueprint.denied.length > 0 && (
                                            <>
                                                <Text strong>สิทธิ์ที่ควรจำกัด</Text>
                                                <Space wrap>
                                                    {selectedDeliveryRoleBlueprint.denied.map((item) => (
                                                        <Tag key={item} color="red">{item}</Tag>
                                                    ))}
                                                </Space>
                                            </>
                                        )}
                                    </Space>
                                </Card>
                            )}
                            {selectedDiscountsRoleBlueprint && (
                                <Card size="small" style={{ borderRadius: 12 }}>
                                    <Space direction="vertical" size={8} style={{ width: "100%" }}>
                                        <Text strong>Discount Governance Baseline</Text>
                                        <Tag color="gold">{selectedDiscountsRoleBlueprint.title}</Tag>
                                        <Text type="secondary">{selectedDiscountsRoleBlueprint.summary}</Text>
                                        <Text strong>สิทธิ์ที่ควรมี</Text>
                                        <Space wrap>
                                            {selectedDiscountsRoleBlueprint.allowed.map((item) => (
                                                <Tag key={item} color="green">{item}</Tag>
                                            ))}
                                        </Space>
                                        {selectedDiscountsRoleBlueprint.denied.length > 0 && (
                                            <>
                                                <Text strong>สิทธิ์ที่ควรจำกัด</Text>
                                                <Space wrap>
                                                    {selectedDiscountsRoleBlueprint.denied.map((item) => (
                                                        <Tag key={item} color="red">{item}</Tag>
                                                    ))}
                                                </Space>
                                            </>
                                        )}
                                    </Space>
                                </Card>
                            )}
                            {selectedPaymentMethodRoleBlueprint && (
                                <Card size="small" style={{ borderRadius: 12 }}>
                                    <Space direction="vertical" size={8} style={{ width: "100%" }}>
                                        <Text strong>Payment Method Governance Baseline</Text>
                                        <Tag color="green">{selectedPaymentMethodRoleBlueprint.title}</Tag>
                                        <Text type="secondary">{selectedPaymentMethodRoleBlueprint.summary}</Text>
                                        <Text strong>สิทธิ์ที่ควรมี</Text>
                                        <Space wrap>
                                            {selectedPaymentMethodRoleBlueprint.allowed.map((item) => (
                                                <Tag key={item} color="green">{item}</Tag>
                                            ))}
                                        </Space>
                                        {selectedPaymentMethodRoleBlueprint.denied.length > 0 && (
                                            <>
                                                <Text strong>สิทธิ์ที่ควรจำกัด</Text>
                                                <Space wrap>
                                                    {selectedPaymentMethodRoleBlueprint.denied.map((item) => (
                                                        <Tag key={item} color="red">{item}</Tag>
                                                    ))}
                                                </Space>
                                            </>
                                        )}
                                    </Space>
                                </Card>
                            )}
                            {selectedProductsRoleBlueprint && (
                                <Card size="small" style={{ borderRadius: 12 }}>
                                    <Space direction="vertical" size={8} style={{ width: "100%" }}>
                                        <Text strong>Products Governance Baseline</Text>
                                        <Tag color="blue">{selectedProductsRoleBlueprint.title}</Tag>
                                        <Text type="secondary">{selectedProductsRoleBlueprint.summary}</Text>
                                        <Text strong>สิทธิ์ที่ควรมี</Text>
                                        <Space wrap>
                                            {selectedProductsRoleBlueprint.allowed.map((item) => (
                                                <Tag key={item} color="green">{item}</Tag>
                                            ))}
                                        </Space>
                                        {selectedProductsRoleBlueprint.denied.length > 0 && (
                                            <>
                                                <Text strong>สิทธิ์ที่ควรจำกัด</Text>
                                                <Space wrap>
                                                    {selectedProductsRoleBlueprint.denied.map((item) => (
                                                        <Tag key={item} color="red">{item}</Tag>
                                                    ))}
                                                </Space>
                                            </>
                                        )}
                                    </Space>
                                </Card>
                            )}
                            {selectedShiftRoleBlueprint && (
                                <Card size="small" style={{ borderRadius: 12 }}>
                                    <Space direction="vertical" size={8} style={{ width: "100%" }}>
                                        <Text strong>Shift Governance Baseline</Text>
                                        <Tag color="blue">{selectedShiftRoleBlueprint.title}</Tag>
                                        <Text type="secondary">{selectedShiftRoleBlueprint.summary}</Text>
                                        <Text strong>สิทธิ์ที่ควรมี</Text>
                                        <Space wrap>
                                            {selectedShiftRoleBlueprint.allowed.map((item) => (
                                                <Tag key={item} color="green">{item}</Tag>
                                            ))}
                                        </Space>
                                        {selectedShiftRoleBlueprint.denied.length > 0 && (
                                            <>
                                                <Text strong>สิทธิ์ที่ควรจำกัด</Text>
                                                <Space wrap>
                                                    {selectedShiftRoleBlueprint.denied.map((item) => (
                                                        <Tag key={item} color="red">{item}</Tag>
                                                    ))}
                                                </Space>
                                            </>
                                        )}
                                    </Space>
                                </Card>
                            )}
                            {selectedShiftHistoryRoleBlueprint && (
                                <Card size="small" style={{ borderRadius: 12 }}>
                                    <Space direction="vertical" size={8} style={{ width: "100%" }}>
                                        <Text strong>Shift History Governance Baseline</Text>
                                        <Tag color="blue">{selectedShiftHistoryRoleBlueprint.title}</Tag>
                                        <Text type="secondary">{selectedShiftHistoryRoleBlueprint.summary}</Text>
                                        <Text strong>สิทธิ์ที่ควรมี</Text>
                                        <Space wrap>
                                            {selectedShiftHistoryRoleBlueprint.allowed.map((item) => (
                                                <Tag key={item} color="green">{item}</Tag>
                                            ))}
                                        </Space>
                                        {selectedShiftHistoryRoleBlueprint.denied.length > 0 && (
                                            <>
                                                <Text strong>สิทธิ์ที่ควรจำกัด</Text>
                                                <Space wrap>
                                                    {selectedShiftHistoryRoleBlueprint.denied.map((item) => (
                                                        <Tag key={item} color="red">{item}</Tag>
                                                    ))}
                                                </Space>
                                            </>
                                        )}
                                    </Space>
                                </Card>
                            )}
                            {selectedDashboardRoleBlueprint && (
                                <Card size="small" style={{ borderRadius: 12 }}>
                                    <Space direction="vertical" size={8} style={{ width: "100%" }}>
                                        <Text strong>Dashboard Governance Baseline</Text>
                                        <Tag color="magenta">{selectedDashboardRoleBlueprint.title}</Tag>
                                        <Text type="secondary">{selectedDashboardRoleBlueprint.summary}</Text>
                                        <Text strong>สิทธิ์ที่ควรมี</Text>
                                        <Space wrap>
                                            {selectedDashboardRoleBlueprint.allowed.map((item) => (
                                                <Tag key={item} color="green">{item}</Tag>
                                            ))}
                                        </Space>
                                        {selectedDashboardRoleBlueprint.denied.length > 0 && (
                                            <>
                                                <Text strong>สิทธิ์ที่ควรจำกัด</Text>
                                                <Space wrap>
                                                    {selectedDashboardRoleBlueprint.denied.map((item) => (
                                                        <Tag key={item} color="red">{item}</Tag>
                                                    ))}
                                                </Space>
                                            </>
                                        )}
                                    </Space>
                                </Card>
                            )}
                            {selectedTablesRoleBlueprint && (
                                <Card size="small" style={{ borderRadius: 12 }}>
                                    <Space direction="vertical" size={8} style={{ width: "100%" }}>
                                        <Text strong>Tables Governance Baseline</Text>
                                        <Tag color="blue">{selectedTablesRoleBlueprint.title}</Tag>
                                        <Text type="secondary">{selectedTablesRoleBlueprint.summary}</Text>
                                        <Text strong>สิทธิ์ที่ควรมี</Text>
                                        <Space wrap>
                                            {selectedTablesRoleBlueprint.allowed.map((item) => (
                                                <Tag key={item} color="green">{item}</Tag>
                                            ))}
                                        </Space>
                                        {selectedTablesRoleBlueprint.denied.length > 0 && (
                                            <>
                                                <Text strong>สิทธิ์ที่ควรจำกัด</Text>
                                                <Space wrap>
                                                    {selectedTablesRoleBlueprint.denied.map((item) => (
                                                        <Tag key={item} color="red">{item}</Tag>
                                                    ))}
                                                </Space>
                                            </>
                                        )}
                                    </Space>
                                </Card>
                            )}
                            {selectedToppingRoleBlueprint && (
                                <Card size="small" style={{ borderRadius: 12 }}>
                                    <Space direction="vertical" size={8} style={{ width: "100%" }}>
                                        <Text strong>Topping Governance Baseline</Text>
                                        <Tag color="orange">{selectedToppingRoleBlueprint.title}</Tag>
                                        <Text type="secondary">{selectedToppingRoleBlueprint.summary}</Text>
                                        <Text strong>สิทธิ์ที่ควรมี</Text>
                                        <Space wrap>
                                            {selectedToppingRoleBlueprint.allowed.map((item) => (
                                                <Tag key={item} color="green">{item}</Tag>
                                            ))}
                                        </Space>
                                        {selectedToppingRoleBlueprint.denied.length > 0 && (
                                            <>
                                                <Text strong>สิทธิ์ที่ควรจำกัด</Text>
                                                <Space wrap>
                                                    {selectedToppingRoleBlueprint.denied.map((item) => (
                                                        <Tag key={item} color="red">{item}</Tag>
                                                    ))}
                                                </Space>
                                            </>
                                        )}
                                    </Space>
                                </Card>
                            )}
                            {selectedQrCodeRoleBlueprint && (
                                <Card size="small" style={{ borderRadius: 12 }}>
                                    <Space direction="vertical" size={8} style={{ width: "100%" }}>
                                        <Text strong>QR Code Governance Baseline</Text>
                                        <Tag color="cyan">{selectedQrCodeRoleBlueprint.title}</Tag>
                                        <Text type="secondary">{selectedQrCodeRoleBlueprint.summary}</Text>
                                        <Text strong>สิทธิ์ที่ควรมี</Text>
                                        <Space wrap>
                                            {selectedQrCodeRoleBlueprint.allowed.map((item) => (
                                                <Tag key={item} color="green">{item}</Tag>
                                            ))}
                                        </Space>
                                        {selectedQrCodeRoleBlueprint.denied.length > 0 && (
                                            <>
                                                <Text strong>สิทธิ์ที่ควรจำกัด</Text>
                                                <Space wrap>
                                                    {selectedQrCodeRoleBlueprint.denied.map((item) => (
                                                        <Tag key={item} color="red">{item}</Tag>
                                                    ))}
                                                </Space>
                                            </>
                                        )}
                                    </Space>
                                </Card>
                            )}
                            {selectedProductsUnitRoleBlueprint && (
                                <Card size="small" style={{ borderRadius: 12 }}>
                                    <Space direction="vertical" size={8} style={{ width: "100%" }}>
                                        <Text strong>Products Unit Governance Baseline</Text>
                                        <Tag color="cyan">{selectedProductsUnitRoleBlueprint.title}</Tag>
                                        <Text type="secondary">{selectedProductsUnitRoleBlueprint.summary}</Text>
                                        <Text strong>สิทธิ์ที่ควรมี</Text>
                                        <Space wrap>
                                            {selectedProductsUnitRoleBlueprint.allowed.map((item) => (
                                                <Tag key={item} color="green">{item}</Tag>
                                            ))}
                                        </Space>
                                        {selectedProductsUnitRoleBlueprint.denied.length > 0 && (
                                            <>
                                                <Text strong>สิทธิ์ที่ควรจำกัด</Text>
                                                <Space wrap>
                                                    {selectedProductsUnitRoleBlueprint.denied.map((item) => (
                                                        <Tag key={item} color="red">{item}</Tag>
                                                    ))}
                                                </Space>
                                            </>
                                        )}
                                    </Space>
                                </Card>
                            )}
                            {selectedToppingGroupRoleBlueprint && (
                                <Card size="small" style={{ borderRadius: 12 }}>
                                    <Space direction="vertical" size={8} style={{ width: "100%" }}>
                                        <Text strong>Topping Group Governance Baseline</Text>
                                        <Tag color="purple">{selectedToppingGroupRoleBlueprint.title}</Tag>
                                        <Text type="secondary">{selectedToppingGroupRoleBlueprint.summary}</Text>
                                        <Text strong>สิทธิ์ที่ควรมี</Text>
                                        <Space wrap>
                                            {selectedToppingGroupRoleBlueprint.allowed.map((item) => (
                                                <Tag key={item} color="green">{item}</Tag>
                                            ))}
                                        </Space>
                                        {selectedToppingGroupRoleBlueprint.denied.length > 0 && (
                                            <>
                                                <Text strong>สิทธิ์ที่ควรจำกัด</Text>
                                                <Space wrap>
                                                    {selectedToppingGroupRoleBlueprint.denied.map((item) => (
                                                        <Tag key={item} color="red">{item}</Tag>
                                                    ))}
                                                </Space>
                                            </>
                                        )}
                                    </Space>
                                </Card>
                            )}
                            {orderWorkflowRows.length > 0 && (
                                <Card size="small" style={{ borderRadius: 12 }}>
                                    <Space direction="vertical" size={8} style={{ width: "100%" }}>
                                        <Text strong>Order Workflow Governance</Text>
                                        <Text type="secondary">Capability ของ orders, channels, serving board, order detail และ checkout ถูกแยกจาก page access เพื่อควบคุม search, filter, create order, line-item management, item-status update, workflow transition, checkout และ full-order cancel แบบราย action</Text>
                                        <Space wrap>
                                            {ORDER_WORKFLOW_CAPABILITIES.map((item) => {
                                                const row = orderWorkflowRows.find((candidate) => candidate.resourceKey === item.resourceKey);
                                                const allowed = row ? (row.canAccess || row.canView || row.canCreate || row.canUpdate || row.canDelete) : false;
                                                return (
                                                    <Tag key={item.resourceKey} color={allowed ? "green" : item.securityLevel === "governance" ? "red" : "default"}>
                                                        {item.title}
                                                    </Tag>
                                                );
                                            })}
                                        </Space>
                                    </Space>
                                </Card>
                            )}
                            {settingsRows.length > 0 && (
                                <Card size="small" style={{ borderRadius: 12 }}>
                                    <Space direction="vertical" size={8} style={{ width: "100%" }}>
                                        <Text strong>Settings Governance</Text>
                                        <Text type="secondary">Capability ของ pos/settings ถูกแยกเป็น settings landing, branch identity/contact และ payment-account lifecycle เพื่อควบคุม search, filter, detail, create, activate และ delete แบบราย action</Text>
                                        <Space wrap>
                                            {SETTINGS_CAPABILITIES.map((item) => {
                                                const row = settingsRows.find((candidate) => candidate.resourceKey === item.resourceKey);
                                                const allowed = row ? (row.canAccess || row.canView || row.canCreate || row.canUpdate || row.canDelete) : false;
                                                return (
                                                    <Tag key={item.resourceKey} color={allowed ? "green" : item.securityLevel === "governance" ? "red" : "default"}>
                                                        {item.title}
                                                    </Tag>
                                                );
                                            })}
                                        </Space>
                                    </Space>
                                </Card>
                            )}
                            {categoryRows.length > 0 && (
                                <Card size="small" style={{ borderRadius: 12 }}>
                                    <Space direction="vertical" size={8} style={{ width: "100%" }}>
                                        <Text strong>Category Governance</Text>
                                        <Text type="secondary">Capability ของ pos/category ถูกแยกออกจาก page access เพื่อควบคุม search/filter/create/edit/status/delete แบบราย action</Text>
                                        <Space wrap>
                                            {CATEGORY_CAPABILITIES.map((item) => {
                                                const row = categoryRows.find((candidate) => candidate.resourceKey === item.resourceKey);
                                                const allowed = row ? (row.canAccess || row.canView || row.canCreate || row.canUpdate || row.canDelete) : false;
                                                return (
                                                    <Tag key={item.resourceKey} color={allowed ? "green" : item.securityLevel === "governance" ? "red" : "default"}>
                                                        {item.title}
                                                    </Tag>
                                                );
                                            })}
                                        </Space>
                                    </Space>
                                </Card>
                            )}
                            {productsRows.length > 0 && (
                                <Card size="small" style={{ borderRadius: 12 }}>
                                    <Space direction="vertical" size={8} style={{ width: "100%" }}>
                                        <Text strong>Products Governance</Text>
                                        <Text type="secondary">Capability ของ pos/products ถูกแยกออกจาก page access เพื่อควบคุม search/filter/create/catalog/pricing/structure/status/delete แบบราย action</Text>
                                        <Space wrap>
                                            {PRODUCTS_CAPABILITIES.map((item) => {
                                                const row = productsRows.find((candidate) => candidate.resourceKey === item.resourceKey);
                                                const allowed = row ? (row.canAccess || row.canView || row.canCreate || row.canUpdate || row.canDelete) : false;
                                                return (
                                                    <Tag key={item.resourceKey} color={allowed ? "green" : item.securityLevel === "governance" ? "red" : "default"}>
                                                        {item.title}
                                                    </Tag>
                                                );
                                            })}
                                        </Space>
                                    </Space>
                                </Card>
                            )}
                            {shiftRows.length > 0 && (
                                <Card size="small" style={{ borderRadius: 12 }}>
                                    <Space direction="vertical" size={8} style={{ width: "100%" }}>
                                        <Text strong>Shift Governance</Text>
                                        <Text type="secondary">Capability ของ pos/shift ถูกแยกออกจาก page access เพื่อควบคุม open shift, close preview, close shift, KPI summary, financial evidence, channel mix, top products และการเข้า shift history แบบราย action รวมถึง own-scope สำหรับ financial governance ของ employee</Text>
                                        <Space wrap>
                                            {SHIFT_CAPABILITIES.map((item) => {
                                                const row = shiftRows.find((candidate) => candidate.resourceKey === item.resourceKey);
                                                const allowed = row ? (row.canAccess || row.canView || row.canCreate || row.canUpdate || row.canDelete) : false;
                                                return (
                                                    <Tag key={item.resourceKey} color={allowed ? "green" : item.securityLevel === "governance" ? "red" : "default"}>
                                                        {item.title}
                                                    </Tag>
                                                );
                                            })}
                                        </Space>
                                    </Space>
                                </Card>
                            )}
                            {shiftHistoryRows.length > 0 && (
                                <Card size="small" style={{ borderRadius: 12 }}>
                                    <Space direction="vertical" size={8} style={{ width: "100%" }}>
                                        <Text strong>Shift History Governance</Text>
                                        <Text type="secondary">Capability ของ pos/shiftHistory ถูกแยกออกจาก shifts.page เพื่อควบคุม search, filter, branch stats, summary modal และ financial amounts แบบราย action รวมถึง own-scope สำหรับ employee</Text>
                                        <Space wrap>
                                            {SHIFT_HISTORY_CAPABILITIES.map((item) => {
                                                const row = shiftHistoryRows.find((candidate) => candidate.resourceKey === item.resourceKey);
                                                const allowed = row ? (row.canAccess || row.canView || row.canCreate || row.canUpdate || row.canDelete) : false;
                                                return (
                                                    <Tag key={item.resourceKey} color={allowed ? "green" : item.securityLevel === "governance" ? "red" : "default"}>
                                                        {item.title}
                                                    </Tag>
                                                );
                                            })}
                                        </Space>
                                    </Space>
                                </Card>
                            )}
                            {dashboardRows.length > 0 && (
                                <Card size="small" style={{ borderRadius: 12 }}>
                                    <Space direction="vertical" size={8} style={{ width: "100%" }}>
                                        <Text strong>Dashboard Governance</Text>
                                        <Text type="secondary">Capability ของ pos/dashboard ถูกแยกออกจาก page access เพื่อควบคุม KPI, advanced filters, channel mix, recent orders, order detail, export และ receipt print แบบราย action</Text>
                                        <Space wrap>
                                            {DASHBOARD_CAPABILITIES.map((item) => {
                                                const row = dashboardRows.find((candidate) => candidate.resourceKey === item.resourceKey);
                                                const allowed = row ? (row.canAccess || row.canView || row.canCreate || row.canUpdate || row.canDelete) : false;
                                                return (
                                                    <Tag key={item.resourceKey} color={allowed ? "green" : item.securityLevel === "governance" ? "red" : "default"}>
                                                        {item.title}
                                                    </Tag>
                                                );
                                            })}
                                        </Space>
                                    </Space>
                                </Card>
                            )}
                            {tablesRows.length > 0 && (
                                <Card size="small" style={{ borderRadius: 12 }}>
                                    <Space direction="vertical" size={8} style={{ width: "100%" }}>
                                        <Text strong>Tables Governance</Text>
                                        <Text type="secondary">Capability ของ pos/tables ถูกแยกออกจาก page access เพื่อควบคุม search, filter, manager workspace, create, edit, status และ delete แบบราย action</Text>
                                        <Space wrap>
                                            {TABLES_CAPABILITIES.map((item) => {
                                                const row = tablesRows.find((candidate) => candidate.resourceKey === item.resourceKey);
                                                const allowed = row ? (row.canAccess || row.canView || row.canCreate || row.canUpdate || row.canDelete) : false;
                                                return (
                                                    <Tag key={item.resourceKey} color={allowed ? "green" : item.securityLevel === "governance" ? "red" : "default"}>
                                                        {item.title}
                                                    </Tag>
                                                );
                                            })}
                                        </Space>
                                    </Space>
                                </Card>
                            )}
                            {toppingRows.length > 0 && (
                                <Card size="small" style={{ borderRadius: 12 }}>
                                    <Space direction="vertical" size={8} style={{ width: "100%" }}>
                                        <Text strong>Topping Governance</Text>
                                        <Text type="secondary">Capability ของ pos/topping ถูกแยกออกจาก page access เพื่อควบคุม search, filter, manager workspace, create, catalog, pricing, status และ delete แบบราย action</Text>
                                        <Space wrap>
                                            {TOPPING_CAPABILITIES.map((item) => {
                                                const row = toppingRows.find((candidate) => candidate.resourceKey === item.resourceKey);
                                                const allowed = row ? (row.canAccess || row.canView || row.canCreate || row.canUpdate || row.canDelete) : false;
                                                return (
                                                    <Tag key={item.resourceKey} color={allowed ? "green" : item.securityLevel === "governance" ? "red" : "default"}>
                                                        {item.title}
                                                    </Tag>
                                                );
                                            })}
                                        </Space>
                                    </Space>
                                </Card>
                            )}
                            {toppingGroupRows.length > 0 && (
                                <Card size="small" style={{ borderRadius: 12 }}>
                                    <Space direction="vertical" size={8} style={{ width: "100%" }}>
                                        <Text strong>Topping Group Governance</Text>
                                        <Text type="secondary">Capability ของ pos/toppingGroup ถูกแยกออกจาก page access เพื่อควบคุม search, filter, manager workspace, create, edit, status และ delete แบบราย action</Text>
                                        <Space wrap>
                                            {TOPPING_GROUP_CAPABILITIES.map((item) => {
                                                const row = toppingGroupRows.find((candidate) => candidate.resourceKey === item.resourceKey);
                                                const allowed = row ? (row.canAccess || row.canView || row.canCreate || row.canUpdate || row.canDelete) : false;
                                                return (
                                                    <Tag key={item.resourceKey} color={allowed ? "green" : item.securityLevel === "governance" ? "red" : "default"}>
                                                        {item.title}
                                                    </Tag>
                                                );
                                            })}
                                        </Space>
                                    </Space>
                                </Card>
                            )}
                            {qrCodeRows.length > 0 && (
                                <Card size="small" style={{ borderRadius: 12 }}>
                                    <Space direction="vertical" size={8} style={{ width: "100%" }}>
                                        <Text strong>QR Code Governance</Text>
                                        <Text type="secondary">Capability ของ pos/qr-code ถูกแยกจาก tables และ orders เพื่อควบคุม search, preview, customer link, rotate, export, bulk export, takeaway view และ takeaway rotate แบบราย action</Text>
                                        <Space wrap>
                                            {QR_CODE_CAPABILITIES.map((item) => {
                                                const row = qrCodeRows.find((candidate) => candidate.resourceKey === item.resourceKey);
                                                const allowed = row ? (row.canAccess || row.canView || row.canCreate || row.canUpdate || row.canDelete) : false;
                                                return (
                                                    <Tag key={item.resourceKey} color={allowed ? "green" : item.securityLevel === "governance" ? "red" : "default"}>
                                                        {item.title}
                                                    </Tag>
                                                );
                                            })}
                                        </Space>
                                    </Space>
                                </Card>
                            )}
                            {productsUnitRows.length > 0 && (
                                <Card size="small" style={{ borderRadius: 12 }}>
                                    <Space direction="vertical" size={8} style={{ width: "100%" }}>
                                        <Text strong>Products Unit Governance</Text>
                                        <Text type="secondary">Capability ของ pos/productsUnit ถูกแยกออกจาก page access เพื่อควบคุม search/filter/create/edit/status/delete แบบราย action</Text>
                                        <Space wrap>
                                            {PRODUCTS_UNIT_CAPABILITIES.map((item) => {
                                                const row = productsUnitRows.find((candidate) => candidate.resourceKey === item.resourceKey);
                                                const allowed = row ? (row.canAccess || row.canView || row.canCreate || row.canUpdate || row.canDelete) : false;
                                                return (
                                                    <Tag key={item.resourceKey} color={allowed ? "green" : item.securityLevel === "governance" ? "red" : "default"}>
                                                        {item.title}
                                                    </Tag>
                                                );
                                            })}
                                        </Space>
                                    </Space>
                                </Card>
                            )}
                            {discountsRows.length > 0 && (
                                <Card size="small" style={{ borderRadius: 12 }}>
                                    <Space direction="vertical" size={8} style={{ width: "100%" }}>
                                        <Text strong>Discount Governance</Text>
                                        <Text type="secondary">Capability ของ pos/discounts ถูกแยกออกจาก page access เพื่อควบคุม search/filter/create/edit/pricing/status/delete แบบราย action</Text>
                                        <Space wrap>
                                            {DISCOUNTS_CAPABILITIES.map((item) => {
                                                const row = discountsRows.find((candidate) => candidate.resourceKey === item.resourceKey);
                                                const allowed = row ? (row.canAccess || row.canView || row.canCreate || row.canUpdate || row.canDelete) : false;
                                                return (
                                                    <Tag key={item.resourceKey} color={allowed ? "green" : item.securityLevel === "governance" ? "red" : "default"}>
                                                        {item.title}
                                                    </Tag>
                                                );
                                            })}
                                        </Space>
                                    </Space>
                                </Card>
                            )}
                            {paymentMethodRows.length > 0 && (
                                <Card size="small" style={{ borderRadius: 12 }}>
                                    <Space direction="vertical" size={8} style={{ width: "100%" }}>
                                        <Text strong>Payment Method Governance</Text>
                                        <Text type="secondary">Capability ของ pos/paymentMethod ถูกแยกออกจาก page access เพื่อควบคุม search/filter/create/catalog/status/delete แบบราย action</Text>
                                        <Space wrap>
                                            {PAYMENT_METHOD_CAPABILITIES.map((item) => {
                                                const row = paymentMethodRows.find((candidate) => candidate.resourceKey === item.resourceKey);
                                                const allowed = row ? (row.canAccess || row.canView || row.canCreate || row.canUpdate || row.canDelete) : false;
                                                return (
                                                    <Tag key={item.resourceKey} color={allowed ? "green" : item.securityLevel === "governance" ? "red" : "default"}>
                                                        {item.title}
                                                    </Tag>
                                                );
                                            })}
                                        </Space>
                                    </Space>
                                </Card>
                            )}
                            {deliveryRows.length > 0 && (
                                <Card size="small" style={{ borderRadius: 12 }}>
                                    <Space direction="vertical" size={8} style={{ width: "100%" }}>
                                        <Text strong>Delivery Governance</Text>
                                        <Text type="secondary">Capability ของ pos/delivery ถูกแยกออกจาก page access เพื่อควบคุม search/filter/create/edit/status/delete แบบราย action</Text>
                                        <Space wrap>
                                            {DELIVERY_CAPABILITIES.map((item) => {
                                                const row = deliveryRows.find((candidate) => candidate.resourceKey === item.resourceKey);
                                                const allowed = row ? (row.canAccess || row.canView || row.canCreate || row.canUpdate || row.canDelete) : false;
                                                return (
                                                    <Tag key={item.resourceKey} color={allowed ? "green" : item.securityLevel === "governance" ? "red" : "default"}>
                                                        {item.title}
                                                    </Tag>
                                                );
                                            })}
                                        </Space>
                                    </Space>
                                </Card>
                            )}
                            {printSettingsRows.length > 0 && (
                                <Card size="small" style={{ borderRadius: 12 }}>
                                    <Space direction="vertical" size={8} style={{ width: "100%" }}>
                                        <Text strong>Print-setting Governance</Text>
                                        <Text type="secondary">Capability ระดับหน้าตั้งค่าการพิมพ์ถูกแยกออกจาก page access เพื่อควบคุมราย section ได้จริง</Text>
                                        <Space wrap>
                                            {PRINT_SETTINGS_CAPABILITIES.map((item) => {
                                                const row = printSettingsRows.find((candidate) => candidate.resourceKey === item.resourceKey);
                                                const allowed = row ? (row.canAccess || row.canView || row.canUpdate) : false;
                                                return (
                                                    <Tag key={item.resourceKey} color={allowed ? "green" : item.securityLevel === "governance" ? "red" : "default"}>
                                                        {item.title}
                                                    </Tag>
                                                );
                                            })}
                                        </Space>
                                    </Space>
                                </Card>
                            )}
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
                                    label: `[${getSystemGroup(r.resourceKey, r.route).toUpperCase()}] ${getResourceKind(r.resourceKey) === "menu" ? "เมนู" : getResourceKind(r.resourceKey) === "feature" ? "capability" : "หน้า"} - ${resolvePermissionLabel(r.resourceKey, r.pageLabel)}`,
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
