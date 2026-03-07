"use client";

import React, { useMemo } from "react";
import {
    ArrowLeftOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ReloadOutlined,
    ShopOutlined,
} from "@ant-design/icons";
import { Grid, Skeleton, Typography } from "antd";
import { useRouter } from "next/navigation";

import { AccessGuardFallback } from "../../../../../components/pos/AccessGuard";
import RequireOpenShift from "../../../../../components/pos/shared/RequireOpenShift";
import PageContainer from "../../../../../components/ui/page/PageContainer";
import { useAuth } from "../../../../../contexts/AuthContext";
import { useTables } from "../../../../../hooks/pos/useTables";
import { useEffectivePermissions } from "../../../../../hooks/useEffectivePermissions";
import { Tables, TableStatus } from "../../../../../types/api/pos/tables";
import { getTableNavigationPath, getOrderStatusText, isWaitingForPaymentStatus } from "../../../../../utils/orders";

const { Text } = Typography;

/* ────────────────────────────────────────────
   Theme helpers
   ──────────────────────────────────────────── */

/** Derive a visual theme for each table card based on status */
function getTableTheme(table: Tables) {
    if (!table.is_active) {
        return {
            key: "inactive" as const,
            bg: "#F8FAFC",
            border: "#E2E8F0",
            iconBg: "#F1F5F9",
            iconBorder: "#CBD5E1",
            iconColor: "#94A3B8",
            dotColor: "#94A3B8",
            statusLabel: "ปิดใช้งาน",
            statusColor: "#94A3B8",
            actionLabel: "ปิดใช้งาน",
            actionBg: "#E2E8F0",
            actionText: "#64748B",
            icon: <CloseCircleOutlined />,
        };
    }

    if (table.status === TableStatus.Available) {
        return {
            key: "available" as const,
            bg: "#ECFDF5",
            border: "#A7F3D0",
            iconBg: "#D1FAE5",
            iconBorder: "#6EE7B7",
            iconColor: "#059669",
            dotColor: "#10B981",
            statusLabel: "ว่าง",
            statusColor: "#059669",
            actionLabel: "รอรับออเดอร์",
            actionBg: "#D1FAE5",
            actionText: "#047857",
            icon: <CheckCircleOutlined />,
        };
    }

    // Occupied — differentiate by active_order_status
    if (isWaitingForPaymentStatus(table.active_order_status)) {
        return {
            key: "waitingPayment" as const,
            bg: "#EFF6FF",
            border: "#BFDBFE",
            iconBg: "#DBEAFE",
            iconBorder: "#93C5FD",
            iconColor: "#2563EB",
            dotColor: "#3B82F6",
            statusLabel: "ไม่ว่าง",
            statusColor: "#2563EB",
            actionLabel: "รอชำระเงิน",
            actionBg: "#DBEAFE",
            actionText: "#1D4ED8",
            icon: <CloseCircleOutlined />,
        };
    }

    // Default occupied (Pending / Cooking / Served)
    return {
        key: "inProgress" as const,
        bg: "#FFFBEB",
        border: "#FDE68A",
        iconBg: "#FEF3C7",
        iconBorder: "#FCD34D",
        iconColor: "#D97706",
        dotColor: "#F59E0B",
        statusLabel: "ไม่ว่าง",
        statusColor: "#D97706",
        actionLabel: getOrderStatusText(table.active_order_status || "pending"),
        actionBg: "#FDE68A",
        actionText: "#92400E",
        icon: <CloseCircleOutlined />,
    };
}

/* ────────────────────────────────────────────
   Table Card Component
   ──────────────────────────────────────────── */

