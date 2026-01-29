"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Typography, Row, Col, Card, Empty, Spin, Button, Tag, Statistic, Space } from "antd";
import { ShoppingOutlined, PlusOutlined, ClockCircleOutlined, UserOutlined, CheckCircleOutlined, SyncOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { ordersService } from "../../../../../services/pos/orders.service";
import { SalesOrder, OrderStatus, OrderType } from "../../../../../types/api/pos/salesOrder";
import { getOrderStatusColor, getOrderStatusText } from "../../../../../utils/orders";
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

    const handleBack = () => {
        router.push('/pos/channels');
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
                boxShadow: '0 8px 32px rgba(82, 196, 26, 0.3)',
                paddingBottom: 100,
                borderRadius: '0 0 40px 40px'
            }}>
                <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                            <Button 
                                type="text"
                                icon={<ArrowLeftOutlined style={{ fontSize: 24, color: '#fff' }} />}
                                onClick={handleBack}
                                style={{ 
                                    width: 48, 
                                    height: 48, 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    background: 'rgba(255,255,255,0.2)',
                                    borderRadius: '50%',
                                    border: 'none'
                                }}
                            />
                            <div style={posPageStyles.sectionTitle}>
                                <ShoppingOutlined style={{ fontSize: 36, color: '#fff' }} />
                                <div>
                                    <Title level={2} style={{ margin: 0, color: '#fff', fontWeight: 800 }}>สั่งกลับบ้าน (Take Away)</Title>
                                    <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16 }}>
                                        รายการออเดอร์ที่กำลังดำเนินการ ({orders.length})
                                    </Text>
                                </div>
                            </div>
                        </div>

                        <Button 
                            type="primary" 
                            size="large"
                            icon={<PlusOutlined />}
                            onClick={handleCreateOrder}
                            style={{ 
                                height: 56, 
                                borderRadius: 16, 
                                padding: '0 32px',
                                fontSize: 18,
                                fontWeight: 700,
                                background: '#fff',
                                color: channelColors.takeaway.primary,
                                border: 'none',
                                boxShadow: '0 10px 20px rgba(0,0,0,0.15)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8
                            }}
                        >
                            เพิ่มออเดอร์ใหม่
                        </Button>
                    </div>
                </div>
                
                {/* Decorative Pattern / Glow */}
                <div style={{
                    position: 'absolute',
                    top: -100,
                    right: -100,
                    width: 300,
                    height: 300,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)',
                    filter: 'blur(60px)'
                }} />
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
                                        className="takeaway-order-card"
                                        style={{ 
                                            ...posPageStyles.card,
                                            cursor: 'pointer',
                                            height: '100%',
                                            position: 'relative',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            border: '1px solid #f0f0f0',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
                                        }}
                                        onClick={() => handleOrderClick(order.id)}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-8px)';
                                            e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)';
                                            e.currentTarget.style.borderColor = channelColors.takeaway.primary;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)';
                                            e.currentTarget.style.borderColor = '#f0f0f0';
                                        }}
                                    >
                                        <div style={{ padding: '24px 20px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                                                <Space direction="vertical" size={4}>
                                                    <Tag 
                                                        color={channelColors.takeaway.primary}
                                                        style={{ 
                                                            margin: 0, 
                                                            borderRadius: 4, 
                                                            fontSize: 12,
                                                            fontWeight: 700,
                                                            textTransform: 'uppercase'
                                                        }}
                                                    >
                                                        Take Away
                                                    </Tag>
                                                    <Text strong style={{ fontSize: 14, color: '#8c8c8c' }}>
                                                        {dayjs(order.create_date).fromNow()}
                                                    </Text>
                                                </Space>
                                                
                                                <Tag 
                                                    color={getOrderStatusColor(order.status)}
                                                    style={{ 
                                                        margin: 0, 
                                                        padding: '4px 12px', 
                                                        borderRadius: 20, 
                                                        fontSize: 13,
                                                        fontWeight: 600,
                                                        border: 'none',
                                                        boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
                                                    }}
                                                >
                                                    {getOrderStatusText(order.status)}
                                                </Tag>
                                            </div>

                                            <div style={{ marginBottom: 24 }}>
                                                <Title level={4} style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1f1f1f' }}>
                                                    Order: #{order.order_no.split('-').pop()}
                                                </Title>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                                    <UserOutlined style={{ color: '#bfbfbf' }} />
                                                    <Text style={{ color: '#595959' }}>
                                                        {order.created_by?.display_name || 'ลูกค้าทั่วไป'}
                                                    </Text>
                                                </div>
                                            </div>

                                            <div style={{ 
                                                display: 'flex', 
                                                justifyContent: 'space-between', 
                                                alignItems: 'end',
                                                paddingTop: 16,
                                                borderTop: '1px dashed #f0f0f0' 
                                            }}>
                                                <div>
                                                    <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>รายการสินค้า</Text>
                                                    <Text strong style={{ fontSize: 16 }}>{itemCount} ชิ้น</Text>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>ยอดรวม</Text>
                                                    <Text strong style={{ color: channelColors.takeaway.primary, fontSize: 22 }}>
                                                        ฿{Number(order.total_amount).toLocaleString()}
                                                    </Text>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Status Progress Bar */}
                                        <div style={{ 
                                            height: 6, 
                                            background: getOrderStatusColor(order.status) === 'orange' ? '#faad14' : 
                                                       getOrderStatusColor(order.status) === 'blue' ? '#1890ff' : 
                                                       getOrderStatusColor(order.status) === 'green' ? '#52c41a' : '#d9d9d9',
                                            width: '100%',
                                            position: 'absolute',
                                            bottom: 0,
                                            left: 0,
                                            borderRadius: '0 0 16px 16px'
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
