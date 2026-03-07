"use client";

import React, { useEffect, useMemo } from "react";
import {
    ClockCircleOutlined,
    PlusOutlined,
    ReloadOutlined,
    ShoppingOutlined,
} from "@ant-design/icons";
import { Button, Flex, Grid, Skeleton, Space, Tag, theme, Typography } from "antd";
import { useRouter } from "next/navigation";

import { AccessGuardFallback } from "../../../../../components/pos/AccessGuard";
import RequireOpenShift from "../../../../../components/pos/shared/RequireOpenShift";
import PageContainer from "../../../../../components/ui/page/PageContainer";
import PageSection from "../../../../../components/ui/page/PageSection";
import PageStack from "../../../../../components/ui/page/PageStack";
import UIEmptyState from "../../../../../components/ui/states/EmptyState";
import PageState from "../../../../../components/ui/states/PageState";
import ListPagination from "../../../../../components/ui/pagination/ListPagination";
import { useAuth } from "../../../../../contexts/AuthContext";
import { useChannelStats } from "../../../../../utils/channels/channelStats.utils";
import { OrderStatus, OrderType, SalesOrderSummary } from "../../../../../types/api/pos/salesOrder";
import { useChannelOrders } from "../../../../../utils/pos/channelOrders";
import { useListState } from "../../../../../hooks/pos/useListState";
import { useEffectivePermissions } from "../../../../../hooks/useEffectivePermissions";
import { getOrderNavigationPath } from "../../../../../utils/orders";
import UIPageHeader from "../../../../../components/ui/page/PageHeader";
import { SearchBar } from "../../../../../components/ui/page/SearchBar";
import { SearchInput } from "../../../../../components/ui/input/SearchInput";
import { ModalSelector } from "../../../../../components/ui/select/ModalSelector";
import type { CreatedSort } from "../../../../../components/ui/pagination/ListPagination";

/* ── Theme helpers ── */

const STATUS_THEMES = {
    active: {
        bg: "#FFFBEB",
        border: "#FDE68A",
        badgeBg: "#FDE68A",
        badgeText: "#92400E",
        dotColor: "#F59E0B",
        label: "กำลังดำเนินการ",
    },
    waitingPayment: {
        bg: "#EFF6FF",
        border: "#BFDBFE",
        badgeBg: "#DBEAFE",
        badgeText: "#1D4ED8",
        dotColor: "#3B82F6",
        label: "รอชำระเงิน",
    },
    done: {
        bg: "#ECFDF5",
        border: "#A7F3D0",
        badgeBg: "#D1FAE5",
        badgeText: "#047857",
        dotColor: "#10B981",
        label: "เสร็จสิ้น",
    },
};

function getOrderTheme(status: OrderStatus) {
    if (status === OrderStatus.WaitingForPayment) return STATUS_THEMES.waitingPayment;
    if (status === OrderStatus.Paid || status === OrderStatus.Completed) return STATUS_THEMES.done;
    return STATUS_THEMES.active;
}

function getRelativeAge(raw?: string | null): { label: string; color: string } {
    if (!raw) return { label: "ไม่ทราบเวลา", color: "#94A3B8" };
    const created = new Date(raw);
    if (Number.isNaN(created.getTime())) return { label: "ไม่ทราบเวลา", color: "#94A3B8" };
    
    const diffMs = Math.max(0, Date.now() - created.getTime());
    const diffMinutes = Math.floor(diffMs / 60_000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return { label: "เมื่อสักครู่", color: "#16A34A" };
    
    let label = "";
    let color = "#16A34A"; // Green for < 10 mins

    if (diffDays > 0) {
        label = `${diffDays} วันที่แล้ว`;
        color = "#DC2626"; // Red for > 1 day
    } else if (diffHours > 0) {
        label = `${diffHours} ชั่วโมงที่แล้ว`;
        color = "#DC2626"; // Red for > 1 hour
    } else {
        label = `${diffMinutes} นาทีที่แล้ว`;
        if (diffMinutes >= 30) color = "#DC2626";
        else if (diffMinutes >= 10) color = "#D97706";
    }

    return { label, color };
}

function formatMoney(amount: number): string {
    return `฿${Number(amount || 0).toLocaleString()}`;
}

const STYLES = `
.takeaway-order-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(15, 23, 42, 0.08);
}
.takeaway-order-card:active {
    transform: translateY(-1px);
}
@media (max-width: 767px) {
    .takeaway-order-card:active {
        transform: scale(0.98);
    }
}
.takeaway-order-card {
    -webkit-user-select: none;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
}
@keyframes takeawayCardFadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
.takeaway-card-animate {
    animation: takeawayCardFadeIn 0.35s ease-out forwards;
    opacity: 0;
}
`;

/* ── Order Card ── */

function OrderCard({
    order,
    onClick,
    isMobile,
}: {
    order: SalesOrderSummary;
    onClick: () => void;
    isMobile: boolean;
}) {
    const statusTheme = getOrderTheme(order.status);
    const age = getRelativeAge(order.create_date);
    const orderSuffix = order.order_no.split("-").pop() || order.order_no;

    return (
        <div
            onClick={onClick}
            className="takeaway-order-card"
            style={{
                background: "#ffffff",
                borderRadius: 18,
                border: `1.5px solid ${statusTheme.border}`,
                padding: isMobile ? "16px 14px" : "18px 20px",
                cursor: "pointer",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                display: "flex",
                flexDirection: "column",
                gap: 14,
                position: "relative",
                width: "100%",
                minWidth: 0,
                overflow: "hidden"
            }}
        >
            {/* Top: Icon + order info + status badge */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
                    <div
                        style={{
                            width: 38, height: 38, borderRadius: 12,
                            background: statusTheme.bg, border: `1px solid ${statusTheme.border}`,
                            display: "grid", placeItems: "center", flexShrink: 0,
                        }}
                    >
                        <ShoppingOutlined style={{ fontSize: 16, color: statusTheme.badgeText }} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            #{orderSuffix}
                        </div>
                        <div style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {order.order_no}
                        </div>
                    </div>
                </div>
                <div style={{ padding: "4px 10px", borderRadius: 999, background: statusTheme.badgeBg, fontSize: 12, fontWeight: 700, color: statusTheme.badgeText, whiteSpace: "nowrap", lineHeight: 1.3, flexShrink: 0 }}>
                    {statusTheme.label}
                </div>
            </div>

            {/* Middle: items count + total */}
            <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 2 }}>รายการสินค้า</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#1E293B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {order.items_count || 0} รายการ
                    </div>
                </div>
                <div style={{ flex: 1, textAlign: "right", minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 2 }}>ยอดรวม</div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: statusTheme.badgeText, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {formatMoney(Number(order.total_amount || 0))}
                    </div>
                </div>
            </div>

            {/* Bottom: time elapsed */}
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <ClockCircleOutlined style={{ fontSize: 12, color: age.color }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: age.color }}>{age.label}</span>
            </div>
        </div>
    );
}

