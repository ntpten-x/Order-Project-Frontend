"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ClockCircleOutlined,
    PlusOutlined,
    ReloadOutlined,
    RocketOutlined,
} from "@ant-design/icons";
import { Button, Flex, Grid, Input, Modal, Skeleton, Space, Tag, message, theme, Typography } from "antd";
import { useRouter } from "next/navigation";

import { AccessGuardFallback } from "../../../../../components/pos/AccessGuard";
import RequireOpenShift from "../../../../../components/pos/shared/RequireOpenShift";
import PageContainer from "../../../../../components/ui/page/PageContainer";
import PageSection from "../../../../../components/ui/page/PageSection";
import PageStack from "../../../../../components/ui/page/PageStack";
import UIEmptyState from "../../../../../components/ui/states/EmptyState";
import PageState from "../../../../../components/ui/states/PageState";
import ListPagination from "../../../../../components/ui/pagination/ListPagination";
import SmartAvatar from "../../../../../components/ui/image/SmartAvatar";
import { useAuth } from "../../../../../contexts/AuthContext";
import { useChannelStats } from "../../../../../utils/channels/channelStats.utils";
import { OrderStatus, OrderType, SalesOrderSummary } from "../../../../../types/api/pos/salesOrder";
import { Delivery } from "../../../../../types/api/pos/delivery";
import { useChannelOrders } from "../../../../../utils/pos/channelOrders";
import { useListState } from "../../../../../hooks/pos/useListState";
import { useEffectivePermissions } from "../../../../../hooks/useEffectivePermissions";
import { useDelivery } from "../../../../../hooks/pos/useDelivery";
import { getOrderNavigationPath } from "../../../../../utils/orders";
import { resolveImageSource } from "../../../../../utils/image/source";
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
        label: "กำลังดำเนินการ",
    },
    waitingDelivery: {
        bg: "#FDF2F8",
        border: "#FBCFE8",
        badgeBg: "#FCE7F3",
        badgeText: "#BE185D",
        label: "รอส่ง",
    },
    done: {
        bg: "#ECFDF5",
        border: "#A7F3D0",
        badgeBg: "#D1FAE5",
        badgeText: "#047857",
        label: "เสร็จสิ้น",
    },
};

const DELIVERY_OPEN_STATUSES = [
    OrderStatus.Pending,
    OrderStatus.Cooking,
    OrderStatus.Served,
    OrderStatus.WaitingForPayment,
] as const;

const DELIVERY_ACTIVE_STATUSES = [
    OrderStatus.Pending,
    OrderStatus.Cooking,
    OrderStatus.Served,
] as const;

const DELIVERY_VISIBLE_STATUS_SET = new Set<OrderStatus>(DELIVERY_OPEN_STATUSES);

type DeliveryListStatusFilter = "active" | "waiting_payment" | "all";

