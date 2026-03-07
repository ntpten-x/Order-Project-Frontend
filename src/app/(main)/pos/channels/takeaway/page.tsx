"use client";

import React, { useEffect, useMemo } from "react";
import {
    PlusOutlined,
    ReloadOutlined,
    SearchOutlined,
    ShoppingOutlined,
} from "@ant-design/icons";
import { Button, Col, Input, Row, Space, Tag, Typography } from "antd";
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
import { useAuth } from "../../../../../contexts/AuthContext";
import { useChannelStats } from "../../../../../utils/channels/channelStats.utils";
import { OrderStatus, OrderType, SalesOrderSummary } from "../../../../../types/api/pos/salesOrder";
import { useChannelOrders } from "../../../../../utils/pos/channelOrders";
import { useListState } from "../../../../../hooks/pos/useListState";
import { useEffectivePermissions } from "../../../../../hooks/useEffectivePermissions";
import { getOrderNavigationPath } from "../../../../../utils/orders";

const { Text } = Typography;

const takeawayAccent: ChannelAccent = {
    primary: "#EA580C",
    soft: "#FFF7ED",
    border: "#FED7AA",
    gradient: "linear-gradient(135deg, rgba(234,88,12,0.16) 0%, rgba(255,255,255,0.95) 72%)",
};

const warningAccent: ChannelAccent = {
    primary: "#2563EB",
    soft: "#EFF6FF",
    border: "#BFDBFE",
    gradient: takeawayAccent.gradient,
};

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
            <TakeawayPageContent canCreateOrder={canCreateOrder} />
        </RequireOpenShift>
    );
}

function TakeawayPageContent({ canCreateOrder }: { canCreateOrder: boolean }) {
    const router = useRouter();
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
        orderType: OrderType.TakeAway,
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

    return (
        <PageContainer>
            <PageStack gap={20}>
                <ChannelHero
                    eyebrow="Take Away"
                    title="ออเดอร์กลับบ้าน"
                    subtitle="คุมคิวออเดอร์กลับบ้านให้เห็นชัด ทั้งรายการที่กำลังทำและรายการที่รอชำระเงิน"
                    icon={<ShoppingOutlined style={{ fontSize: 22 }} />}
                    accent={takeawayAccent}
                    metrics={[
                        { label: "ออเดอร์ทั้งหมด", value: stats?.takeaway ?? 0 },
                        { label: "รอชำระเงิน", value: stats?.takeaway_waiting_payment ?? 0 },
                        { label: "กำลังดำเนินการ", value: Math.max(0, (stats?.takeaway ?? 0) - (stats?.takeaway_waiting_payment ?? 0)) },
                    ]}
                    actions={
                        <Space wrap>
                            <Button icon={<ReloadOutlined />} onClick={() => void refresh(false)} loading={isFetching}>
                                รีเฟรช
                            </Button>
                            <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push("/pos/channels/takeaway/buying")} disabled={!canCreateOrder}>
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
                                        placeholder="ค้นหาเลขออเดอร์"
                                        value={searchText}
                                        onChange={(event) => setSearchText(event.target.value)}
                                        style={{ minWidth: 240 }}
                                    />
                                    {[
                                        { key: "all", label: "ทั้งหมด" },
                                        { key: "active", label: "กำลังดำเนินการ" },
                                        { key: "waiting_payment", label: "รอชำระเงิน" },
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
                                    <PageState status="error" title="โหลดออเดอร์ไม่สำเร็จ" error={error} onRetry={() => void refresh(false)} />
                                ) : isLoading ? (
                                    <PageState status="loading" title="กำลังโหลดออเดอร์" />
                                ) : orders.length === 0 ? (
                                    <UIEmptyState
                                        title={debouncedSearch.trim() ? "ไม่พบออเดอร์ตามคำค้น" : "ยังไม่มีออเดอร์กลับบ้าน"}
                                        description={debouncedSearch.trim() ? "ลองเปลี่ยนคำค้นหาหรือตัวกรอง" : "เริ่มออเดอร์ใหม่ได้จากปุ่ม “เพิ่มออเดอร์”"}
                                    />
                                ) : (
                                    <>
                                        <Row gutter={[16, 16]}>
                                            {orders.map((order) => (
                                                <Col xs={24} md={12} xl={8} key={order.id}>
                                                    <ChannelOrderCard
                                                        title={`#${getTakeawayTitle(order)}`}
                                                        subtitle={order.status === OrderStatus.WaitingForPayment ? "พร้อมรับชำระเงิน" : "กำลังจัดเตรียมสินค้า"}
                                                        itemsCount={order.items_count || 0}
                                                        amount={Number(order.total_amount || 0)}
                                                        status={formatTakeawayStatus(order.status)}
                                                        accent={order.status === OrderStatus.WaitingForPayment ? warningAccent : takeawayAccent}
                                                        icon={<ShoppingOutlined style={{ fontSize: 18 }} />}
                                                        createdAt={order.create_date}
                                                        onClick={() => router.push(getOrderNavigationPath(order))}
                                                        footerTag={
                                                            <Tag style={{ margin: 0, borderRadius: 999, paddingInline: 10 }}>
                                                                Take Away
                                                            </Tag>
                                                        }
                                                    />
                                                </Col>
                                            ))}
                                        </Row>
                                        <ListPagination
                                            page={page}
                                            total={total}
                                            pageSize={pageSize}
                                            onPageChange={setPage}
                                            onPageSizeChange={setPageSize}
                                            activeColor={takeawayAccent.primary}
                                        />
                                    </>
                                )}
                            </PageStack>
                        </PageSection>
                    </Col>

                    <Col xs={24} lg={7}>
                        <PageSection title="สรุปสถานะ">
                            <PageStack gap={12}>
                                <SummaryPanel title="ทั้งหมด" value={stats?.takeaway ?? 0} hint="รวมออเดอร์กลับบ้านที่ยัง active" accent={takeawayAccent} />
                                <SummaryPanel title="รอชำระเงิน" value={stats?.takeaway_waiting_payment ?? 0} hint="รายการที่พร้อมรับเงิน" accent={warningAccent} />
                                <SummaryPanel
                                    title="พร้อมรับออเดอร์ใหม่"
                                    value={canCreateOrder ? "ใช่" : "ไม่"}
                                    hint={canCreateOrder ? "คุณมีสิทธิ์สร้างออเดอร์ใหม่" : "ต้องมีสิทธิ์ orders.page:create"}
                                    accent={takeawayAccent}
                                />
                            </PageStack>
                        </PageSection>
                    </Col>
                </Row>
            </PageStack>
        </PageContainer>
    );
}

function formatTakeawayStatus(status: OrderStatus): string {
    if (status === OrderStatus.WaitingForPayment) return "รอชำระเงิน";
    if (status === OrderStatus.Pending || status === OrderStatus.Cooking || status === OrderStatus.Served) {
        return "กำลังดำเนินการ";
    }
    return status;
}

function getTakeawayTitle(order: SalesOrderSummary): string {
    const suffix = order.order_no.split("-").pop();
    return suffix || order.order_no;
}
