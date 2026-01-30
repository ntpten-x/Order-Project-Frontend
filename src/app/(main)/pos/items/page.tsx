"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Typography, Row, Col, Card, Tag, Button, Spin, Empty, Divider, Avatar, Space } from "antd";
import { CheckCircleOutlined, ShopOutlined, ShoppingOutlined, RocketOutlined, UserOutlined } from "@ant-design/icons";
import { ordersService } from "@/services/pos/orders.service";
import { SalesOrderItem } from "@/types/api/pos/salesOrderItem";
import { OrderStatus, OrderType, SalesOrder } from "@/types/api/pos/salesOrder";
import { paymentPageStyles, paymentColors } from "@/theme/pos/payments.theme";
import { formatCurrency } from "@/utils/orders";
import { useGlobalLoading } from "@/contexts/pos/GlobalLoadingContext";
import { useSocket } from "@/hooks/useSocket";
import { useRealtimeRefresh } from "@/utils/pos/realtime";
import dayjs from "dayjs";
import 'dayjs/locale/th';

const { Title, Text } = Typography;
dayjs.locale('th');

interface OrderGroup {
    order: Partial<SalesOrder>;
    items: SalesOrderItem[];
    totalAmount: number;
}

export default function POSItemsPage() {
    const router = useRouter();
    const [orderGroups, setOrderGroups] = useState<OrderGroup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showLoading, hideLoading } = useGlobalLoading();
    const { socket } = useSocket();

    const fetchServedItems = useCallback(async (initial = false) => {
        try {
            if (initial) showLoading("กำลังโหลดรายการรอชำระเงิน...");
            setIsLoading(true);
            const activeStatuses = [OrderStatus.WaitingForPayment].join(',');
            
            const response = await ordersService.getAll(undefined, 1, 100, activeStatuses);
            const orders = response.data;
            
            const groups: OrderGroup[] = orders.map(order => ({
                order: order,
                items: order.items || [],
                totalAmount: order.total_amount
            }));
            
            // Sort by order creation date (newest first)
            groups.sort((a, b) => dayjs(b.order.create_date).unix() - dayjs(a.order.create_date).unix());

            setOrderGroups(groups);
        } catch (error) {
            // Silently handle error or show notification if critical
        } finally {
            setIsLoading(false);
            if (initial) hideLoading();
        }
    }, [showLoading, hideLoading]);

    useEffect(() => {
        fetchServedItems(true);
    }, [fetchServedItems]);

    useRealtimeRefresh({
        socket,
        events: ["orders:update", "orders:create", "orders:delete"],
        onRefresh: () => fetchServedItems(false),
        intervalMs: 15000,
        debounceMs: 1000,
    });

    const getOrderTypeUserFriendly = (type?: OrderType, table?: SalesOrder["table"]) => {
        switch (type) {
            case OrderType.DineIn: return `โต๊ะ ${table?.table_name || 'N/A'}`;
            case OrderType.TakeAway: return 'สั่งกลับบ้าน';
            case OrderType.Delivery: return 'เดลิเวอรี่';
            default: return type || 'N/A';
        }
    };

    const getOrderIcon = (type?: OrderType) => {
        switch (type) {
            case OrderType.DineIn: return <ShopOutlined />;
            case OrderType.TakeAway: return <ShoppingOutlined />;
            case OrderType.Delivery: return <RocketOutlined />;
            default: return <ShopOutlined />;
        }
    };

    const handlePaymentClick = (orderId?: string, orderType?: OrderType) => {
        if (!orderId) return;
        showLoading("กำลังไปหน้าชำระเงิน...");
        const path = orderType === OrderType.Delivery 
            ? `/pos/items/delivery/${orderId}` 
            : `/pos/items/payment/${orderId}`;
        router.push(path);
    };

    return (
        <div style={paymentPageStyles.container}>
             <div style={paymentPageStyles.heroSection}>
                <div style={paymentPageStyles.contentWrapper}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                        <CheckCircleOutlined style={{ fontSize: 28, color: '#fff' }} />
                        <div>
                            <Title level={3} style={paymentPageStyles.pageTitle}>รายการรอชำระเงิน</Title>
                            <Text style={paymentPageStyles.pageSubtitle}>Waiting For Payment Orders</Text>
                        </div>
                    </div>
                </div>
            </div>

             <div style={{ ...paymentPageStyles.contentWrapper, marginTop: -40, padding: '0 24px' }}>
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: 40 }}><Spin size="large" /></div>
                ) : orderGroups.length === 0 ? (
                    <Card style={{ borderRadius: 12, border: 'none', boxShadow: paymentColors.cardShadow }}>
                        <Empty description="ไม่มีรายการรอชำระเงิน" />
                    </Card>
                ) : (
                    <Row gutter={[16, 16]}>
                        {orderGroups.map((group) => (
                            <Col xs={24} sm={12} lg={8} key={group.order.id}>
                                <Card 
                                    hoverable 
                                    style={paymentPageStyles.card}
                                    bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                                >
                                    {/* Card Header */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                        <div>
                                            <Tag color="geekblue" style={{ fontSize: 13, padding: '4px 8px', marginBottom: 6, borderRadius: 6 }}>
                                                {dayjs(group.order.create_date).format('HH:mm')}
                                            </Tag>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                {getOrderIcon(group.order.order_type)}
                                                <Text strong style={{ fontSize: 16 }}>
                                                    {getOrderTypeUserFriendly(group.order.order_type, group.order.table)}
                                                </Text>
                                            </div>
                                            <Space size={4} direction="vertical" style={{ marginTop: 4 }}>
                                                <Text type="secondary" style={{ fontSize: 12 }}>#{group.order.order_no}</Text>
                                                {group.order.created_by_id && (
                                                    <Text type="secondary" style={{ fontSize: 11 }}>
                                                        <UserOutlined style={{ marginRight: 4 }} />
                                                        {group.order.created_by_id}
                                                    </Text>
                                                )}
                                            </Space>
                                        </div>
                                        <Text strong style={{ fontSize: 20, color: paymentColors.primary }}>
                                            {formatCurrency(group.totalAmount)}
                                        </Text>
                                    </div>
                                    
                                    <Divider style={{ margin: '12px 0' }} />
                                    
                                    {/* Items List */}
                                    <div style={{ flex: 1 }}>
                                        {group.items.map((item, idx) => (
                                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
                                                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1, minWidth: 0 }}>
                                                    {item.product?.img_url ? (
                                                        <Avatar 
                                                            shape="square" 
                                                            size={40} 
                                                            src={item.product.img_url} 
                                                            style={{ borderRadius: 8, border: `1px solid ${paymentColors.borderLight}` }}
                                                        />
                                                    ) : (
                                                        <div style={{ width: 40, height: 40, borderRadius: 8, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${paymentColors.borderLight}` }}>
                                                            <ShopOutlined style={{ color: paymentColors.textLight }} />
                                                        </div>
                                                    )}
                                                    
                                                    <div style={{ minWidth: 0, flex: 1 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <Tag style={{ margin: 0, padding: '0 4px', fontSize: 11 }}>x{item.quantity}</Tag>
                                                            <Text strong style={{ fontSize: 14 }} ellipsis>{item.product?.display_name}</Text>
                                                        </div>
                                                        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 1 }}>
                                                            {formatCurrency(item.price)}
                                                        </Text>
                                                        {item.notes && <Text type="secondary" style={{ fontSize: 11, display: 'block', fontStyle: 'italic' }}>* {item.notes}</Text>}
                                                    </div>
                                                </div>
                                                <Text strong style={{ marginLeft: 8 }}>
                                                    {formatCurrency(Number(item.total_price || (Number(item.price) * item.quantity)))}
                                                </Text>
                                            </div>
                                        ))}
                                    </div>

                                    <Divider style={{ margin: '12px 0' }} />
                                    
                                    <Button 
                                        type="primary" 
                                        block 
                                        size="large"
                                        style={{ background: paymentColors.success, borderColor: paymentColors.success, borderRadius: 8, height: 44, fontWeight: 600 }}
                                        onClick={() => handlePaymentClick(group.order.id, group.order.order_type as OrderType)}
                                    >
                                        ชำระเงิน
                                    </Button>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}
            </div>
        </div>
    );
}