function getOrderTheme(status: OrderStatus) {
    if (status === OrderStatus.WaitingForPayment) return STATUS_THEMES.waitingDelivery;
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
    let color = "#16A34A";

    if (diffDays > 0) {
        label = `${diffDays} วันที่แล้ว`;
        color = "#DC2626";
    } else if (diffHours > 0) {
        label = `${diffHours} ชั่วโมงที่แล้ว`;
        color = "#DC2626";
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
.delivery-order-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(15, 23, 42, 0.08);
}
.delivery-order-card:active {
    transform: translateY(-1px);
}
@media (max-width: 767px) {
    .delivery-order-card:active {
        transform: scale(0.98);
    }
}
.delivery-order-card {
    -webkit-user-select: none;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
}
@keyframes deliveryCardFadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
.delivery-card-animate {
    animation: deliveryCardFadeIn 0.35s ease-out forwards;
    opacity: 0;
}
`;

/* ── Delivery Order Card ── */

interface DeliveryOrderCardProps {
    order: SalesOrderSummary;
    provider?: Delivery | null;
    onClick: () => void;
    isMobile: boolean;
}

function DeliveryOrderCard({ order, provider, onClick, isMobile }: DeliveryOrderCardProps) {
    const statusTheme = getOrderTheme(order.status);
    const age = getRelativeAge(order.create_date);
    const displayCode = order.delivery_code || order.order_no;
    const providerName = provider?.delivery_name || order.delivery?.delivery_name || "Delivery";
    const hasLogo = Boolean(resolveImageSource(provider?.logo));

    return (
        <div
            onClick={onClick}
            className="delivery-order-card"
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
                overflow: "hidden",
            }}
        >
            {/* Top: Provider logo + delivery code + status badge */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
                    <SmartAvatar
                        src={provider?.logo}
                        alt={providerName}
                        size={38}
                        shape="square"
                        icon={<RocketOutlined />}
                        imageStyle={{ objectFit: "contain" }}
                        style={{
                            borderRadius: 10,
                            background: hasLogo ? "#ffffff" : statusTheme.bg,
                            border: `1px solid ${statusTheme.border}`,
                            flexShrink: 0,
                        }}
                    />
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {displayCode}
                        </div>
                        <Tag
                            style={{
                                margin: 0, marginTop: 2, borderRadius: 6, padding: "0 6px",
                                fontSize: 11, fontWeight: 600, lineHeight: "18px",
                                background: hasLogo ? "#ECFDF5" : statusTheme.bg,
                                borderColor: hasLogo ? "#A7F3D0" : statusTheme.border,
                                color: hasLogo ? "#059669" : statusTheme.badgeText,
                            }}
                        >
                            {providerName}
                        </Tag>
                    </div>
                </div>
                <div style={{ padding: "4px 10px", borderRadius: 999, background: statusTheme.badgeBg, fontSize: 12, fontWeight: 700, color: statusTheme.badgeText, whiteSpace: "nowrap", lineHeight: 1.3, flexShrink: 0 }}>
                    {statusTheme.label}
                </div>
            </div>

            {/* Middle: items count + total */}
            <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, color: "#94A3B8", marginBottom: 2 }}>รายการสินค้า</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#1E293B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {order.items_count || 0} รายการ
                    </div>
                </div>
                <div style={{ flex: 1, textAlign: "right", minWidth: 0 }}>
                    <div style={{ fontSize: 14, color: "#94A3B8", marginBottom: 2 }}>ยอดรวม</div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: statusTheme.badgeText, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {formatMoney(Number(order.total_amount || 0))}
                    </div>
                </div>
            </div>

            {/* Bottom: time elapsed + Delivery tag */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <ClockCircleOutlined style={{ fontSize: 12, color: age.color }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: age.color }}>{age.label}</span>
                </div>
            </div>
        </div>
    );
}

/* ── Auth guard ── */

export default function DeliverySelectionPage() {
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
            <DeliveryContent canCreateOrder={canCreateOrder} />
        </RequireOpenShift>
    );
}

/* ── Main content ── */

function DeliveryContent({ canCreateOrder }: { canCreateOrder: boolean }) {
    const router = useRouter();
    const { deliveryProviders, isLoading: isLoadingProviders, isError: deliveryError, mutate: refetchProviders } = useDelivery();
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
        defaultFilters: { status: "all" as DeliveryListStatusFilter },
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [deliveryCode, setDeliveryCode] = useState("");
    const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);

    const statusFilter = useMemo(() => {
        if (filters.status === "active") return DELIVERY_ACTIVE_STATUSES.join(",");
        if (filters.status === "waiting_payment") return OrderStatus.WaitingForPayment;
        return DELIVERY_OPEN_STATUSES.join(",");
    }, [filters.status]);

    const { orders, total: apiTotal, isLoading, isFetching, error, refresh } = useChannelOrders({
        orderType: OrderType.Delivery,
        page, limit: pageSize, statusFilter,
        query: debouncedSearch, createdSort, enabled: isUrlReady,
    });

    useEffect(() => { setTotal(apiTotal); }, [apiTotal, setTotal]);

    const providerById = useMemo(
        () =>
            new Map(
                ((deliveryProviders as Delivery[]) || []).map((provider) => [provider.id, provider] as const)
            ),
        [deliveryProviders]
    );

    const selectedProvider = useMemo(
        () => (selectedProviderId ? providerById.get(selectedProviderId) ?? null : null),
        [providerById, selectedProviderId]
    );

    const providerOptions = useMemo(
        () => (deliveryProviders as Delivery[]).filter((p) => p.is_active !== false),
        [deliveryProviders]
    );

    const modalProviderOptions = useMemo(() =>
        providerOptions.map(provider => ({
            label: (
                <Flex align="center" gap={10}>
                    <SmartAvatar
                        src={provider?.logo}
                        alt={provider.delivery_name}
                        size={28}
                        shape="square"
                        icon={<RocketOutlined style={{ fontSize: 14 }} />}
                        imageStyle={{ objectFit: 'contain' }}
                        style={{
                            borderRadius: 8, flexShrink: 0,
                            background: resolveImageSource(provider?.logo) ? '#fff' : '#F5F3FF',
                            border: '1px solid #E5E7EB',
                        }}
                    />
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{provider.delivery_name}</span>
                </Flex>
            ),
            value: provider.id,
            searchLabel: provider.delivery_name
        })),
        [providerOptions]
    );

    const visibleOrders = useMemo(
        () => orders.filter((order) => DELIVERY_VISIBLE_STATUS_SET.has(order.status)),
        [orders]
    );

    const handleManualRefresh = useCallback(() => {
        void refresh(false);
    }, [refresh]);

    const handleCreateOrderClick = () => {
        if (!canCreateOrder) return;
        setDeliveryCode("");
        setSelectedProviderId(null);
        setIsCreating(false);
        setIsModalOpen(true);
    };

    const handleConfirmCreate = () => {
        if (!selectedProvider) {
            message.error("กรุณาเลือกผู้ให้บริการ");
            return;
        }
        if (!deliveryCode.trim()) {
            message.error("กรุณากรอกรหัสออเดอร์");
            return;
        }

        setIsCreating(true);

        const baseCode = deliveryCode.trim();
        const finalCode = selectedProvider.delivery_prefix
            ? `${selectedProvider.delivery_prefix}-${baseCode}`
            : baseCode;
        router.push(`/pos/channels/delivery/${selectedProvider.id}?code=${encodeURIComponent(finalCode)}`);
    };

    const gridColumns = isMobile
        ? "minmax(0, 1fr)"
        : screens.xxl
            ? "repeat(4, minmax(0, 1fr))"
            : screens.lg
                ? "repeat(3, minmax(0, 1fr))"
                : "repeat(2, minmax(0, 1fr))";

    const waitingCount = stats?.delivery_waiting_payment ?? 0;

    return (
        <React.Fragment>
            <style dangerouslySetInnerHTML={{ __html: STYLES }} />
            <div style={{ width: '100%', overflowX: 'hidden', display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
                <UIPageHeader
                    title="เดลิเวอรี่"
                    icon={<RocketOutlined style={{ fontSize: 18, color: "#7C3AED" }} />}
                    onBack={() => router.push("/pos")}
                    actions={
                        <Space size={8} wrap>
                            {waitingCount > 0 ? (
                                <Tag
                                    style={{
                                        borderRadius: 10, padding: "2px 10px", fontWeight: 600,
                                        background: "#FCE7F3", border: "1px solid #FBCFE8", color: "#BE185D",
                                    }}
                                >
                                    รอส่ง {waitingCount} รายการ
                                </Tag>
                            ) : null}
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={handleManualRefresh}
                                loading={isLoading || isFetching || isLoadingProviders}
                                style={{ borderRadius: 10 }}
                            />
                            {canCreateOrder && (
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={handleCreateOrderClick}
                                    style={{
                                        borderRadius: 12, fontWeight: 700,
                                        background: "linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)",
                                        border: "none",
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
                                        <ModalSelector<DeliveryListStatusFilter>
                                            title="เลือกสถานะออเดอร์"
                                            options={[
                                                { label: "รายการที่ยังเปิดอยู่", value: "all" },
                                                { label: "กำลังดำเนินการ", value: "active" },
                                                { label: "รอส่ง", value: "waiting_payment" },
                                            ]}
                                            value={filters.status as DeliveryListStatusFilter}
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
                                title="ออเดอร์"
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
                                        {deliveryError ? (
                                            <PageState status="error" title="โหลดผู้ให้บริการไม่สำเร็จ" error={deliveryError} onRetry={() => void refetchProviders()} />
                                        ) : error ? (
                                            <PageState status="error" title="โหลดออเดอร์เดลิเวอรี่ไม่สำเร็จ" error={error} onRetry={() => void refresh(false)} />
                                        ) : isLoading ? (
                                            <div style={{ display: "grid", gridTemplateColumns: gridColumns, gap: isMobile ? 12 : 16, width: '100%' }}>
                                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                                    <div key={i} style={{ background: "#fff", borderRadius: 18, padding: 24, border: `1px solid ${token.colorBorderSecondary}` }}>
                                                        <Skeleton active paragraph={{ rows: 3 }} />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : visibleOrders.length === 0 ? (
                                            <UIEmptyState
                                                title={debouncedSearch.trim() ? "ไม่พบออเดอร์ที่ค้นหา" : "ยังไม่มีออเดอร์เดลิเวอรี่"}
                                                description={debouncedSearch.trim() ? "ลองใช้คำค้นหาอื่น หรือเปลี่ยนตัวกรอง" : "เริ่มสร้างออเดอร์ใหม่โดยกดปุ่ม \"เพิ่มออเดอร์\" ด้านบน"}
                                            />
                                        ) : (
                                            <div style={{ display: "grid", gridTemplateColumns: gridColumns, gap: isMobile ? 12 : 16, width: '100%' }}>
                                                {visibleOrders.map((order, i) => {
                                                    const provider = order.delivery_id ? providerById.get(order.delivery_id) : null;
                                                    return (
                                                        <div key={order.id} className="delivery-card-animate" style={{ animationDelay: `${Math.min(i * 0.04, 0.4)}s`, minWidth: 0 }}>
                                                            <DeliveryOrderCard
                                                                order={order as SalesOrderSummary}
                                                                provider={provider}
                                                                onClick={() => router.push(getOrderNavigationPath(order as SalesOrderSummary))}
                                                                isMobile={isMobile}
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Pagination */}
                                        {total > 0 && (
                                            <div style={{
                                                marginTop: 8, paddingTop: 16,
                                                borderTop: `1px solid ${token.colorBorderSecondary}`,
                                                width: '100%',
                                            }}>
                                                <ListPagination
                                                    page={page} total={total} pageSize={pageSize}
                                                    loading={isLoading || isFetching}
                                                    onPageChange={setPage} onPageSizeChange={setPageSize}
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

            {/* ── Create Delivery Order Modal ── */}
            <Modal
                open={isModalOpen}
                onCancel={() => {
                    setIsModalOpen(false);
                    setIsCreating(false);
                }}
                footer={null}
                closable={true}
                centered
                width={420}
                styles={{
                    body: { borderRadius: 20, padding: '28px 24px 24px' },
                    mask: { backdropFilter: 'blur(4px)' },
                }}
            >
                {/* Custom header */}
                <Flex align="center" gap={12} style={{ marginBottom: 24 }}>
                    <div
                        style={{
                            width: 44, height: 44, borderRadius: 14,
                            background: '#F5F3FF', border: '1px solid #DDD6FE',
                            display: 'grid', placeItems: 'center', flexShrink: 0,
                        }}
                    >
                        <RocketOutlined style={{ fontSize: 20, color: '#7C3AED' }} />
                    </div>
                    <Typography.Title level={5} style={{ margin: 0 }}>
                        เปิดออเดอร์เดลิเวอรี่
                    </Typography.Title>
                </Flex>

                <Flex vertical gap={20}>
                    {/* Provider select */}
                    <div>
                        <Typography.Text strong style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>
                            เลือกผู้ให้บริการ
                        </Typography.Text>
                        <ModalSelector<string>
                            title="เลือกผู้ให้บริการ"
                            options={modalProviderOptions}
                            value={selectedProviderId || undefined}
                            onChange={(val) => setSelectedProviderId(val)}
                            placeholder="เลือกผู้ให้บริการ"
                            style={{ 
                                width: '100%', 
                                height: 44, 
                                borderRadius: 10,
                                padding: '0 12px',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        />
                    </div>

                    {/* Delivery code input */}
                    <div>
                        <Typography.Text strong style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>
                            รหัสเดลิเวอรี่
                        </Typography.Text>
                        <Input
                            size="large"
                            value={deliveryCode}
                            onChange={(e) => setDeliveryCode(e.target.value)}
                            disabled={!selectedProviderId}
                            placeholder={selectedProviderId ? "ระบุรหัสออเดอร์" : "กรุณาเลือกผู้ให้บริการก่อน"}
                            addonBefore={selectedProvider?.delivery_prefix ? `${selectedProvider.delivery_prefix}-` : undefined}
                            style={{ borderRadius: 10 }}
                            onPressEnter={() => {
                                if (selectedProvider && deliveryCode.trim()) handleConfirmCreate();
                            }}
                        />
                    </div>
                </Flex>

                {/* Footer buttons */}
                <Flex justify="center" gap={12} style={{ marginTop: 28 }}>
                    <Button
                        size="large"
                        onClick={() => setIsModalOpen(false)}
                        style={{
                            borderRadius: 12, minWidth: 110, height: 44,
                            fontWeight: 700, fontSize: 15,
                        }}
                    >
                        ยกเลิก
                    </Button>
                    <Button
                        size="large"
                        type="primary"
                        loading={isCreating}
                        disabled={!selectedProvider || !deliveryCode.trim() || isCreating}
                        onClick={handleConfirmCreate}
                        style={{
                            borderRadius: 12, minWidth: 110, height: 44,
                            fontWeight: 700, fontSize: 15,
                            background: (!selectedProvider || !deliveryCode.trim() || isCreating)
                                ? undefined
                                : 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
                            border: 'none',
                        }}
                    >
                        ยืนยัน
                    </Button>
                </Flex>
            </Modal>
        </React.Fragment>
    );
}
