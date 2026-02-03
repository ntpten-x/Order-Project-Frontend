"use client";

import { useOrderListPrefetching } from "../../../../hooks/pos/usePrefetching";

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
import { SalesOrderSummary, OrderStatus, OrderType } from "../../../../types/api/pos/salesOrder";
import { 
  getOrderStatusColor, 
  getOrderStatusText, 
  getOrderChannelColor, 
  getOrderChannelText,
  getOrderReference,
  formatCurrency
} from "../../../../utils/orders";
import { orderColors, ordersStyles, ordersResponsiveStyles } from "../../../../theme/pos/orders/style";
import { useDebouncedValue } from "../../../../utils/useDebouncedValue";
import { useOrdersSummary } from "../../../../hooks/pos/useOrdersSummary";
import dayjs from "dayjs";
import 'dayjs/locale/th';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;
dayjs.locale('th');

export default function POSOrdersPage() {
    const router = useRouter();
    const screens = useBreakpoint();
    const isMobile = !screens.md;
    // const { socket } = useSocket();
    
    // Prefetch order list data
    useOrderListPrefetching();

    const [page, setPage] = useState(1);
    const [searchValue, setSearchValue] = useState("");
    const debouncedSearch = useDebouncedValue(searchValue.trim(), 400);
    const LIMIT = 10;
    const activeStatuses = 'Pending,Cooking,Served,WaitingForPayment';

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

    const { orders, total, isLoading, refetch } = useOrdersSummary({
        page,
        limit: LIMIT,
        status: activeStatuses,
        query: debouncedSearch || undefined
    });

// Socket logic moved to useOrders hook to prevent double fetching
    // useRealtimeRefresh({
    //     socket,
    //     events: ["orders:create", "orders:update", "orders:delete", "payments:create", "payments:update"],
    //     onRefresh: () => refetch(),
    //     intervalMs: 15000,
    //     debounceMs: 1000,
    // });

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
            render: (_: unknown, record: SalesOrderSummary) => {
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
            render: (_: unknown, record: SalesOrderSummary) => {
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
            render: (_: unknown, record: SalesOrderSummary) => (
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

            {/* Header with softer gradient */}
            <header style={ordersStyles.header} className="orders-header" role="banner">
                <div style={ordersStyles.headerContent} className="orders-content orders-header-content-mobile">
                    {/* Glass Back Button */}
                    <Button 
                        icon={<ArrowLeftOutlined />} 
                        onClick={() => router.push('/pos')}
                        type="text"
                        className="orders-back-button-mobile"
                        aria-label="กลับไปหน้า POS"
                        style={{ 
                            color: '#fff', 
                            fontSize: 18, 
                            marginRight: 12,
                            width: 44,
                            height: 44,
                            borderRadius: 14,
                            background: 'rgba(255,255,255,0.15)',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255,255,255,0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    />
                    <div style={ordersStyles.headerIcon} className="orders-header-icon">
                        <ContainerOutlined style={{ color: '#fff', fontSize: 24 }} />
                    </div>
                    <div style={ordersStyles.headerTextContainer} className="orders-header-text-mobile">
                        <Title level={2} style={ordersStyles.headerTitle} className="orders-page-title">
                            รายการออเดอร์ปัจจุบัน
                        </Title>
                        <Text style={ordersStyles.headerSubtitle} className="orders-page-subtitle">
                            จัดการและติดตามสถานะออเดอร์ที่กำลังดำเนินการ
                        </Text>
                    </div>
                    <div className="orders-header-actions-mobile" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <Input
                            allowClear
                            placeholder="ค้นหาออเดอร์..."
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            size={isMobile ? "middle" : "large"}
                            className="orders-search-input-mobile"
                            style={{ 
                                width: isMobile ? 140 : 280, 
                                minWidth: 120,
                                borderRadius: 12,
                            }}
                        />
                        <Button 
                            icon={<ReloadOutlined />} 
                            onClick={() => refetch()} 
                            size={isMobile ? 'middle' : 'large'} 
                            ghost
                            className="orders-refresh-button-mobile scale-hover"
                            style={{
                                borderRadius: 12,
                                border: '1px solid rgba(255,255,255,0.4)',
                            }}
                        >
                            <span className="hide-on-mobile">รีเฟรช</span>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Content with Card */}
            <main style={ordersStyles.contentWrapper} className="orders-content-wrapper">
                <Card 
                    bordered={false} 
                    style={{ 
                        borderRadius: 20, 
                        boxShadow: orderColors.cardShadow,
                        border: '1px solid rgba(226, 232, 240, 0.8)',
                    }} 
                    styles={{ body: ordersStyles.cardBody }}
                >
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
                                const totalQty = order.items_count || 0;
                                
                                return (
                                    <article 
                                        style={{
                                            ...ordersStyles.orderCard,
                                            marginBottom: 14,
                                        }} 
                                        className={`orders-card fade-in`}
                                        onClick={() => router.push(`/pos/orders/${order.id}`)}
                                        role="button"
                                        tabIndex={0}
                                        aria-label={`ออเดอร์ ${order.order_no}`}
                                        onKeyDown={(e) => e.key === 'Enter' && router.push(`/pos/orders/${order.id}`)}
                                    >
                                        {/* Card Header */}
                                        <div style={ordersStyles.cardHeader} className="orders-card-header">
                                            <div style={ordersStyles.cardHeaderLeft}>
                                                <Text strong style={{ fontSize: 17, color: orderColors.text }}>
                                                    #{order.order_no}
                                                </Text>
                                                <Tag 
                                                    color={getOrderStatusColor(order.status)} 
                                                    style={{ margin: 0, borderRadius: 8, fontWeight: 600 }}
                                                >
                                                    {getOrderStatusText(order.status)}
                                                </Tag>
                                            </div>
                                            <Tag 
                                                color={getOrderChannelColor(order.order_type)}
                                                style={{ borderRadius: 8, fontWeight: 600 }}
                                            >
                                                {getOrderChannelText(order.order_type)}
                                            </Tag>
                                        </div>
                                        
                                        {/* Card Body */}
                                        <div style={ordersStyles.cardBody} className="orders-card-body">
                                            {/* Reference Section */}
                                            <div style={ordersStyles.refSection}>
                                                {order.order_type === OrderType.DineIn && order.table && (
                                                    <div style={ordersStyles.refValue} className="orders-ref-value">
                                                        🪑 โต๊ะ {order.table.table_name}
                                                    </div>
                                                )}
                                                {(order.order_type === OrderType.Delivery || order.order_type === OrderType.TakeAway) && (
                                                    <div style={ordersStyles.refValue} className="orders-ref-value">
                                                        📋 {order.delivery_code ? `Ref: ${order.delivery_code}` : '-'}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Summary Row */}
                                            <div style={ordersStyles.itemsSummary}>
                                                <div style={ordersStyles.metaSection}>
                                                    <ContainerOutlined style={{ color: orderColors.primary }} />
                                                    <Text strong style={{ color: orderColors.text }}>{totalQty} รายการ</Text>
                                                </div>
                                                <div style={ordersStyles.metaSection}>
                                                    <ClockCircleOutlined style={{ color: orderColors.textSecondary }} />
                                                    <Text style={{ color: orderColors.textSecondary }}>
                                                        {dayjs(order.create_date).format('HH:mm น.')}
                                                    </Text>
                                                </div>
                                            </div>

                                            {/* Total Section */}
                                            <div style={ordersStyles.totalSection}>
                                                <Text style={ordersStyles.totalLabel}>ยอดรวม</Text>
                                                <div style={ordersStyles.totalAmount} className="orders-total-amount">
                                                    {formatCurrency(Number(order.total_amount))}
                                                </div>
                                            </div>
                                            
                                            {/* Action Button */}
                                            <Button 
                                                type="primary" 
                                                ghost 
                                                icon={<EyeOutlined />} 
                                                style={ordersStyles.actionButton}
                                                className="scale-hover"
                                            >
                                                ดูรายละเอียด
                                            </Button>
                                        </div>
                                    </article>
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
            </main>
        </div>
    );
}
