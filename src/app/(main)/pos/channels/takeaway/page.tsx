"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Typography, Row, Col, Empty, Spin, Button, Tag, Space } from "antd";
import { ShoppingOutlined, ArrowLeftOutlined, PlusOutlined } from "@ant-design/icons";
import { ordersService } from "../../../../../services/pos/orders.service";
import { SalesOrder, OrderStatus, OrderType } from "../../../../../types/api/pos/salesOrder";
import { posPageStyles, channelColors, posColors, tableColors } from "@/theme/pos";
import { channelPageStyles } from "@/theme/pos/channels/style";
import { POSGlobalStyles } from "@/theme/pos/GlobalStyles";
import { getOrderChannelStats, getOrderColorScheme, formatOrderStatus } from "@/utils/channels";
import { getOrderNavigationPath } from "@/utils/orders";
import { useGlobalLoading } from "@/contexts/pos/GlobalLoadingContext";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import 'dayjs/locale/th';

const { Title, Text } = Typography;
dayjs.extend(relativeTime);
dayjs.locale('th');

export default function TakeawayPage() {
    const router = useRouter();
    const { showLoading, hideLoading } = useGlobalLoading();
    const [orders, setOrders] = useState<SalesOrder[]>([]);

    const stats = useMemo(() => getOrderChannelStats(orders), [orders]);

    const fetchOrders = useCallback(async (isInitial = false) => {
        if (isInitial) showLoading();
        try {
            const res = await ordersService.getAll(undefined, 1, 100, undefined, OrderType.TakeAway);
            
            const activeOrders = res.data.filter(o => 
                o.order_type === OrderType.TakeAway &&
                o.status !== OrderStatus.Paid && 
                o.status !== OrderStatus.Completed &&
                o.status !== OrderStatus.Cancelled
            );
            
            setOrders(activeOrders);
        } catch (error) {
            // Silent error
        } finally {
            if (isInitial) hideLoading();
        }
    }, [showLoading, hideLoading]);

    useEffect(() => {
        fetchOrders(true);
        // Set up polling interval for real-time-like updates
        const interval = setInterval(() => fetchOrders(false), 15000);
        return () => clearInterval(interval);
    }, [fetchOrders]);

    const handleCreateOrder = () => {
        router.push('/pos/channels/takeaway/buying');
    };

    const handleBack = () => {
        router.push('/pos/channels');
    };

    const handleOrderClick = (order: SalesOrder) => {
        const path = getOrderNavigationPath(order);
        router.push(path);
    };

    return (
        <>
            <POSGlobalStyles />
            <div style={posPageStyles.container}>
                {/* Header Section */}
                <div style={{ ...channelPageStyles.channelHeader, background: channelColors.takeaway.gradient }} className="takeaway-header-mobile">
                    <div className="header-pattern"></div>

                    <div style={channelPageStyles.channelHeaderContent} className="takeaway-header-content-mobile">
                        {/* Back Button */}
                        <div
                            className="back-button-hover takeaway-back-button-mobile"
                            style={channelPageStyles.channelBackButton}
                            onClick={handleBack}
                        >
                            <ArrowLeftOutlined />
                            <span>กลับ</span>
                        </div>

                        {/* Title Section */}
                        <div style={channelPageStyles.channelTitleSection} className="takeaway-title-section-mobile">
                            <ShoppingOutlined style={channelPageStyles.channelHeaderIcon} className="takeaway-header-icon-mobile" />
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
                </div>

                {/* Content Section */}
                <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 16px 24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
                        <Button 
                            type="primary" 
                            size="large"
                            icon={<PlusOutlined />}
                            onClick={handleCreateOrder}
                            style={{ 
                                height: 48, 
                                borderRadius: 12, 
                                padding: '0 24px',
                                fontWeight: 700,
                                background: channelColors.takeaway.primary,
                                border: 'none',
                                boxShadow: `0 8px 16px rgba(82, 196, 26, 0.25)`,
                            }}
                        >
                            เพิ่มออเดอร์ใหม่
                        </Button>
                    </div>
                {orders.length > 0 ? (
                    <Row gutter={[20, 20]}>
                        {orders.map((order, index) => {
                            const colorScheme = getOrderColorScheme(order);
                            const colors = tableColors[colorScheme];
                            const orderNum = order.order_no.split('-').pop();

                            return (
                                <Col xs={12} sm={8} md={6} lg={4} key={order.id}>
                                    <div
                                        className={`takeaway-order-card table-card-animate table-card-delay-${(index % 6) + 1}`}
                                        style={{
                                            ...channelPageStyles.channelPageCard,
                                            background: colors.light,
                                            border: `2px solid ${colors.border}`,
                                        }}
                                        onClick={() => handleOrderClick(order)}
                                    >
                                        <div
                                            style={{
                                                ...channelPageStyles.channelPageCardGradientOverlay,
                                                background: colors.gradient,
                                            }}
                                        />

                                        <div style={channelPageStyles.channelPageCardInner}>
                                            <ShoppingOutlined
                                                style={{
                                                    ...channelPageStyles.channelPageCardIcon,
                                                    color: colors.primary,
                                                }}
                                            />

                                            <div style={channelPageStyles.channelPageCardMainText}>
                                                {orderNum}
                                            </div>

                                            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                                                <div style={{ fontSize: 12, fontWeight: 700, color: colors.primary, textTransform: 'uppercase' }}>
                                                    {dayjs(order.create_date).fromNow()}
                                                </div>
                                                <div
                                                    style={{
                                                        ...channelPageStyles.channelPageCardStatusBadge,
                                                        background: colors.primary,
                                                        color: '#fff',
                                                    }}
                                                >
                                                    {formatOrderStatus(order.status)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Col>
                            );
                        })}
                    </Row>
                ) : (
                    <div style={{ 
                        background: '#fff', 
                        borderRadius: 24, 
                        padding: '80px 24px', 
                        textAlign: 'center',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.06)' 
                    }}>
                        <Empty 
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={
                                <div style={{ marginTop: 16 }}>
                                    <Title level={4} style={{ marginBottom: 8 }}>ไม่มีออเดอร์ในขณะนี้</Title>
                                    <Text type="secondary">เริ่มรับออเดอร์สั่งกลับบ้านโดยกดปุ่ม "เพิ่มออเดอร์"</Text>
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
                                borderColor: channelColors.takeaway.primary,
                                height: 44,
                                borderRadius: 10,
                                padding: '0 32px'
                            }}
                        >
                            สร้างออเดอร์ใหม่
                        </Button>
                    </div>
                )}
            </div>
        </div>
        </>
    );
}
