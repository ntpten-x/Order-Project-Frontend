"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Typography, Row, Col, Card, Empty, Spin, Button, Tag, Statistic } from "antd";
import { ShoppingOutlined, PlusOutlined, ClockCircleOutlined, UserOutlined, CheckCircleOutlined, SyncOutlined } from "@ant-design/icons";
import { ordersService } from "../../../../../services/pos/orders.service";
import { SalesOrder, OrderStatus, OrderType } from "../../../../../types/api/pos/salesOrder";
import { posPageStyles, channelColors, posColors } from "@/theme/pos";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import 'dayjs/locale/th';
import { useGlobalLoading } from "../../../../../contexts/pos/GlobalLoadingContext";

const { Title, Text } = Typography;
dayjs.extend(relativeTime);
dayjs.locale('th');

export default function TakeawayPage() {
    const router = useRouter();
    const { showLoading, hideLoading } = useGlobalLoading();
    const [orders, setOrders] = useState<SalesOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchOrders = useCallback(async () => {
        setIsLoading(true);
        // showLoading("กำลังโหลดออเดอร์..."); // Optional: might be too intrusive for initial load
        try {
            // Fetch active takeaway orders (Pending, Cooking, Served - assuming Served means ready but not yet paid/picked up?)
            // Usually "Active" means not Cancelled and not Paid.
            // Let's filter by status on client if API doesn't support multiple status, 
            // or if API supports 'active' keyword.
            // Based on generic implementation, let's fetch all and filter client side for now, 
            // or better, fetch specifically 'Pending' and 'Cooking' and 'Served' if backend supports it.
            // For now, let's just fetch all TakeAway and filter.
            const res = await ordersService.getAll(undefined, 1, 100, undefined, OrderType.TakeAway);
            
            // Filter out Paid and Cancelled, and ENSURE it's only TakeAway
            const activeOrders = res.data.filter(o => 
                o.order_type === OrderType.TakeAway &&
                o.status !== OrderStatus.Paid && 
                o.status !== OrderStatus.Cancelled
            );
            
            setOrders(activeOrders);
        } catch (error) {
            // Silent error or message
        } finally {
            setIsLoading(false);
            // hideLoading();
        }
    }, [showLoading, hideLoading]);

    useEffect(() => {
        fetchOrders();
        // Set up polling interval for real-time-like updates
        const interval = setInterval(fetchOrders, 15000);
        return () => clearInterval(interval);
    }, [fetchOrders]);

    const handleCreateOrder = () => {
        router.push('/pos/channels/takeaway/buying');
    };

    const handleOrderClick = (orderId: string) => {
        router.push(`/pos/orders/${orderId}`);
    };

    return (
        <div style={posPageStyles.container}>
            {/* Hero Header */}
            <div style={{ 
                ...posPageStyles.heroParams, 
                background: channelColors.takeaway.gradient,
                boxShadow: '0 8px 24px rgba(82, 196, 26, 0.25)',
                paddingBottom: 80
            }}>
                <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={posPageStyles.sectionTitle}>
                            <ShoppingOutlined style={{ fontSize: 32, color: '#fff' }} />
                            <div>
                                <Title level={2} style={{ margin: 0, color: '#fff' }}>สั่งกลับบ้าน (Take Away)</Title>
                                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16 }}>
                                    รายการออเดอร์ที่กำลังดำเนินการ
                                </Text>
                            </div>
                        </div>
                        <Button 
                            type="primary" 
                            size="large"
                            icon={<PlusOutlined />}
                            onClick={handleCreateOrder}
                            style={{ 
                                height: 48, 
                                borderRadius: 12, 
                                padding: '0 24px',
                                fontSize: 16,
                                fontWeight: 600,
                                background: '#fff',
                                color: channelColors.takeaway.primary,
                                border: 'none',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}
                        >
                            เพิ่มออเดอร์
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div style={{ maxWidth: 1200, margin: '-50px auto 0', padding: '0 24px 40px', position: 'relative', zIndex: 20 }}>
                {isLoading && orders.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "80px", background: '#fff', borderRadius: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
                        <Spin size="large" />
                        <div style={{ marginTop: 16, color: '#8c8c8c' }}>กำลังโหลดข้อมูล...</div>
                    </div>
                ) : orders.length > 0 ? (
                    <Row gutter={[24, 24]}>
                        {orders.map((order) => {
                            const itemCount = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
                            const isDraft = order.status === OrderStatus.Pending && itemCount === 0;

                            return (
                                <Col xs={24} sm={12} md={8} lg={6} key={order.id}>
                                    <div 
                                        className="hover-card"
                                        style={{ 
                                            ...posPageStyles.card, // This has background: white already
                                            border: 'none', 
                                            cursor: 'pointer',
                                            height: '100%',
                                            position: 'relative',
                                            transition: 'all 0.3s ease',
                                        }}
                                        onClick={() => handleOrderClick(order.id)}
                                    >
                                        <div style={{ padding: 20 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                                <Tag 
                                                    style={{ 
                                                        margin: 0, 
                                                        padding: '4px 10px', 
                                                        borderRadius: 6, 
                                                        background: channelColors.takeaway.light, 
                                                        color: channelColors.takeaway.primary,
                                                        border: `1px solid ${channelColors.takeaway.border}`,
                                                        fontSize: 14,
                                                        fontWeight: 600
                                                    }}
                                                >
                                                    Queue: {order.order_no}
                                                </Tag>
                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                    {dayjs(order.create_date).fromNow()}
                                                </Text>
                                            </div>

                                            <div style={{ marginBottom: 20 }}>
                                                <Title level={4} style={{ margin: 0, marginBottom: 4 }}>
                                                    {order.order_no}
                                                </Title>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <UserOutlined style={{ color: '#8c8c8c' }} />
                                                    <Text type="secondary">
                                                        {order.created_by?.display_name || 'ลูกค้าทั่วไป'}
                                                    </Text>
                                                </div>
                                            </div>

                                            <div style={{ 
                                                display: 'flex', 
                                                justifyContent: 'space-between', 
                                                alignItems: 'center',
                                                paddingTop: 16,
                                                borderTop: '1px solid #f0f0f0' 
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <ShoppingOutlined style={{ color: channelColors.takeaway.primary }} />
                                                    <Text strong>{itemCount} รายการ</Text>
                                                </div>
                                                <Text strong style={{ color: channelColors.takeaway.primary, fontSize: 16 }}>
                                                    ฿{Number(order.total_amount).toLocaleString()}
                                                </Text>
                                            </div>
                                        </div>
                                        
                                        {/* Status Strip */}
                                        <div style={{ 
                                            height: 4, 
                                            background: order.status === OrderStatus.Cooking ? '#faad14' : 
                                                       order.status === OrderStatus.Served ? '#52c41a' : '#1890ff',
                                            width: '100%'
                                        }} />
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
    );
}
