"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
    PlusOutlined,
    ReloadOutlined,
    RocketOutlined,
    SearchOutlined,
} from "@ant-design/icons";
import { Button, Col, Input, Modal, Row, Space, Tag, Typography, message } from "antd";
import { useRouter } from "next/navigation";

import { ChannelHero, ChannelOrderCard, SummaryPanel, type ChannelAccent } from "../../../../../components/pos/channels/ChannelPrimitives";
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
import { OrderStatus, OrderType } from "../../../../../types/api/pos/salesOrder";
import { Delivery } from "../../../../../types/api/pos/delivery";
import { useChannelOrders } from "../../../../../utils/pos/channelOrders";
import { useListState } from "../../../../../hooks/pos/useListState";
import { useEffectivePermissions } from "../../../../../hooks/useEffectivePermissions";
import { useDelivery } from "../../../../../hooks/pos/useDelivery";
import { getOrderNavigationPath } from "../../../../../utils/orders";
import { resolveImageSource } from "../../../../../utils/image/source";

const { Text } = Typography;

const deliveryAccent: ChannelAccent = {
    primary: "#7C3AED",
    soft: "#F5F3FF",
    border: "#DDD6FE",
    gradient: "linear-gradient(135deg, rgba(124,58,237,0.16) 0%, rgba(255,255,255,0.95) 72%)",
};

const waitingAccent: ChannelAccent = {
    primary: "#DB2777",
    soft: "#FDF2F8",
    border: "#FBCFE8",
    gradient: deliveryAccent.gradient,
};

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
            <DeliverySelectionPageContent canCreateOrder={canCreateOrder} />
        </RequireOpenShift>
    );
}

