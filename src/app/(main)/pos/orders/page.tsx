"use client";

import React, { useEffect, useState } from "react";
import { Typography, Card, Table, Tag, Button, Empty, Divider, Grid, List, Input } from "antd";
import { 
  ReloadOutlined, 
  EyeOutlined,
  ArrowLeftOutlined,
  ClockCircleOutlined,
  ContainerOutlined
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { SalesOrderSummary, OrderStatus, OrderType } from "@/types/api/pos/salesOrder";
import { 
  getOrderStatusColor, 
  getOrderStatusText, 
  getOrderChannelColor, 
  getOrderChannelText,
  getOrderReference,
  formatCurrency
} from "@/utils/orders";
import { orderColors, ordersStyles, ordersResponsiveStyles } from "@/theme/pos/orders/style";
import { useSocket } from "@/hooks/useSocket";
import { useRealtimeRefresh } from "@/utils/pos/realtime";
import { useOrdersSummary } from "@/hooks/pos/useOrdersSummary";
import dayjs from "dayjs";
import 'dayjs/locale/th';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;
dayjs.locale('th');

export default function POSOrdersPage() {
    const router = useRouter();
    const screens = useBreakpoint();
    const isMobile = !screens.md;
    const { socket } = useSocket();

    const [page, setPage] = useState(1);
    const [searchValue, setSearchValue] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const LIMIT = 10;
    const activeStatuses = 'Pending,Cooking,Served,WaitingForPayment';

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchValue.trim());
            setPage(1);
        }, 400);
        return () => clearTimeout(handler);
    }, [searchValue]);

    const { orders, total, isLoading, refetch } = useOrdersSummary({
        page,
        limit: LIMIT,
        status: activeStatuses,
        query: debouncedSearch || undefined
    });

    useRealtimeRefresh({
        socket,
        events: ["orders:create", "orders:update", "orders:delete", "payments:create", "payments:update"],
        onRefresh: () => refetch(),
        intervalMs: 15000,
        debounceMs: 1000,
    });

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
            render: (_: any, record: SalesOrderSummary) => {
                const summary = record.items_summary || {};
                const totalQty = record.items_count || 0;
                const entries = Object.entries(summary);

                if (totalQty === 0) return <Text type="secondary">-</Text>;

                return (
                    <div style={{ fontSize: 13, lineHeight: '1.6', textAlign: 'left', display: 'inline-block', minWidth: 140 }}>
                        {entries.length > 0 ? (
                            <>
                                {entries.map(([cat, qty]) => (
                                    <div key={cat} style={ordersStyles.summaryRow}>
                                        <Text type="secondary">{cat}</Text>
                                        <Text strong>{qty} รายการ</Text>
                                    </div>
                                ))}
                                <Divider style={{ margin: '4px 0' }} />
                            </>
                        ) : null}
                        <div style={ordersStyles.summaryRowBold}>
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
            render: (_: any, record: SalesOrderSummary) => (
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
        <div style={ordersStyles.container}>
            <style jsx global>{ordersResponsiveStyles}</style>

            <div style={ordersStyles.header} className="orders-header">
                <div style={ordersStyles.headerContent} className="orders-content">
                     <Button 
                        icon={<ArrowLeftOutlined />} 
                        onClick={() => router.push('/pos')}
                        type="text"
                        style={{ color: '#fff', fontSize: 18, marginRight: 16 }}
                    />
                    <div style={ordersStyles.headerIcon} className="orders-header-icon">
                        <ContainerOutlined style={{ color: '#fff' }} />
                    </div>
                    <div style={ordersStyles.headerTextContainer}>
                        <Title level={2} style={ordersStyles.headerTitle} className="orders-page-title">รายการออเดอร์ปัจจุบัน</Title>
                        <Text style={ordersStyles.headerSubtitle} className="orders-page-subtitle">จัดการและติดตามสถานะออเดอร์ที่กำลังดำเนินการ</Text>
                    </div>
                    <Input
                        allowClear
                        placeholder="ค้นหาเลขที่ออเดอร์/โต๊ะ/เดลิเวอรี่"
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        size={isMobile ? "middle" : "large"}
                        style={{ width: isMobile ? 200 : 280 }}
                    />
                    <Button icon={<ReloadOutlined />} onClick={() => refetch()} size={isMobile ? 'middle' : 'large'} ghost>รีเฟรช</Button>
                </div>
            </div>

            <div style={ordersStyles.contentWrapper} className="orders-content-wrapper">
                <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} bodyStyle={ordersStyles.cardBody}>
                    {!isMobile ? (
                        <Table
                            columns={columns}
                            dataSource={orders}
                            loading={isLoading}
                            rowKey="id"
                            virtual
                            scroll={{ y: 600 }}
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
                                    <div 
                                        style={ordersStyles.orderCard} 
                                        className="orders-card"
                                        onClick={() => router.push(`/pos/orders/${order.id}`)}
                                    >
                                        <div style={ordersStyles.cardHeader} className="orders-card-header">
                                            <div style={ordersStyles.cardHeaderLeft}>
                                                <Text strong style={{ fontSize: 16 }}>#{order.order_no}</Text>
                                                <Tag color={getOrderStatusColor(order.status)} style={{ margin: 0 }}>{getOrderStatusText(order.status)}</Tag>
                                            </div>
                                             <Tag color={getOrderChannelColor(order.order_type)}>
                                                {getOrderChannelText(order.order_type)}
                                            </Tag>
                                        </div>
                                        
                                        <div style={ordersStyles.cardBody} className="orders-card-body">
                                            <div style={ordersStyles.refSection}>
                                                {order.order_type === OrderType.DineIn && order.table && (
                                                    <div style={ordersStyles.refValue} className="orders-ref-value">
                                                        โต๊ะ {order.table.table_name}
                                                    </div>
                                                )}
                                                {(order.order_type === OrderType.Delivery || order.order_type === OrderType.TakeAway) && (
                                                    <div style={ordersStyles.refValue} className="orders-ref-value">
                                                        {order.delivery_code ? `Ref: ${order.delivery_code}` : '-'}
                                                    </div>
                                                )}
                                            </div>

                                            <div style={ordersStyles.itemsSummary}>
                                                <div style={ordersStyles.metaSection}>
                                                    <ContainerOutlined />
                                                    <Text strong>{totalQty} รายการ</Text>
                                                </div>
                                                <div style={ordersStyles.metaSection}>
                                                    <ClockCircleOutlined />
                                                    <Text>{dayjs(order.create_date).format('HH:mm น.')}</Text>
                                                </div>
                                            </div>

                                            <div style={ordersStyles.totalSection}>
                                                <Text style={ordersStyles.totalLabel}>ยอดรวม</Text>
                                                <div style={ordersStyles.totalAmount} className="orders-total-amount">
                                                    {formatCurrency(Number(order.total_amount))}
                                                </div>
                                            </div>
                                            
                                            <Button type="primary" ghost icon={<EyeOutlined />} style={ordersStyles.actionButton}>รายละเอียด</Button>
                                        </div>
                                    </div>
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
        </div>
    );
}
