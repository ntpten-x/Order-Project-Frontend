"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Typography, Row, Col, Card, Tag, Button, Spin, Empty, Divider } from "antd";
import { CheckCircleOutlined, ShopOutlined, ShoppingOutlined, RocketOutlined, UserOutlined } from "@ant-design/icons";
import { ordersService } from "../../../../services/pos/orders.service";
import { SalesOrderItem } from "../../../../types/api/pos/salesOrderItem";
import { OrderStatus, OrderType, SalesOrder } from "../../../../types/api/pos/salesOrder";
import { pageStyles, colors } from "../style";
import dayjs from "dayjs";
import 'dayjs/locale/th';

const { Title, Text } = Typography;
dayjs.locale('th');

interface OrderGroup {
    order: Partial<SalesOrder>; // Use Partial because connection might not fetch all fields, but we know structure
    items: SalesOrderItem[];
    totalAmount: number;
}

export default function POSItemsPage() {
    const router = useRouter(); // Use App Router
    const [orderGroups, setOrderGroups] = useState<OrderGroup[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchServedItems();
        // Optional: Polling or Socket
    }, []);

    const fetchServedItems = async () => {
        try {
            setIsLoading(true);
            const activeStatuses = [OrderStatus.WaitingForPayment].join(',');
            
            const response = await ordersService.getAll(undefined, 1, 100, activeStatuses);
            const orders = response.data;
            
            const groups: OrderGroup[] = orders.map(order => ({
                order: order,
                items: order.items || [],
                totalAmount: order.total_amount
            }));
            
            // Sort by order creation date
            groups.sort((a, b) => dayjs(b.order.create_date).unix() - dayjs(a.order.create_date).unix());

            setOrderGroups(groups);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

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

    return (
        <div style={pageStyles.container}>
             <div style={{ ...pageStyles.heroParams, paddingBottom: 80 }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 10 }}>
                    <div style={pageStyles.sectionTitle}>
                        <CheckCircleOutlined style={{ fontSize: 28 }} />
                        <div>
                            <Title level={3} style={{ margin: 0, color: '#fff' }}>รายการรอชำระเงิน</Title>
                            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>Waiting For Payment Orders</Text>
                        </div>
                    </div>
                </div>
            </div>

             <div style={{ maxWidth: 1200, margin: '-40px auto 0', padding: '0 24px', position: 'relative', zIndex: 20 }}>
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: 40 }}><Spin size="large" /></div>
                ) : orderGroups.length === 0 ? (
                    <Card style={{ borderRadius: 12 }}>
                        <Empty description="ไม่มีรายการรอชำระเงิน" />
                    </Card>
                ) : (
                    <Row gutter={[16, 16]}>
                        {orderGroups.map((group) => (
                            <Col xs={24} sm={12} lg={8} key={group.order.id}>
                                <Card 
                                    hoverable 
                                    style={{ borderRadius: 12, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}
                                    bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                        <div>
                                            <Tag color="geekblue" style={{ fontSize: 13, padding: '4px 8px', marginBottom: 6 }}>
                                                {dayjs(group.order.create_date).format('HH:mm')}
                                            </Tag>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                {getOrderIcon(group.order.order_type)}
                                                <Text strong style={{ fontSize: 16 }}>
                                                    {getOrderTypeUserFriendly(group.order.order_type, group.order.table)}
                                                </Text>
                                            </div>
                                            <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>#{group.order.order_no}</Text>
                                            {group.order.created_by_id && (
                                                <Text type="secondary" style={{ fontSize: 11 }}>
                                                    <UserOutlined style={{ marginRight: 4 }} />
                                                    {group.order.created_by_id}
                                                </Text>
                                            )}
                                        </div>
                                        <Text strong style={{ fontSize: 18, color: colors.primary }}>
                                            ฿{group.totalAmount.toLocaleString()}
                                        </Text>
                                    </div>
                                    
                                    <Divider style={{ margin: '12px 0' }} />
                                    
                                    <div style={{ flex: 1 }}>
                                        {group.items.map((item, idx) => (
                                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
                                                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                                    {item.product?.img_url ? (
                                                        <>
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img 
                                                                src={item.product.img_url} 
                                                                alt={item.product.display_name} 
                                                                style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} 
                                                            />
                                                        </>
                                                    ) : (
                                                        <div style={{ width: 40, height: 40, borderRadius: 6, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <ShopOutlined style={{ color: '#ccc' }} />
                                                        </div>
                                                    )}
                                                    
                                                    <div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <Tag style={{ margin: 0, padding: '0 4px' }}>x{item.quantity}</Tag>
                                                            <Text strong style={{ fontSize: 14 }}>{item.product?.display_name}</Text>
                                                        </div>
                                                        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 2 }}>฿{Number(item.price).toLocaleString()}</Text>
                                                        {item.notes && <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>* {item.notes}</Text>}
                                                    </div>
                                                </div>
                                                <Text strong>฿{Number(item.total_price || (Number(item.price) * item.quantity)).toLocaleString()}</Text>
                                            </div>
                                        ))}
                                    </div>

                                    <Divider style={{ margin: '12px 0' }} />
                                    
                                    <Button 
                                        type="primary" 
                                        block 
                                        style={{ background: colors.success, borderColor: colors.success }}
                                        onClick={() => router.push(`/pos/items/${group.order.id}`)}
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
