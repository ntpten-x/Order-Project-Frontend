"use client";

import React, { useMemo, useState } from "react";
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    ReloadOutlined,
    SearchOutlined,
    ShopOutlined,
    StopOutlined,
    TableOutlined,
} from "@ant-design/icons";
import { Button, Col, Input, Row, Skeleton, Space, Tag, Typography } from "antd";
import { useRouter } from "next/navigation";

import { ChannelHero, DashboardTile, SummaryPanel, type ChannelAccent } from "../../../../../components/pos/channels/ChannelPrimitives";
import { AccessGuardFallback } from "../../../../../components/pos/AccessGuard";
import RequireOpenShift from "../../../../../components/pos/shared/RequireOpenShift";
import PageContainer from "../../../../../components/ui/page/PageContainer";
import PageSection from "../../../../../components/ui/page/PageSection";
import PageStack from "../../../../../components/ui/page/PageStack";
import { useAuth } from "../../../../../contexts/AuthContext";
import { useTables } from "../../../../../hooks/pos/useTables";
import { useEffectivePermissions } from "../../../../../hooks/useEffectivePermissions";
import { Tables, TableStatus } from "../../../../../types/api/pos/tables";
import { getTableNavigationPath } from "../../../../../utils/orders";

const { Text } = Typography;

const dineInAccent: ChannelAccent = {
    primary: "#2563EB",
    soft: "#EFF6FF",
    border: "#BFDBFE",
    gradient: "linear-gradient(135deg, rgba(37,99,235,0.16) 0%, rgba(255,255,255,0.95) 72%)",
};

type FilterKey = "all" | "available" | "occupied" | "inactive";

export default function DineInTableSelectionPage() {
    const { user, loading: authLoading } = useAuth();
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });
    const canManageTables = can("tables.page", "update");

    if (authLoading || permissionLoading) {
        return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์การใช้งาน..." />;
    }

    if (!can("tables.page", "view")) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้" tone="danger" />;
    }

    return (
        <RequireOpenShift>
            <DineInTableSelectionPageContent canManageTables={canManageTables} />
        </RequireOpenShift>
    );
}

function DineInTableSelectionPageContent({ canManageTables }: { canManageTables: boolean }) {
    const router = useRouter();
    const { tables, isLoading, mutate } = useTables();
    const [searchText, setSearchText] = useState("");
    const [filter, setFilter] = useState<FilterKey>("all");

    const stats = useMemo(() => {
        const allTables = tables as Tables[];
        return {
            total: allTables.length,
            available: allTables.filter((table) => table.is_active && table.status === TableStatus.Available).length,
            occupied: allTables.filter((table) => table.is_active && table.status !== TableStatus.Available).length,
            inactive: allTables.filter((table) => !table.is_active).length,
        };
    }, [tables]);

    const visibleTables = useMemo(() => {
        const query = searchText.trim().toLowerCase();
        return (tables as Tables[])
            .filter((table) => {
                if (filter === "available") return table.is_active && table.status === TableStatus.Available;
                if (filter === "occupied") return table.is_active && table.status !== TableStatus.Available;
                if (filter === "inactive") return !table.is_active;
                return true;
            })
            .filter((table) => {
                if (!query) return true;
                return (
                    table.table_name.toLowerCase().includes(query) ||
                    String(table.active_order_status || "").toLowerCase().includes(query)
                );
            })
            .sort((left, right) => left.table_name.localeCompare(right.table_name, "th"));
    }, [filter, searchText, tables]);

    return (
        <PageContainer>
            <PageStack gap={20}>
                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={17}>
                        <PageSection title="รายการโต๊ะ" extra={<Text strong>{visibleTables.length} โต๊ะ</Text>}>
                            <PageStack gap={16}>
                                {isLoading ? (
                                    <Skeleton active paragraph={{ rows: 8 }} />
                                ) : (
                                    <Row gutter={[16, 16]}>
                                        {visibleTables.map((table) => {
                                            const isInactive = !table.is_active;
                                            const isAvailable = table.status === TableStatus.Available && table.is_active;
                                            const statusLabel = isInactive
                                                ? "ปิดใช้งาน"
                                                : isAvailable
                                                    ? "ว่าง"
                                                    : "กำลังใช้งาน";

                                            return (
                                                <Col xs={24} sm={12} xl={8} key={table.id}>
                                                    <DashboardTile
                                                        title={table.table_name}
                                                        description={
                                                            table.active_order_status
                                                                ? `สถานะล่าสุด: ${table.active_order_status}`
                                                                : isAvailable
                                                                    ? "พร้อมรับออเดอร์ใหม่"
                                                                    : "มีออเดอร์กำลังดำเนินการ"
                                                        }
                                                        icon={<TableOutlined style={{ fontSize: 20 }} />}
                                                        accent={
                                                            isInactive
                                                                ? {
                                                                    primary: "#64748B",
                                                                    soft: "#F8FAFC",
                                                                    border: "#E2E8F0",
                                                                    gradient: dineInAccent.gradient,
                                                                }
                                                                : isAvailable
                                                                    ? dineInAccent
                                                                    : {
                                                                        primary: "#DC2626",
                                                                        soft: "#FEF2F2",
                                                                        border: "#FECACA",
                                                                        gradient: dineInAccent.gradient,
                                                                    }
                                                        }
                                                        meta={
                                                            <Tag
                                                                color={isInactive ? "default" : isAvailable ? "success" : "error"}
                                                                style={{ margin: 0, borderRadius: 999, paddingInline: 10, fontWeight: 700 }}
                                                            >
                                                                {statusLabel}
                                                            </Tag>
                                                        }
                                                        onClick={isInactive ? undefined : () => router.push(getTableNavigationPath(table))}
                                                        actionLabel={isInactive ? "ไม่พร้อมใช้งาน" : "เปิดโต๊ะ"}
                                                    />
                                                </Col>
                                            );
                                        })}
                                    </Row>
                                )}
                            </PageStack>
                        </PageSection>
                    </Col>
                </Row>
            </PageStack>
        </PageContainer>
    );
}

function Legend({
    icon,
    label,
    color,
}: {
    icon: React.ReactNode;
    label: string;
    color: string;
}) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ color }}>{icon}</div>
            <Text type="secondary">{label}</Text>
        </div>
    );
}
