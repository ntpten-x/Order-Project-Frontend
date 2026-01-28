"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Typography, Card, Table, Tag, Button, Spin, Empty, Divider, Space, Grid, List } from "antd";
import { 
  ReloadOutlined, 
  EyeOutlined,
  ArrowLeftOutlined,
  ClockCircleOutlined,
  ContainerOutlined
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { ordersService } from "@/services/pos/orders.service";
import { SalesOrder, OrderStatus, OrderType } from "@/types/api/pos/salesOrder";
import { 
  getOrderStatusColor, 
  getOrderStatusText, 
  getOrderChannelColor, 
  getOrderChannelText,
  getOrderReference,
  getTotalItemsQuantity,
  groupItemsByCategory,
  formatCurrency
} from "@/utils/orders";
import { orderColors } from "@/theme/pos/orders.theme";
import dayjs from "dayjs";
import 'dayjs/locale/th';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;
dayjs.locale('th');

export default function POSOrdersPage() {
    const router = useRouter();
    const screens = useBreakpoint();
    const isMobile = !screens.md;

    const [orders, setOrders] = useState<SalesOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const LIMIT = 10;

    const fetchOrders = useCallback(async () => {
        setIsLoading(true);
        try {
            // Filter only active statuses
            const activeStatuses = 'Pending,Cooking,Served,WaitingForPayment';
            const data = await ordersService.getAll(undefined, page, LIMIT, activeStatuses);
            setOrders(data.data || []);
            setTotal(data.total || 0);
        } catch (error) {
            // Error handled by service/interceptor
        } finally {
            setIsLoading(false);
        }
    }, [page]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const columns = [
        {
            title: 'เลขที่ออเดอร์',
            dataIndex: 'order_no',
            key: 'order_no',
            align: 'center' as const,
            render: (text: string) => <Text strong style={{ whiteSpace: 'nowrap' }}>{text}</Text>
        },
        {
            title: 'วันเวลา',
            dataIndex: 'create_date',
            key: 'date',
            align: 'center' as const,
            render: (date: string) => (
                <div style={{ whiteSpace: 'nowrap' }}>
                    <Text>{dayjs(date).format('DD MMM YYYY')}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(date).format('HH:mm')}</Text>
                </div>
            )
        },
        {
            title: 'ประเภท',
            dataIndex: 'order_type',
            key: 'type',
            align: 'center' as const,
            render: (type: OrderType) => (
                <Tag color={getOrderChannelColor(type)} style={{ margin: 0 }}>
                    {getOrderChannelText(type)}
                </Tag>
            )
        },
        {
            title: 'โต๊ะ / รหัสอ้างอิง',
            key: 'reference',
            align: 'center' as const,
            render: (_: any, record: SalesOrder) => {
                const ref = getOrderReference(record);
                let color = 'default';
                if (record.order_type === OrderType.DineIn) color = 'cyan';
                if (record.order_type === OrderType.Delivery) color = 'orange';
                return <Tag color={color} style={{ margin: 0 }}>{ref}</Tag>;
            }
        },
        {
            title: 'รายละเอียดรายการ',
            key: 'items_summary',
            width: 200,
            align: 'center' as const,
            render: (_: any, record: SalesOrder) => {
                const summary = groupItemsByCategory(record.items);
                const totalQty = getTotalItemsQuantity(record.items);

                if (totalQty === 0) return <Text type="secondary">-</Text>;

                return (
                    <div style={{ fontSize: 13, lineHeight: '1.6', textAlign: 'left', display: 'inline-block', minWidth: 140 }}>
                        {Object.entries(summary).map(([cat, qty]) => (
                            <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                                <Text type="secondary">{cat}</Text>
                                <Text strong>{qty} รายการ</Text>
                            </div>
                        ))}
                        <Divider style={{ margin: '4px 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Text strong>รวม</Text>
                            <Text strong style={{ color: orderColors.primary }}>{totalQty} รายการ</Text>
                        </div>
                    </div>
                );
            }
        },
        {
            title: 'ยอดรวม',
            dataIndex: 'total_amount',
            key: 'total',
            align: 'center' as const,
            render: (amount: number) => <Text strong style={{ whiteSpace: 'nowrap' }}>{formatCurrency(amount)}</Text>
        },
        {
            title: 'สถานะ',
            dataIndex: 'status',
            key: 'status',
            align: 'center' as const,
            render: (status: OrderStatus) => (
                <Tag color={getOrderStatusColor(status)} style={{ margin: 0 }}>
                    {getOrderStatusText(status)}
                </Tag>
            )
        },
        {
            title: 'จัดการ',
            key: 'action',
            align: 'center' as const,
            render: (_: any, record: SalesOrder) => (
                <Button 
                    type="primary" 
                    icon={<EyeOutlined />} 
                    onClick={() => router.push(`/pos/orders/${record.id}`)}
                    style={{ whiteSpace: 'nowrap' }}
                >
                    ดูรายละเอียด
                </Button>
            )
        }
    ];

    return (
        <div style={{ padding: isMobile ? '12px' : '24px', maxWidth: 1200, margin: '0 auto' }}>
            <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} bodyStyle={{ padding: isMobile ? '12px' : '24px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 16 }}>
                        <Button 
                            icon={<ArrowLeftOutlined />} 
                            onClick={() => router.push('/pos')}
                            shape="circle"
                        />
                        <div>
                            <Title level={isMobile ? 4 : 2} style={{ margin: 0 }}>รายการออเดอร์ปัจจุบัน</Title>
                            <Text type="secondary" style={{ fontSize: isMobile ? 12 : 14 }}>จัดการและติดตามสถานะออเดอร์ที่กำลังดำเนินการ</Text>
                        </div>
                    </div>
                    <Button icon={<ReloadOutlined />} onClick={fetchOrders} size={isMobile ? 'middle' : 'large'}>รีเฟรช</Button>
                </div>

                {!isMobile ? (
                    <Table
                        columns={columns}
                        dataSource={orders}
                        loading={isLoading}
                        rowKey="id"
                        pagination={{
                            current: page,
                            pageSize: LIMIT,
                            total: total,
                            onChange: (p) => setPage(p),
                            showTotal: (total) => `ทั้งหมด ${total} รายการ`
                        }}
                        locale={{ emptyText: <Empty description="ไม่พบรายการออเดอร์" /> }}
                    />
                ) : (
                    <List
                        loading={isLoading}
                        dataSource={orders}
                        renderItem={(order) => {
                            const items = order.items || [];
                            const totalQty = items.reduce((acc, item) => acc + (item.status !== 'Cancelled' || order.status === OrderStatus.Cancelled ? Number(item.quantity) : 0), 0);
                            
                            return (
                                <Card 
                                    style={{ marginBottom: 16, borderRadius: 12, border: '1px solid #f0f0f0' }}
                                    bodyStyle={{ padding: 16 }}
                                    onClick={() => router.push(`/pos/orders/${order.id}`)}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                        <Text strong style={{ fontSize: 16 }}>#{order.order_no}</Text>
                                        <Tag color={getOrderStatusColor(order.status)} style={{ margin: 0 }}>{getOrderStatusText(order.status)}</Tag>
                                    </div>
                                    
                                    <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                                        <Tag color={order.order_type === OrderType.DineIn ? 'blue' : order.order_type === OrderType.TakeAway ? 'green' : 'orange'}>
                                            {order.order_type === OrderType.DineIn ? 'ทานที่ร้าน' : order.order_type === OrderType.TakeAway ? 'กลับบ้าน' : 'เดลิเวอรี่'}
                                        </Tag>
                                        {order.order_type === OrderType.DineIn && order.table && (
                                            <Tag color="cyan">โต๊ะ {order.table.table_name}</Tag>
                                        )}
                                        {order.order_type === OrderType.Delivery && order.delivery_code && (
                                            <Tag color="orange">Ref: {order.delivery_code}</Tag>
                                        )}
                                    </div>

                                    <div style={{ background: '#f9f9f9', padding: 12, borderRadius: 8, marginBottom: 12 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                            <ContainerOutlined style={{ color: '#8c8c8c' }} />
                                            <Text type="secondary">รายละเอียด: </Text>
                                            <Text strong>{totalQty} รายการ</Text>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <ClockCircleOutlined style={{ color: '#8c8c8c' }} />
                                            <Text type="secondary">เวลา: </Text>
                                            <Text>{dayjs(order.create_date).format('HH:mm น.')}</Text>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <Text type="secondary" style={{ fontSize: 12 }}>ยอดรวมทั้งหมด</Text>
                                            <div style={{ fontSize: 20, fontWeight: 'bold', color: '#1890ff' }}>
                                                ฿{Number(order.total_amount).toLocaleString()}
                                            </div>
                                        </div>
                                        <Button type="primary" ghost icon={<EyeOutlined />}>รายละเอียด</Button>
                                    </div>
                                </Card>
                            );
                        }}
                        pagination={{
                            current: page,
                            pageSize: LIMIT,
                            total: total,
                            onChange: (p) => setPage(p),
                            size: 'small',
                            style: { textAlign: 'center', marginTop: 16 }
                        }}
                    />
                )}
            </Card>
        </div>
    );
}