function TableCard({
    table,
    onClick,
    isMobile,
}: {
    table: Tables;
    onClick: () => void;
    isMobile: boolean;
}) {
    const t = getTableTheme(table);
    const isClickable = table.is_active;

    return (
        <div
            onClick={isClickable ? onClick : undefined}
            className="dine-table-card"
            style={{
                background: t.bg,
                borderRadius: 18,
                border: `1.5px solid ${t.border}`,
                padding: isMobile ? "22px 16px 18px" : "28px 20px 22px",
                cursor: isClickable ? "pointer" : "default",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                gap: isMobile ? 6 : 10,
                opacity: table.is_active ? 1 : 0.5,
                position: "relative",
            }}
        >
            {/* Status icon */}
            <div
                style={{
                    width: isMobile ? 44 : 50,
                    height: isMobile ? 44 : 50,
                    borderRadius: 14,
                    background: t.iconBg,
                    border: `1.5px solid ${t.iconBorder}`,
                    display: "grid",
                    placeItems: "center",
                    fontSize: isMobile ? 20 : 24,
                    color: t.iconColor,
                    transition: "transform 0.2s ease",
                }}
                className="dine-table-icon"
            >
                {t.icon}
            </div>

            {/* Table number */}
            <span
                style={{
                    fontSize: isMobile ? 28 : 36,
                    fontWeight: 800,
                    color: "#1E293B",
                    lineHeight: 1.1,
                    marginTop: 2,
                }}
            >
                {table.table_name}
            </span>

            {/* Status dot + label */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 2,
                }}
            >
                <span
                    style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: t.dotColor,
                        display: "inline-block",
                        flexShrink: 0,
                    }}
                />
                <span
                    style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: t.statusColor,
                    }}
                >
                    {t.statusLabel}
                </span>
            </div>

            {/* Action chip */}
            <div
                style={{
                    marginTop: isMobile ? 6 : 8,
                    padding: "6px 16px",
                    borderRadius: 999,
                    background: t.actionBg,
                    fontSize: 13,
                    fontWeight: 700,
                    color: t.actionText,
                    lineHeight: 1,
                    whiteSpace: "nowrap",
                }}
            >
                {t.actionLabel}
            </div>
        </div>
    );
}

/* ────────────────────────────────────────────
   Auth wrapper
   ──────────────────────────────────────────── */

export default function DineInTableSelectionPage() {
    const { user, loading: authLoading } = useAuth();
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });

    if (authLoading || permissionLoading) {
        return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์การใช้งาน..." />;
    }

    if (!can("tables.page", "view")) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้" tone="danger" />;
    }

    return (
        <RequireOpenShift>
            <DineInContent />
        </RequireOpenShift>
    );
}

/* ────────────────────────────────────────────
   Main content
   ──────────────────────────────────────────── */