function DeliverySelectionPageContent({ canCreateOrder }: { canCreateOrder: boolean }) {
    const router = useRouter();
    const { deliveryProviders, isLoading: isLoadingProviders, isError: deliveryError, mutate: refetchProviders } = useDelivery();
    const { stats } = useChannelStats();
    const {
        page, setPage,
        pageSize, setPageSize,
        total, setTotal,
        searchText, setSearchText,
        debouncedSearch,
        createdSort, setCreatedSort,
        filters, updateFilter,
        isUrlReady,
    } = useListState({
        defaultPageSize: 10,
        defaultFilters: {
            status: "all" as "active" | "waiting_payment" | "all",
        },
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deliveryCode, setDeliveryCode] = useState("");
    const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);

    const statusFilter = useMemo(() => {
        if (filters.status === "active") {
            return [OrderStatus.Pending, OrderStatus.Cooking, OrderStatus.Served].join(",");
        }
        if (filters.status === "waiting_payment") {
            return OrderStatus.WaitingForPayment;
        }
        return "";
    }, [filters.status]);

    const {
        orders,
        total: apiTotal,
        isLoading,
        isFetching,
        error,
        refresh,
    } = useChannelOrders({
        orderType: OrderType.Delivery,
        page,
        limit: pageSize,
        statusFilter,
        query: debouncedSearch,
        createdSort,
        enabled: isUrlReady,
    });

    useEffect(() => {
        setTotal(apiTotal);
    }, [apiTotal, setTotal]);

    const selectedProvider = useMemo(
        () => (deliveryProviders as Delivery[]).find((provider) => provider.id === selectedProviderId) ?? null,
        [deliveryProviders, selectedProviderId]
    );

    const providerOptions = useMemo(
        () => (deliveryProviders as Delivery[]).filter((provider) => provider.is_active !== false),
        [deliveryProviders]
    );

    const handleCreateOrderClick = () => {
        if (!canCreateOrder) {
            message.warning("คุณไม่มีสิทธิ์สร้างออเดอร์");
            return;
        }
        setDeliveryCode("");
        setSelectedProviderId(null);
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

        const baseCode = deliveryCode.trim();
        const finalCode = selectedProvider.delivery_prefix
            ? `${selectedProvider.delivery_prefix}-${baseCode}`
            : baseCode;

        router.push(`/pos/channels/delivery/${selectedProvider.id}?code=${encodeURIComponent(finalCode)}`);
    };

    return (
        <PageContainer>
            <PageStack gap={20}>
                <ChannelHero
                    eyebrow="Delivery"
                    title="ออเดอร์เดลิเวอรี่"
                    subtitle="จัดการคิวจัดส่งและออเดอร์จากผู้ให้บริการต่าง ๆ โดยไม่ต้องสลับหน้าหลายจุด"
                    icon={<RocketOutlined style={{ fontSize: 22 }} />}
                    accent={deliveryAccent}
                    metrics={[
                        { label: "ออเดอร์ทั้งหมด", value: stats?.delivery ?? 0 },
                        { label: "รอส่ง", value: stats?.delivery_waiting_payment ?? 0 },
                        { label: "ผู้ให้บริการ", value: providerOptions.length },
                    ]}
                    actions={
                        <Space wrap>
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={() => {
                                    void Promise.all([refresh(false), Promise.resolve(refetchProviders())]);
                                }}
                                loading={isFetching || isLoadingProviders}
                            >
                                รีเฟรช
                            </Button>
                            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateOrderClick} disabled={!canCreateOrder}>
                                เพิ่มออเดอร์
                            </Button>
                        </Space>
                    }
                />

                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={17}>
                        <PageSection title="รายการออเดอร์" extra={<Text strong>{total} รายการ</Text>}>
                            <PageStack gap={16}>
                                <Space wrap size={10}>
                                    <Input
                                        allowClear
                                        prefix={<SearchOutlined />}
                                        placeholder="ค้นหาเลขออเดอร์หรือรหัสเดลิเวอรี่"
                                        value={searchText}
                                        onChange={(event) => setSearchText(event.target.value)}
                                        style={{ minWidth: 260 }}
                                    />
                                    {[
                                        { key: "all", label: "ทั้งหมด" },
                                        { key: "active", label: "กำลังดำเนินการ" },
                                        { key: "waiting_payment", label: "รอส่ง" },
                                    ].map((item) => (
                                        <Button
                                            key={item.key}
                                            type={filters.status === item.key ? "primary" : "default"}
                                            onClick={() => updateFilter("status", item.key as "active" | "waiting_payment" | "all")}
                                        >
                                            {item.label}
                                        </Button>
                                    ))}
                                    <Button onClick={() => setCreatedSort(createdSort === "old" ? "new" : "old")}>
                                        {createdSort === "old" ? "เรียงเก่าสุดก่อน" : "เรียงล่าสุดก่อน"}
                                    </Button>
                                </Space>

                                {error ? (
                                    <PageState status="error" title="โหลดออเดอร์เดลิเวอรี่ไม่สำเร็จ" error={error} onRetry={() => void refresh(false)} />
                                ) : isLoading ? (
                                    <PageState status="loading" title="กำลังโหลดออเดอร์เดลิเวอรี่" />
                                ) : orders.length === 0 ? (
                                    <UIEmptyState
                                        title={debouncedSearch.trim() ? "ไม่พบออเดอร์ตามคำค้น" : "ยังไม่มีออเดอร์เดลิเวอรี่"}
                                        description={debouncedSearch.trim() ? "ลองเปลี่ยนคำค้นหาหรือตัวกรอง" : "เริ่มออเดอร์ใหม่ได้จากปุ่ม “เพิ่มออเดอร์”"}
                                    />
                                ) : (
                                    <>
                                        <Row gutter={[16, 16]}>
                                            {orders.map((order) => {
                                                const provider = (deliveryProviders as Delivery[]).find((item) => item.id === order.delivery_id);
                                                const accent = order.status === OrderStatus.WaitingForPayment ? waitingAccent : deliveryAccent;

                                                return (
                                                    <Col xs={24} md={12} xl={8} key={order.id}>
                                                        <ChannelOrderCard
                                                            title={order.delivery_code || order.order_no}
                                                            subtitle={provider?.delivery_name || order.delivery?.delivery_name || "Delivery"}
                                                            itemsCount={order.items_count || 0}
                                                            amount={Number(order.total_amount || 0)}
                                                            status={formatDeliveryStatus(order.status)}
                                                            accent={accent}
                                                            icon={
                                                                <SmartAvatar
                                                                    src={provider?.logo}
                                                                    alt={provider?.delivery_name || "Delivery"}
                                                                    size={24}
                                                                    shape="square"
                                                                    icon={<RocketOutlined />}
                                                                    imageStyle={{ objectFit: "contain" }}
                                                                    style={{
                                                                        borderRadius: 8,
                                                                        background: resolveImageSource(provider?.logo) ? "#ffffff" : accent.soft,
                                                                        border: `1px solid ${accent.border}`,
                                                                    }}
                                                                />
                                                            }
                                                            createdAt={order.create_date}
                                                            onClick={() => router.push(getOrderNavigationPath(order))}
                                                            footerTag={
                                                                <Tag
                                                                    style={{
                                                                        margin: 0,
                                                                        borderRadius: 999,
                                                                        paddingInline: 10,
                                                                        background: accent.soft,
                                                                        borderColor: accent.border,
                                                                        color: accent.primary,
                                                                    }}
                                                                >
                                                                    {provider?.delivery_name || "Delivery"}
                                                                </Tag>
                                                            }
                                                        />
                                                    </Col>
                                                );
                                            })}
                                        </Row>
                                        <ListPagination
                                            page={page}
                                            total={total}
                                            pageSize={pageSize}
                                            onPageChange={setPage}
                                            onPageSizeChange={setPageSize}
                                            activeColor={deliveryAccent.primary}
                                        />
                                    </>
                                )}
                            </PageStack>
                        </PageSection>
                    </Col>

                    <Col xs={24} lg={7}>
                        <PageSection title="สรุปเดลิเวอรี่">
                            <PageStack gap={12}>
                                <SummaryPanel title="ออเดอร์ทั้งหมด" value={stats?.delivery ?? 0} hint="คิวเดลิเวอรี่ที่ยัง active" accent={deliveryAccent} />
                                <SummaryPanel title="รอส่ง" value={stats?.delivery_waiting_payment ?? 0} hint="รายการที่พร้อมดำเนินการต่อ" accent={waitingAccent} />
                                <SummaryPanel
                                    title="ผู้ให้บริการใช้งานได้"
                                    value={providerOptions.length}
                                    hint={deliveryError ? "โหลดรายชื่อผู้ให้บริการไม่สำเร็จ" : "ใช้เลือกตอนสร้างออเดอร์ใหม่"}
                                    accent={deliveryAccent}
                                />
                                {deliveryError ? (
                                    <PageState
                                        status="error"
                                        title="โหลดผู้ให้บริการไม่สำเร็จ"
                                        error={deliveryError}
                                        onRetry={() => void refetchProviders()}
                                    />
                                ) : null}
                            </PageStack>
                        </PageSection>
                    </Col>
                </Row>
            </PageStack>

            <Modal
                title="สร้างออเดอร์เดลิเวอรี่"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={handleConfirmCreate}
                okText="เริ่มออเดอร์"
                cancelText="ยกเลิก"
                okButtonProps={{
                    disabled: !selectedProvider || !deliveryCode.trim(),
                }}
            >
                <PageStack gap={14}>
                    <div>
                        <Text strong style={{ display: "block", marginBottom: 8 }}>
                            เลือกผู้ให้บริการ
                        </Text>
                        <Space wrap>
                            {providerOptions.map((provider) => (
                                <Button
                                    key={provider.id}
                                    type={selectedProviderId === provider.id ? "primary" : "default"}
                                    onClick={() => setSelectedProviderId(provider.id)}
                                >
                                    {provider.delivery_name}
                                </Button>
                            ))}
                        </Space>
                    </div>
                    <div>
                        <Text strong style={{ display: "block", marginBottom: 8 }}>
                            รหัสออเดอร์
                        </Text>
                        <Input
                            value={deliveryCode}
                            onChange={(event) => setDeliveryCode(event.target.value)}
                            placeholder="เช่น 100245 หรือ A100245"
                            addonBefore={selectedProvider?.delivery_prefix || undefined}
                        />
                    </div>
                </PageStack>
            </Modal>
        </PageContainer>
    );
}

function formatDeliveryStatus(status: OrderStatus): string {
    if (status === OrderStatus.WaitingForPayment) return "รอส่ง";
    if (status === OrderStatus.Pending || status === OrderStatus.Cooking || status === OrderStatus.Served) {
        return "กำลังดำเนินการ";
    }
    return status;
}
