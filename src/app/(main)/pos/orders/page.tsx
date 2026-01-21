"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Typography, Row, Col, Card, Tag, Badge, Spin, Empty, Button, Divider } from "antd";
import { ClockCircleOutlined, ShopOutlined, RocketOutlined, ShoppingOutlined, RightOutlined, UserOutlined } from "@ant-design/icons";
import { ordersService } from "../../../../services/pos/orders.service";
import { SalesOrder, OrderStatus } from "../../../../types/api/pos/salesOrder";
import { SalesOrderItem } from "../../../../types/api/pos/salesOrderItem";
import { pageStyles, colors } from "../style";
import dayjs from "dayjs";
import 'dayjs/locale/th';

const { Title, Text, Paragraph } = Typography;
dayjs.locale('th');

export default function POSOrdersPage() {
    const router = useRouter();
    const [page, setPage] = useState(1);
    
    // Fetch orders - currently fetching all (paginated), validation needed on backend filters potentially
    // For now we fetch latest
    const activeStatuses = [OrderStatus.Pending, OrderStatus.Cooking, OrderStatus.Served].join(',');

    const { data, isLoading } = useSWR(
        `/pos/orders?page=${page}&limit=50&status=${activeStatuses}`,
        () => ordersService.getAll(undefined, page, 50, activeStatuses),
        {
            refreshInterval: 5000, 
            revalidateOnFocus: true
        }
    );

    const orders = data?.data || [];
    
    // Filter to show active orders primarily? Or show all separated?
    // User asked to "show list of items of order". 
    // Let's Sort by Date Descending
    const sortedOrders = [...orders].sort((a, b) => new Date(b.create_date).getTime() - new Date(a.create_date).getTime());

    const getStatusColor = (status: string) => {
        switch (status) {
            case OrderStatus.Pending: return "orange";
            case OrderStatus.Cooking: return "blue";
            case OrderStatus.Served: return "green";
            case OrderStatus.Paid: return "gold";
            case OrderStatus.Cancelled: return "red";
            default: return "default";
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case OrderStatus.Pending: return "รอรับออเดอร์";
            case OrderStatus.Cooking: return "กำลังปรุง";
            case OrderStatus.Served: return "เสิร์ฟแล้ว";
            case OrderStatus.Paid: return "ชำระเงินแล้ว";
            case OrderStatus.Cancelled: return "ยกเลิก";
            default: return status;
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'DineIn': return <ShopOutlined />;
            case 'TakeAway': return <ShoppingOutlined />;
            case 'Delivery': return <RocketOutlined />;
            default: return <ShopOutlined />;
        }
    };

    return (
        <div style={pageStyles.container}>
            <div style={{ ...pageStyles.heroParams, paddingBottom: 80 }}>
                <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 10 }}>
                    <div style={pageStyles.sectionTitle}>
                        <ClockCircleOutlined style={{ fontSize: 28 }} />
                        <div>
                            <Title level={3} style={{ margin: 0, color: '#fff' }}>รายการออเดอร์ (Active Orders)</Title>
                            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>จัดการออเดอร์ล่าสุด</Text>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: 1200, margin: '-40px auto 0', padding: '0 24px', position: 'relative', zIndex: 20 }}>
                {isLoading ? (
                    <div style={{ textAlign: "center", padding: "60px", background: '#fff', borderRadius: 12 }}>
                        <Spin size="large" />
                    </div>
                ) : sortedOrders.length > 0 ? (
                    <Row gutter={[16, 16]}>
                        {sortedOrders.map((order) => (
                            <Col xs={24} sm={12} md={8} lg={8} key={order.id}>
                                <Card
                                    hoverable
                                    style={{ borderRadius: 12, overflow: 'hidden', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                                    styles={{ body: { padding: 0 } }}
                                >
                                    <div style={{ 
                                        padding: '12px 16px', 
                                        borderBottom: '1px solid #f0f0f0', 
                                        display: 'flex', 
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        background: '#fafafa'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <Tag color="#108ee9" style={{ margin: 0, padding: '2px 8px', borderRadius: 4 }}>
                                                {getIcon(order.order_type)} {order.order_type}
                                            </Tag>
                                            <Text strong>{dayjs(order.create_date).format('HH:mm')}</Text>
                                        </div>
                                        <Tag color={getStatusColor(order.status)} style={{ margin: 0 }}>
                                            {getStatusText(order.status)}
                                        </Tag>
                                    </div>
                                    
                                    <div style={{ padding: 16 }}>
                                        <div style={{ marginBottom: 12 }}>
                                            <Text type="secondary" style={{ fontSize: 13 }}>Reference:</Text>
                                            <div style={{ fontSize: 16, fontWeight: 600 }}>
                                                {order.order_type === 'DineIn' && (order.table?.table_name || 'N/A')}
                                                {order.order_type === 'Delivery' && (order.delivery_code || order.delivery?.delivery_name || 'N/A')}
                                                {order.order_type === 'TakeAway' && (order.order_no)} 
                                            </div>
                                        </div>

                                        <div style={{ marginBottom: 12, background: '#f9f9f9', padding: '10px', borderRadius: 8 }}>
                                            {/* Order Summary by Category */}
                                            {(() => {
                                                const items = order.items || [];
                                                if (items.length === 0) return <Text type="secondary">ไม่มีรายการสินค้า</Text>;

                                                const summary = items.reduce((acc, item) => {
                                                    const categoryName = item.product?.category?.display_name || 'อื่นๆ';
                                                    acc[categoryName] = (acc[categoryName] || 0) + item.quantity;
                                                    return acc;
                                                }, {} as Record<string, number>);

                                                return (
                                                    <div style={{ fontSize: 13 }}>
                                                        {Object.entries(summary).map(([cat, qty]) => (
                                                            <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                                                                <Text type="secondary">{cat}</Text>
                                                                <Text>{qty} รายการ</Text>
                                                            </div>
                                                        ))}
                                                        <Divider style={{ margin: '8px 0' }} />
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                                                            <Text>รวมทั้งหมด</Text>
                                                            <Text>{items.reduce((sum, i) => sum + i.quantity, 0)} รายการ</Text>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                            
                                            <Divider style={{ margin: '8px 0' }} />

                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                 <Text type="secondary">ยอดรวม:</Text>
                                                 <Text strong style={{ color: colors.primary }}>฿{Number(order.total_amount).toLocaleString()}</Text>
                                            </div>
                                        </div>

                                        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', color: '#8c8c8c', fontSize: 12 }}>
                                            <UserOutlined style={{ marginRight: 6 }} />
                                            <span>สร้างโดย: <Text strong style={{ color: '#595959' }}>{order.created_by?.username || order.created_by_id || 'System'}</Text></span>
                                        </div>

                                        <Button 
                                            type="primary" 
                                            block 
                                            icon={<RightOutlined />}
                                            onClick={() => router.push(`/pos/orders/${order.id}`)}
                                        >
                                            ดูรายละเอียด
                                        </Button>
                                    </div>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                ) : (
                    <div style={{ background: '#fff', borderRadius: 12, padding: 50, textAlign: 'center' }}>
                         <Empty description="ไม่มีรายการออเดอร์" />
                    </div>
                )}
            </div>
        </div>
    );
}