function DineInContent() {
    const router = useRouter();
    const { tables, isLoading, mutate } = useTables();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;

    const stats = useMemo(() => {
        const all = tables as Tables[];
        return {
            available: all.filter((t) => t.is_active && t.status === TableStatus.Available).length,
            occupied: all.filter((t) => t.is_active && t.status !== TableStatus.Available).length,
        };
    }, [tables]);

    const sorted = useMemo(() => {
        return [...(tables as Tables[])]
            .filter((t) => t.is_active)
            .sort((a, b) => a.table_name.localeCompare(b.table_name, "th"));
    }, [tables]);

    return (
        <>
            {/* Scoped styles */}
            <style jsx global>{`
                .dine-table-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 6px 20px rgba(15, 23, 42, 0.08);
                }
                .dine-table-card:active {
                    transform: translateY(-1px);
                }
                .dine-table-card:hover .dine-table-icon {
                    transform: scale(1.06);
                }
                @media (max-width: 767px) {
                    .dine-table-card:active {
                        transform: scale(0.97);
                    }
                }
                .dine-table-card {
                    -webkit-user-select: none;
                    user-select: none;
                    -webkit-tap-highlight-color: transparent;
                }
                @keyframes dineCardFadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .dine-card-animate {
                    animation: dineCardFadeIn 0.35s ease-out forwards;
                    opacity: 0;
                }

                .dine-header-back:hover {
                    background: #F1F5F9;
                }
                .dine-refresh-btn:hover {
                    background: #F1F5F9 !important;
                    border-color: #CBD5E1 !important;
                }
            `}</style>

            <PageContainer>
                <div style={{ paddingTop: isMobile ? 4 : 8 }}>
                    {/* ── Header row ── */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: isMobile ? "flex-start" : "center",
                            flexDirection: isMobile ? "column" : "row",
                            gap: isMobile ? 14 : 0,
                            marginBottom: isMobile ? 20 : 28,
                        }}
                    >
                        {/* Left: Back + Title */}
                        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                            <div
                                onClick={() => router.push("/pos")}
                                className="dine-header-back"
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 10,
                                    display: "grid",
                                    placeItems: "center",
                                    cursor: "pointer",
                                    transition: "background 0.15s ease",
                                    flexShrink: 0,
                                }}
                            >
                                <ArrowLeftOutlined style={{ fontSize: 16, color: "#475569" }} />
                            </div>

                            <div
                                style={{
                                    width: 38,
                                    height: 38,
                                    borderRadius: 12,
                                    background: "#EFF6FF",
                                    border: "1px solid #BFDBFE",
                                    display: "grid",
                                    placeItems: "center",
                                    flexShrink: 0,
                                }}
                            >
                                <ShopOutlined style={{ fontSize: 18, color: "#2563EB" }} />
                            </div>

                            <div>
                                <div
                                    style={{
                                        fontSize: isMobile ? 20 : 24,
                                        fontWeight: 700,
                                        color: "#0F172A",
                                        lineHeight: 1.2,
                                    }}
                                >
                                    หน้าร้าน
                                </div>
                                <div style={{ fontSize: 13, color: "#94A3B8", marginTop: 2 }}>
                                    เลือกโต๊ะ
                                </div>
                            </div>
                        </div>

                        {/* Right: Status badges + Refresh */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                flexWrap: "wrap",
                            }}
                        >
                            {/* Available badge */}
                            <div
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 4,
                                    padding: "5px 14px",
                                    borderRadius: 999,
                                    background: "#ECFDF5",
                                    border: "1px solid #A7F3D0",
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: "#059669",
                                }}
                            >
                                ว่าง {stats.available}
                            </div>

                            {/* Occupied badge */}
                            <div
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 4,
                                    padding: "5px 14px",
                                    borderRadius: 999,
                                    background: "#FEF3C7",
                                    border: "1px solid #FDE68A",
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: "#D97706",
                                }}
                            >
                                ไม่ว่าง {stats.occupied}
                            </div>

                            {/* Refresh button */}
                            <div
                                onClick={() => mutate()}
                                className="dine-refresh-btn"
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 6,
                                    padding: "5px 14px",
                                    borderRadius: 999,
                                    background: "#fff",
                                    border: "1px solid #E2E8F0",
                                    cursor: "pointer",
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: "#475569",
                                    transition: "all 0.15s ease",
                                    userSelect: "none",
                                }}
                            >
                                <ReloadOutlined style={{ fontSize: 13 }} />
                                รีเฟรช
                            </div>
                        </div>
                    </div>

                    {/* ── Section label ── */}
                    <div
                        style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: "#64748B",
                            marginBottom: 14,
                        }}
                    >
                        โต๊ะ
                    </div>

                    {/* ── Table grid ── */}
                    {isLoading ? (
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
                                gap: isMobile ? 12 : 16,
                            }}
                        >
                            {[1, 2, 3, 4].map((i) => (
                                <div
                                    key={i}
                                    style={{
                                        background: "#fff",
                                        borderRadius: 18,
                                        padding: 28,
                                        border: "1px solid #F1F5F9",
                                    }}
                                >
                                    <Skeleton active paragraph={{ rows: 3 }} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
                                gap: isMobile ? 12 : 16,
                            }}
                        >
                            {sorted.map((table, i) => (
                                <div
                                    key={table.id}
                                    className="dine-card-animate"
                                    style={{ animationDelay: `${Math.min(i * 0.04, 0.4)}s` }}
                                >
                                    <TableCard
                                        table={table}
                                        onClick={() => router.push(getTableNavigationPath(table))}
                                        isMobile={isMobile}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Empty state */}
                    {!isLoading && sorted.length === 0 && (
                        <div
                            style={{
                                textAlign: "center",
                                padding: "48px 20px",
                                color: "#94A3B8",
                            }}
                        >
                            <ShopOutlined style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }} />
                            <div style={{ fontSize: 15 }}>ยังไม่มีโต๊ะในระบบ</div>
                        </div>
                    )}
                </div>
            </PageContainer>
        </>
    );
}