/* ── Auth guard ── */

export default function TakeawayPage() {
    const { user, loading: authLoading } = useAuth();
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });
    const canCreateOrder = can("orders.page", "create");

    if (authLoading || permissionLoading) {
        return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์การใช้งาน..." />;
    }
    if (!can("orders.page", "view")) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้" tone="danger" />;
    }

    return (
        <RequireOpenShift>
            <TakeawayContent canCreateOrder={canCreateOrder} />
        </RequireOpenShift>
    );
}

/* ── Main content ── */

function TakeawayContent({ canCreateOrder }: { canCreateOrder: boolean }) {
    const router = useRouter();
    const { stats } = useChannelStats();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;
    const { token } = theme.useToken();

    const {
        page, setPage, pageSize, setPageSize, total, setTotal,
        searchText, setSearchText, debouncedSearch,
        createdSort, setCreatedSort, filters, updateFilter, isUrlReady,
    } = useListState({
        defaultPageSize: 10,
        defaultFilters: { status: "all" as "active" | "waiting_payment" | "all" },
    });

    const statusFilter = useMemo(() => {
        if (filters.status === "active") return [OrderStatus.Pending, OrderStatus.Cooking, OrderStatus.Served].join(",");
        if (filters.status === "waiting_payment") return OrderStatus.WaitingForPayment;
        return "";
    }, [filters.status]);

    const { orders, total: apiTotal, isLoading, isFetching, error, refresh } = useChannelOrders({
        orderType: OrderType.TakeAway,
        page, limit: pageSize, statusFilter,
        query: debouncedSearch, createdSort, enabled: isUrlReady,
    });

    useEffect(() => { setTotal(apiTotal); }, [apiTotal, setTotal]);

    const handleOpenCreate = () => router.push("/pos/channels/takeaway/buying");

    // Responsive grid columns with minmax(0, 1fr) to prevent overflow
    const gridColumns = isMobile
        ? "minmax(0, 1fr)"
        : screens.xxl
            ? "repeat(4, minmax(0, 1fr))"
            : screens.lg
                ? "repeat(3, minmax(0, 1fr))"
                : "repeat(2, minmax(0, 1fr))";

    return (
        <React.Fragment>
            <style dangerouslySetInnerHTML={{ __html: STYLES }} />
            <div style={{ width: '100%', overflowX: 'hidden', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                <UIPageHeader
                    title="สั่งกลับบ้าน"
                    icon={<ShoppingOutlined style={{ fontSize: 18, color: "#059669" }} />}
                    onBack={() => router.push("/pos")}
                    actions={
                        <Space size={8} wrap>
                            {stats?.takeaway_waiting_payment && stats.takeaway_waiting_payment > 0 ? (
                                <Tag 
                                    color="processing" 
                                    style={{ 
                                        borderRadius: 10, 
                                        padding: "2px 10px", 
                                        fontWeight: 600,
                                        background: "#DBEAFE",
                                        border: "1px solid #93C5FD",
                                        color: "#1D4ED8"
                                    }}
                                >
                                    รอชำระเงิน: {stats.takeaway_waiting_payment}
                                </Tag>
                            ) : null}
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={() => void refresh(false)}
                                loading={isLoading || isFetching}
                                style={{ borderRadius: 10 }}
                            />
                            {canCreateOrder && (
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={handleOpenCreate}
                                    style={{
                                        borderRadius: 12,
                                        fontWeight: 700,
                                        background: "linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)",
                                        border: "none"
                                    }}
                                >
                                    เพิ่มออเดอร์
                                </Button>
                            )}
                        </Space>
                    }
                />

                <PageContainer style={{ flex: 1, width: '100%', maxWidth: '100%' }}>
                    <PageStack gap={20} style={{ width: '100%' }}>
                        {/* ── Search + Filters ── */}
                        <div style={{ width: '100%', maxWidth: 1200, margin: '0 auto' }}>
                            <SearchBar>
                                <SearchInput
                                    placeholder="ค้นหา"
                                    value={searchText}
                                    onChange={(val) => setSearchText(val)}
                                />
                                <Space wrap size={10} style={{ justifyContent: 'space-between', width: '100%' }}>
                                    <Space wrap size={10}>
                                        <ModalSelector<"active" | "waiting_payment" | "all">
                                            title="เลือกสถานะออเดอร์"
                                            options={[
                                                { label: "ทุกสถานะ", value: "all" },
                                                { label: "กำลังดำเนินการ", value: "active" },
                                                { label: "รอชำระเงิน", value: "waiting_payment" },
                                            ]}
                                            value={filters.status as "active" | "waiting_payment" | "all"}
                                            onChange={(v) => updateFilter("status", v)}
                                            style={{ minWidth: 140 }}
                                        />
                                        <ModalSelector<CreatedSort>
                                            title="เรียงลำดับตาม"
                                            options={[
                                                { label: "สั่งก่อน", value: "old" },
                                                { label: "สั่งล่าสุด", value: "new" },
                                            ]}
                                            value={createdSort}
                                            onChange={(v) => setCreatedSort(v)}
                                            style={{ minWidth: 140 }}
                                        />
                                    </Space>
                                </Space>
                            </SearchBar>
                        </div>

                        {/* ── Order List Section ── */}
                        <div style={{ width: '100%', maxWidth: 1200, margin: '0 auto' }}>
                            <PageSection
                                title="รายการออเดอร์"
                                style={{ width: '100%', overflow: 'hidden' }}
                                extra={
                                    <Space size={8} wrap>
                                        {isFetching && !isLoading ? <Tag color="processing">กำลังอัปเดต...</Tag> : null}
                                        <Typography.Text strong style={{ color: token.colorText }}>
                                            {total} รายการ
                                        </Typography.Text>
                                    </Space>
                                }
                            >
                                <div style={{ width: '100%', overflow: 'hidden' }}>
                                    <Space direction="vertical" size={20} style={{ width: '100%' }}>
                                        {error ? (
                                            <PageState status="error" title="โหลดออเดอร์ไม่สำเร็จ" error={error} onRetry={() => void refresh(false)} />
                                        ) : isLoading ? (
                                            <div style={{ display: "grid", gridTemplateColumns: gridColumns, gap: isMobile ? 12 : 16, width: '100%' }}>
                                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                                    <div key={i} style={{ background: "#fff", borderRadius: 18, padding: 24, border: `1px solid ${token.colorBorderSecondary}` }}>
                                                        <Skeleton active paragraph={{ rows: 3 }} />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : orders.length === 0 ? (
                                            <UIEmptyState
                                                title={debouncedSearch.trim() ? "ไม่พบออเดอร์ที่ค้นหา" : "ยังไม่มีออเดอร์สั่งกลับบ้าน"}
                                                description={debouncedSearch.trim() ? "ลองใช้คำค้นหาอื่น หรือเปลี่ยนตัวกรอง" : "เริ่มสร้างออเดอร์ใหม่โดยกดปุ่ม \"เพิ่มออเดอร์\" ด้านบน"}
                                            />
                                        ) : (
                                            <div style={{ display: "grid", gridTemplateColumns: gridColumns, gap: isMobile ? 12 : 16, width: '100%' }}>
                                                {orders.map((order, i) => (
                                                    <div key={order.id} className="takeaway-card-animate" style={{ animationDelay: `${Math.min(i * 0.04, 0.4)}s`, minWidth: 0 }}>
                                                        <OrderCard
                                                            order={order as SalesOrderSummary}
                                                            onClick={() => router.push(getOrderNavigationPath(order as SalesOrderSummary))}
                                                            isMobile={isMobile}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Pagination */}
                                        {total > 0 && (
                                            <div style={{
                                                marginTop: 8,
                                                paddingTop: 16,
                                                borderTop: `1px solid ${token.colorBorderSecondary}`,
                                                width: '100%'
                                            }}>
                                                <ListPagination
                                                    page={page}
                                                    total={total}
                                                    pageSize={pageSize}
                                                    loading={isLoading || isFetching}
                                                    onPageChange={setPage}
                                                    onPageSizeChange={setPageSize}
                                                    activeColor="#7C3AED"
                                                />
                                            </div>
                                        )}
                                    </Space>
                                </div>
                            </PageSection>
                        </div>
                    </PageStack>
                </PageContainer>
            </div>
        </React.Fragment>
    );
}
