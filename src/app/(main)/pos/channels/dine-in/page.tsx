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
                <ChannelHero
                    eyebrow="Dine In"
                    title="โต๊ะหน้าร้าน"
                    subtitle="ดูสถานะโต๊ะทั้งหมดในหน้าเดียว เลือกโต๊ะว่างได้ทันที และเห็นโต๊ะที่มีออเดอร์ค้างอย่างชัดเจน"
                    icon={<ShopOutlined style={{ fontSize: 22 }} />}
                    accent={dineInAccent}
                    metrics={[
                        { label: "โต๊ะทั้งหมด", value: stats.total },
                        { label: "พร้อมรับลูกค้า", value: stats.available },
                        { label: "กำลังใช้งาน", value: stats.occupied },
                    ]}
                    actions={
                        <Space wrap>
                            <Button icon={<ReloadOutlined />} onClick={() => void mutate()} loading={isLoading}>
                                รีเฟรช
                            </Button>
                            {canManageTables ? (
                                <Button type="primary" onClick={() => router.push("/pos/tables")}>
                                    จัดการโต๊ะ
                                </Button>
                            ) : null}
                        </Space>
                    }
                    footer={<Tag color="blue" style={{ margin: 0, borderRadius: 999, paddingInline: 12 }}>ปิดใช้งาน {stats.inactive} โต๊ะ</Tag>}
                />

                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={17}>
                        <PageSection title="รายการโต๊ะ" extra={<Text strong>{visibleTables.length} โต๊ะ</Text>}>
                            <PageStack gap={16}>
                                <Space wrap size={10}>
                                    <Input
                                        allowClear
                                        prefix={<SearchOutlined />}
                                        placeholder="ค้นหาเลขโต๊ะหรือสถานะ"
                                        value={searchText}
                                        onChange={(event) => setSearchText(event.target.value)}
                                        style={{ minWidth: 240 }}
                                    />
                                    {[
                                        { key: "all", label: "ทั้งหมด" },
                                        { key: "available", label: "ว่าง" },
                                        { key: "occupied", label: "กำลังใช้งาน" },
                                        { key: "inactive", label: "ปิดใช้งาน" },
                                    ].map((item) => (
                                        <Button
                                            key={item.key}
                                            type={filter === item.key ? "primary" : "default"}
                                            onClick={() => setFilter(item.key as FilterKey)}
                                        >
                                            {item.label}
                                        </Button>
                                    ))}
                                </Space>

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

                    <Col xs={24} lg={7}>
                        <PageSection title="สรุปสถานะโต๊ะ">
                            <PageStack gap={12}>
                                <SummaryPanel title="โต๊ะว่าง" value={stats.available} hint="พร้อมเริ่มออเดอร์ใหม่" accent={dineInAccent} />
                                <SummaryPanel
                                    title="โต๊ะกำลังใช้งาน"
                                    value={stats.occupied}
                                    hint="มีออเดอร์หรือมีลูกค้านั่งอยู่"
                                    accent={{
                                        primary: "#DC2626",
                                        soft: "#FEF2F2",
                                        border: "#FECACA",
                                        gradient: dineInAccent.gradient,
                                    }}
                                />
                                <SummaryPanel
                                    title="โต๊ะปิดใช้งาน"
                                    value={stats.inactive}
                                    hint="ยังไม่เปิดให้รับลูกค้า"
                                    accent={{
                                        primary: "#64748B",
                                        soft: "#F8FAFC",
                                        border: "#E2E8F0",
                                        gradient: dineInAccent.gradient,
                                    }}
                                />

                                <div style={{ display: "grid", gap: 8 }}>
                                    <Legend icon={<CheckCircleOutlined />} label="โต๊ะพร้อมใช้งาน" color="#16A34A" />
                                    <Legend icon={<CloseCircleOutlined />} label="มีออเดอร์กำลังดำเนินการ" color="#DC2626" />
                                    <Legend icon={<StopOutlined />} label="โต๊ะถูกปิดใช้งาน" color="#64748B" />
                                </div>
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
