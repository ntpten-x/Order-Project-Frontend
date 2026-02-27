"use client";

import React, { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button, Col, Row, Space, Tag, Typography, message } from "antd";
import { ShoppingOutlined, PlusOutlined, ClockCircleOutlined, ReloadOutlined } from "@ant-design/icons";
import PageContainer from "../../../../../components/ui/page/PageContainer";
import PageSection from "../../../../../components/ui/page/PageSection";
import UIPageHeader from "../../../../../components/ui/page/PageHeader";
import UIEmptyState from "../../../../../components/ui/states/EmptyState";
import { OrderStatus, OrderType, SalesOrderSummary } from "../../../../../types/api/pos/salesOrder";
import { posPageStyles, channelColors, tableColors } from "../../../../../theme/pos";
import { channelPageStyles, channelsResponsiveStyles } from "../../../../../theme/pos/channels/style";
import { POSGlobalStyles } from "../../../../../theme/pos/GlobalStyles";
import { getOrderColorScheme, formatOrderStatus } from "../../../../../utils/channels";
import { getOrderNavigationPath } from "../../../../../utils/orders";
import { useGlobalLoading } from "../../../../../contexts/pos/GlobalLoadingContext";
import { useChannelOrders } from "../../../../../utils/pos/channelOrders";
import RequireOpenShift from "../../../../../components/pos/shared/RequireOpenShift";
import { useAuth } from "../../../../../contexts/AuthContext";
import { useEffectivePermissions } from "../../../../../hooks/useEffectivePermissions";
import { useChannelStats } from "../../../../../utils/channels/channelStats.utils";
import { useListState } from "../../../../../hooks/pos/useListState";
import { SearchBar } from "../../../../../components/ui/page/SearchBar";
import { SearchInput } from "../../../../../components/ui/input/SearchInput";
import { ModalSelector } from "../../../../../components/ui/select/ModalSelector";
import ListPagination from "../../../../../components/ui/pagination/ListPagination";
import PageStack from "../../../../../components/ui/page/PageStack";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import 'dayjs/locale/th';

const { Text } = Typography;
dayjs.extend(relativeTime);
dayjs.locale('th');

const pendingOrderColors = {
    primary: "#EAB308",
    light: "#FEFCE8",
    border: "#FDE68A",
    text: "#854D0E",
};

export default function TakeawayPage() {
    return (
        <RequireOpenShift>
            <TakeawayPageContent />
        </RequireOpenShift>
    );
}

