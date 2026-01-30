"use client";

import React, { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Typography, Row, Col, Empty, Button, Card, Tag, Divider } from "antd";
import { ShoppingOutlined, ArrowLeftOutlined, PlusOutlined } from "@ant-design/icons";
import { OrderType, SalesOrderSummary } from "../../../../../types/api/pos/salesOrder";
import { posPageStyles, channelColors, tableColors } from "@/theme/pos";
import { channelPageStyles } from "@/theme/pos/channels/style";
import { POSGlobalStyles } from "@/theme/pos/GlobalStyles";
import { getOrderChannelStats, getOrderColorScheme, formatOrderStatus } from "@/utils/channels";
import { getOrderNavigationPath } from "@/utils/orders";
import { useGlobalLoading } from "@/contexts/pos/GlobalLoadingContext";
import { useChannelOrders } from "@/utils/pos/channelOrders";
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
                        {orders.map((order: SalesOrderSummary, index) => {
                            const colorScheme = getOrderColorScheme(order);
                            const colors = tableColors[colorScheme];
                            const orderNum = order.order_no.split('-').pop();

                            return (
                                <Col xs={24} sm={12} md={12} lg={8} xl={6} key={order.id}>
                                    <Card
                                        hoverable
                                        className={`takeaway-order-card table-card-animate table-card-delay-${(index % 6) + 1}`}
                                        style={{
                                            borderRadius: 16,
                                            overflow: 'hidden',
                                            border: `1px solid ${colors.border}`,
                                            background: '#fff',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                        }}
                                        bodyStyle={{ padding: 0 }}
                                        onClick={() => handleOrderClick(order)}
                                    >
                                        {/* Card Header */}
                                        <div style={{ 
                                            padding: '12px 16px', 
                                            background: colors.light, 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'center',
                                            borderBottom: `1px solid ${colors.border}40`
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <ShoppingOutlined style={{ color: colors.primary, fontSize: 18 }} />
                                                <Text strong style={{ fontSize: 16 }}>#{orderNum}</Text>
                                            </div>
                                            <Tag 
                                                color={colorScheme === 'available' ? 'success' : colorScheme === 'occupied' ? 'orange' : colorScheme === 'waitingForPayment' ? 'blue' : 'default'} 
                                                style={{ borderRadius: 6, margin: 0, fontWeight: 600, border: 'none' }}
                                            >
                                                {formatOrderStatus(order.status)}
                                            </Tag>
                                        </div>

                                        {/* Card Content */}
                                        <div style={{ padding: 16 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                                <div>
                                                    <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>รายการสินค้า</Text>
                                                    <Text strong style={{ fontSize: 15 }}>{order.items_count || 0} รายการ</Text>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>ยอดรวม</Text>
                                                    <Text strong style={{ fontSize: 18, color: colors.primary }}>฿{order.total_amount?.toLocaleString()}</Text>
                                                </div>
                                            </div>
                                            
                                            <Divider style={{ margin: '12px 0' }} />
                                            
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <div style={{ 
                                                        width: 8, 
                                                        height: 8, 
                                                        borderRadius: '50%', 
                                                        background: colors.primary,
                                                        boxShadow: `0 0 8px ${colors.primary}60`
                                                    }} />
                                                    <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(order.create_date).fromNow()}</Text>
                                                </div>
                                                <Text type="secondary" style={{ fontSize: 12 }}>Take Away</Text>
                                            </div>
                                        </div>
                                    </Card>
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
                                    <Text type="secondary">เริ่มรับออเดอร์สั่งกลับบ้านโดยกดปุ่ม &quot;เพิ่มออเดอร์&quot;</Text>
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
