"use client";

import React, { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Typography, Row, Col, Empty, Button, Tag } from "antd";
import { ShoppingOutlined, ArrowLeftOutlined, PlusOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { OrderType, SalesOrderSummary } from "../../../../../types/api/pos/salesOrder";
import { posPageStyles, channelColors, tableColors } from "../../../../../theme/pos";
import { channelPageStyles, channelsResponsiveStyles } from "../../../../../theme/pos/channels/style";
import { POSGlobalStyles } from "../../../../../theme/pos/GlobalStyles";
import { getOrderChannelStats, getOrderColorScheme, formatOrderStatus } from "../../../../../utils/channels";
import { getOrderNavigationPath } from "../../../../../utils/orders";
import { useGlobalLoading } from "../../../../../contexts/pos/GlobalLoadingContext";
import { useChannelOrders } from "../../../../../utils/pos/channelOrders";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import 'dayjs/locale/th';

const { Title, Text } = Typography;
dayjs.extend(relativeTime);
dayjs.locale('th');

export default function TakeawayPage() {
    const router = useRouter();
    const { showLoading, hideLoading } = useGlobalLoading();
    const { orders, isLoading } = useChannelOrders({ orderType: OrderType.TakeAway });

    const stats = useMemo(() => getOrderChannelStats(orders), [orders]);

    useEffect(() => {
        if (isLoading) {
            showLoading("กำลังโหลดออเดอร์...");
        } else {
            hideLoading();
        }
    }, [isLoading, showLoading, hideLoading]);

    const handleCreateOrder = () => {
        router.push('/pos/channels/takeaway/buying');
    };

    const handleBack = () => {
        router.push('/pos/channels');
    };

    const handleOrderClick = (order: SalesOrderSummary) => {
        const path = getOrderNavigationPath(order);
        router.push(path);
    };

    const getStatusColor = (colorScheme: string) => {
        switch (colorScheme) {
            case 'available': return 'success';
            case 'occupied': return 'orange';
            case 'waitingForPayment': return 'blue';
            default: return 'default';
        }
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
                {/* Header Section */}
                <header
                    style={{ ...channelPageStyles.channelHeader, background: channelColors.takeaway.gradient }}
                    className="takeaway-header-mobile"
                    role="banner"
                >
                    <div className="header-pattern"></div>
                    <div className="header-circle circle-1"></div>
                    <div className="header-circle circle-2"></div>

                    <div style={channelPageStyles.channelHeaderContent} className="takeaway-header-content-mobile">
                        {/* Back Button */}
                        <button
                            className="back-button-hover takeaway-back-button-mobile"
                            style={channelPageStyles.channelBackButton}
                            onClick={handleBack}
                            aria-label="กลับไปหน้าเลือกช่องทาง"
                        >
                            <ArrowLeftOutlined />
                            <span>กลับ</span>
                        </button>

                        {/* Title Section */}
                        <div style={channelPageStyles.channelTitleSection} className="takeaway-title-section-mobile">
                            <ShoppingOutlined style={channelPageStyles.channelHeaderIcon} className="takeaway-header-icon-mobile" aria-hidden="true" />
                            <div>
                                <Title level={3} style={channelPageStyles.channelHeaderTitle} className="takeaway-header-title-mobile">
                                    สั่งกลับบ้าน
                                </Title>
                                <Text style={channelPageStyles.channelHeaderSubtitle}>Take Away</Text>
                            </div>
                        </div>

                        {/* Statistics Bar */}
                        <div style={channelPageStyles.channelStatsBar} className="takeaway-stats-bar-mobile">
                            <div style={channelPageStyles.statItem}>
                                <span style={{ ...channelPageStyles.statDot, background: '#fff' }} />
                                <Text style={channelPageStyles.statText}>ทั้งหมด {stats.total}</Text>
                            </div>
                            <div style={channelPageStyles.statItem}>
                                <span style={{ ...channelPageStyles.statDot, background: tableColors.occupied.primary }} />
                                <Text style={channelPageStyles.statText}>กำลังปรุง {stats.cooking}</Text>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Section */}
                <main style={{ maxWidth: 1400, margin: '0 auto', padding: '0 16px 32px' }} className="takeaway-content-mobile" role="main">
                    {/* Add Order Button */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
                        <Button
                            type="primary"
                            size="large"
                            icon={<PlusOutlined />}
                            onClick={handleCreateOrder}
                            className="add-button-hover takeaway-add-button-mobile"
                            style={{
                                ...channelPageStyles.addOrderButton,
                                background: channelColors.takeaway.primary,
                                boxShadow: `0 8px 20px ${channelColors.takeaway.primary}40`,
                            }}
                        >
                            <span className="hide-on-mobile">เพิ่มออเดอร์ใหม่</span>
                            <span className="show-on-mobile-inline">เพิ่ม</span>
                        </Button>
                    </div>

                    {orders.length > 0 ? (
                        <Row gutter={[16, 16]}>
                            {orders.map((order: SalesOrderSummary, index) => {
                                const colorScheme = getOrderColorScheme(order);
                                const colors = tableColors[colorScheme];
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
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: 12,
                                                        background: `${colors.primary}20`,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}>
                                                        <ShoppingOutlined style={{ color: colors.primary, fontSize: 20 }} />
                                                    </div>
                                                    <Text strong style={{ fontSize: 18, color: '#1E293B' }}>#{orderNum}</Text>
                                                </div>
                                                <Tag
                                                    color={getStatusColor(colorScheme)}
                                                    style={{ borderRadius: 8, margin: 0, fontWeight: 600, border: 'none', padding: '4px 12px' }}
                                                >
                                                    {formatOrderStatus(order.status)}
                                                </Tag>
                                            </div>

                                            {/* Card Content */}
                                            <div style={channelPageStyles.orderCardContent}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                                    <div>
                                                        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>รายการสินค้า</Text>
                                                        <Text strong style={{ fontSize: 16 }}>{order.items_count || 0} รายการ</Text>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>ยอดรวม</Text>
                                                        <Text strong style={{ fontSize: 20, color: colors.primary }}>฿{order.total_amount?.toLocaleString()}</Text>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Card Footer */}
                                            <div style={channelPageStyles.orderCardFooter}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <ClockCircleOutlined style={{ fontSize: 12, color: '#94A3B8' }} />
                                                    <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(order.create_date).fromNow()}</Text>
                                                </div>
                                                <Tag
                                                    style={{
                                                        margin: 0,
                                                        borderRadius: 6,
                                                        background: channelColors.takeaway.light,
                                                        color: channelColors.takeaway.primary,
                                                        border: `1px solid ${channelColors.takeaway.border}`,
                                                        fontSize: 11,
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    Take Away
                                                </Tag>
                                            </div>
                                        </article>
                                    </Col>
                                );
                            })}
                        </Row>
                    ) : (
                        <div style={channelPageStyles.emptyStateContainer}>
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description={
                                    <div style={{ marginTop: 16 }}>
                                        <Title level={4} style={{ marginBottom: 8, color: '#1E293B' }}>ไม่มีออเดอร์ในขณะนี้</Title>
                                        <Text type="secondary" style={{ fontSize: 15 }}>เริ่มรับออเดอร์สั่งกลับบ้านโดยกดปุ่ม &quot;เพิ่มออเดอร์&quot;</Text>
                                    </div>
                                }
                            />
                            <Button
                                type="primary"
                                size="large"
                                icon={<PlusOutlined />}
                                onClick={handleCreateOrder}
                                style={{
                                    marginTop: 24,
                                    background: channelColors.takeaway.primary,
                                    height: 52,
                                    borderRadius: 16,
                                    padding: '0 32px',
                                    fontWeight: 600,
                                    border: 'none',
                                    boxShadow: `0 8px 20px ${channelColors.takeaway.primary}40`,
                                }}
                            >
                                สร้างออเดอร์ใหม่
                            </Button>
                        </div>
                    )}
                </main>
            </div>
        </>
    );
}