function TakeawayPageContent() {
    const router = useRouter();
    const { showLoading, hideLoading } = useGlobalLoading();
    
    const {
        page, setPage,
        pageSize, setPageSize,
        total, setTotal,
        searchText, setSearchText,
        debouncedSearch,
        createdSort, setCreatedSort,
        filters, updateFilter,
        isUrlReady
    } = useListState({
        defaultPageSize: 10,
        defaultFilters: {
            status: 'active' as 'active' | 'waiting_payment' | 'all'
        }
    });

    const statusFilter = useMemo(() => {
        if (filters.status === 'active') {
            return [OrderStatus.Pending, OrderStatus.Cooking, OrderStatus.Served].join(",");
        }
        if (filters.status === 'waiting_payment') {
            return OrderStatus.WaitingForPayment;
        }
        return ""; // all
    }, [filters.status]);

    const { orders, total: apiTotal, isLoading, refresh: refreshOrders } = useChannelOrders({ 
        orderType: OrderType.TakeAway,
        page,
        limit: pageSize,
        statusFilter,
        query: debouncedSearch,
        createdSort,
        enabled: isUrlReady
    });

    useEffect(() => {
        setTotal(apiTotal);
    }, [apiTotal, setTotal]);

    const loadingKey = "pos:channels:takeaway";
    const [isRefreshing, setIsRefreshing] = React.useState(false);
    const { user } = useAuth();
    const { can } = useEffectivePermissions({ enabled: Boolean(user?.id) });
    const canCreateOrder = can("orders.page", "create");

    const { stats: globalStats } = useChannelStats();

    const displayStats = useMemo(() => ({
        inProgress: (globalStats?.takeaway ?? 0) - (globalStats?.takeaway_waiting_payment ?? 0),
        waitingForPayment: globalStats?.takeaway_waiting_payment ?? 0,
        total: globalStats?.takeaway ?? 0
    }), [globalStats]);

    useEffect(() => {
        if (isLoading) {
            showLoading("กำลังโหลดออเดอร์...", loadingKey);
        } else {
            hideLoading(loadingKey);
        }
        return () => hideLoading(loadingKey);
    }, [isLoading, showLoading, hideLoading, loadingKey]);

    const handleCreateOrder = () => {
        if (!canCreateOrder) {
            message.warning("คุณไม่มีสิทธิ์สร้างออเดอร์");
            return;
        }
        router.push('/pos/channels/takeaway/buying');
    };

    const handleBack = () => {
        router.push('/pos/channels');
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refreshOrders(false);
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleOrderClick = (order: SalesOrderSummary) => {
        const path = getOrderNavigationPath(order);
        router.push(path);
    };

    const getStatusColor = (order: SalesOrderSummary, colorScheme: string) => {
        if (order.status === OrderStatus.Pending) return "gold";
        if (order.status === OrderStatus.WaitingForPayment) return "blue";

        switch (colorScheme) {
            case "available": return "success";
            case "occupied": return "orange";
            case "waitingForPayment": return "blue";
            default: return "default";
        }
    };

    const getCardColors = (order: SalesOrderSummary, colorScheme: string) => {
        if (order.status === OrderStatus.Pending) {
            return pendingOrderColors;
        }
        if (order.status === OrderStatus.WaitingForPayment) {
            return tableColors.waitingForPayment;
        }
        return tableColors[colorScheme as keyof typeof tableColors] || tableColors.inactive;
    };

    return (
        <>
            <POSGlobalStyles />
            <style jsx global>{channelsResponsiveStyles}</style>
            <style jsx global>{`
                /* Order Card Hover Effects */
                .order-card-hover {
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                }
                .order-card-hover:hover {
                    transform: translateY(-4px) !important;
                    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.1) !important;
                }
                .order-card-hover:active {
                    transform: translateY(-2px) scale(0.99) !important;
                }
                @media (hover: none) {
                    .order-card-hover:active {
                        transform: scale(0.98) !important;
                    }
                    .order-card-hover:hover {
                        transform: none !important;
                    }
                }
                /* Back button hover */
                .back-button-hover:hover {
                    background: rgba(255, 255, 255, 0.28) !important;
                    transform: translateX(-2px);
                }
                /* Add button hover */
                .add-button-hover:hover {
                    transform: translateY(-2px) !important;
                    box-shadow: 0 12px 24px rgba(82, 196, 26, 0.35) !important;
                }
                .add-button-hover:active {
                    transform: scale(0.98) !important;
                }
                /* Mobile-only styles */
                .hide-on-mobile { display: inline !important; }
                .show-on-mobile-inline { display: none !important; }
                @media (max-width: 768px) {
                    .hide-on-mobile { display: none !important; }
                    .show-on-mobile-inline { display: inline !important; }
                }
            `}</style>
            
            <div style={posPageStyles.container}>
                <UIPageHeader
                    title="สั่งกลับบ้าน"
                    onBack={handleBack}
                    icon={<ShoppingOutlined style={{ fontSize: 20 }} />}
                    actions={
                        <div style={{ 
                            display: 'flex', 
                            flexWrap: 'wrap', 
                            justifyContent: 'center', 
                            alignItems: 'center', 
                            width: '100%', 
                            gap: '12px 16px',
                            margin: '8px 0'
                        }}>

                            {/* Stats Group - Already centered by parent flex, but explicitly set for clarity */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                                <Tag color="blue" style={{ fontSize: 13, padding: '4px 10px', fontWeight: 600, borderRadius: 6, margin: 0 }}>รอชำระเงิน {displayStats.waitingForPayment} รายการ</Tag>
                            </div>

                            {/* Actions Group */}
                            <Space size={10} wrap style={{ justifyContent: 'center' }}>
                                <Button
                                    size="middle"
                                    icon={<ReloadOutlined spin={isRefreshing} />}
                                    onClick={handleRefresh}
                                    loading={isRefreshing}
                                    style={{ borderRadius: 8 }}
                                />
                                <Button 
                                    type="primary" 
                                    size="middle"
                                    icon={<PlusOutlined />} 
                                    onClick={handleCreateOrder} 
                                    disabled={!canCreateOrder}
                                    className="add-button-hover"
                                    style={{ borderRadius: 8, fontWeight: 600 }}
                                >
                                    เพิ่มออเดอร์
                                </Button>
                            </Space>
                        </div>
                    }
                />

                <PageContainer>
                    <PageStack>
                        <SearchBar>
                            <SearchInput
                                placeholder="ค้นหา"
                                value={searchText}
                                onChange={setSearchText}
                            />
                            <Space wrap size={10}>
                                <ModalSelector
                                    title="เลือกสถานะ"
                                    options={[
                                        { label: "กำลังดำเนินการ", value: "active" },
                                        { label: "รอส่ง", value: "waiting_payment" },
                                        { label: "ทั้งหมด", value: "all" },
                                    ]}
                                    value={filters.status}
                                    onChange={(val) => updateFilter('status', val)}
                                    style={{ minWidth: 150 }}
                                />
                                <ModalSelector
                                    title="การเรียงลำดับ"
                                    options={[
                                        { label: "สั่งก่อน", value: "old" },
                                        { label: "สั่งล่าสุด", value: "new" },
                                    ]}
                                    value={createdSort}
                                    onChange={setCreatedSort}
                                    style={{ minWidth: 150 }}
                                />
                            </Space>
                        </SearchBar>

                        <PageSection 
                            title="ออเดอร์" 
                            extra={<span style={{ fontWeight: 600 }}>{total} รายการ</span>}
                        >
                        {orders.length > 0 ? (
                            <Space direction="vertical" size={24} style={{ width: '100%' }}>
                                <Row gutter={[16, 16]}>
                                    {orders.map((order: SalesOrderSummary, index) => {
                                        const colorScheme = getOrderColorScheme(order);
                                        const colors = getCardColors(order, colorScheme);
                                        const orderNum = order.order_no.split('-').pop();

                                        return (
                                            <Col xs={24} sm={12} md={8} lg={6} xl={6} key={order.id} className="takeaway-order-col-mobile">
                                                <article
                                                    className={`order-card-hover takeaway-order-card table-card-animate table-card-delay-${(index % 6) + 1}`}
                                                    style={{
                                                        ...channelPageStyles.orderCard,
                                                        border: `1.5px solid ${colors.border}`,
                                                    }}
                                                    onClick={() => handleOrderClick(order)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.preventDefault();
                                                            handleOrderClick(order);
                                                        }
                                                    }}
                                                    role="button"
                                                    tabIndex={0}
                                                    aria-label={`ออเดอร์ #${orderNum} - ${formatOrderStatus(order.status)}`}
                                                >
                                                    {/* Card Header */}
                                                    <div style={{
                                                        ...channelPageStyles.orderCardHeader,
                                                        background: colors.light,
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                            <div style={{
                                                                width: 36,
                                                                height: 36,
                                                                borderRadius: 10,
                                                                background: `${colors.primary}20`,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                            }}>
                                                                <ShoppingOutlined style={{ color: colors.primary, fontSize: 18 }} />
                                                            </div>
                                                            <Text strong style={{ fontSize: 17, color: '#1E293B' }}>#{orderNum}</Text>
                                                        </div>
                                                        <Tag
                                                            color={getStatusColor(order, colorScheme)}
                                                            style={{ 
                                                                borderRadius: 8, 
                                                                margin: 0, 
                                                                fontWeight: 700, 
                                                                border: 'none', 
                                                                padding: '4px 12px', 
                                                                fontSize: 13,
                                                                whiteSpace: 'nowrap'
                                                            }}
                                                        >
                                                            {formatOrderStatus(order.status)}
                                                        </Tag>
                                                    </div>

                                                    {/* Card Content */}
                                                    <div style={channelPageStyles.orderCardContent}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                                                            <div>
                                                                <Text type="secondary" style={{ fontSize: 16, display: 'block', marginBottom: 4 }}>รายการสินค้า</Text>
                                                                <Text strong style={{ fontSize: 16 }}>{order.items_count || 0} รายการ</Text>
                                                            </div>
                                                            <div style={{ textAlign: 'right', marginLeft: 'auto' }}>
                                                                <Text type="secondary" style={{ fontSize: 16, display: 'block', marginBottom: 4 }}>ยอดรวม</Text>
                                                                <Text strong style={{ fontSize: 20, color: colors.primary }}>฿{order.total_amount?.toLocaleString()}</Text>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Card Footer */}
                                                    <div style={channelPageStyles.orderCardFooter}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            {(() => {
                                                                const createdDate = dayjs(order.create_date);
                                                                const diffMinutes = dayjs().diff(createdDate, 'minute');
                                                                
                                                                let durationColor = '#94A3B8'; // Default grey
                                                                if (diffMinutes <= 7) durationColor = '#22C55E';      // Green
                                                                else if (diffMinutes <= 14) durationColor = '#F59E0B'; // Orange
                                                                else durationColor = '#EF4444';                       // Red

                                                                return (
                                                                    <>
                                                                        <ClockCircleOutlined style={{ fontSize: 14, color: durationColor }} />
                                                                        <Text style={{ fontSize: 14, color: durationColor, fontWeight: 500 }}>
                                                                            {createdDate.fromNow()}
                                                                        </Text>
                                                                    </>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>
                                                </article>
                                            </Col>
                                        );
                                    })}
                                </Row>

                                <div style={{ marginTop: 12 }}>
                                    <ListPagination
                                        page={page}
                                        total={total}
                                        pageSize={pageSize}
                                        onPageChange={setPage}
                                        onPageSizeChange={setPageSize}
                                        activeColor={channelColors.takeaway.primary}
                                    />
                                </div>
                            </Space>
                        ) : (
                            <UIEmptyState
                                title={debouncedSearch.trim() ? "ไม่พบออเดอร์ตามคำค้น" : "ไม่มีออเดอร์ในขณะนี้"}
                                description={debouncedSearch.trim() ? "ลองเปลี่ยนคำค้น หรือตัวกรองสถานะ" : "เริ่มรับออเดอร์สั่งกลับบ้านโดยกดปุ่ม “เพิ่มออเดอร์”"}
                            />
                        )}
                        </PageSection>
                    </PageStack>
                </PageContainer>
            </div>
        </>
    );
}
