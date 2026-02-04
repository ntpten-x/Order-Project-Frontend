"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Typography, Row, Col, Card, Tag, Button, Divider, Avatar, Space, Skeleton } from "antd";
import { CheckCircleOutlined, ShopOutlined, ShoppingOutlined, RocketOutlined, UserOutlined } from "@ant-design/icons";
import PageContainer from "@/components/ui/page/PageContainer";
import PageSection from "@/components/ui/page/PageSection";
import UIPageHeader from "@/components/ui/page/PageHeader";
import UIEmptyState from "@/components/ui/states/EmptyState";
import { ordersService } from "../../../../services/pos/orders.service";
import { SalesOrderItem } from "../../../../types/api/pos/salesOrderItem";
import { OrderStatus, OrderType, SalesOrder } from "../../../../types/api/pos/salesOrder";
import { itemsStyles, itemsColors, itemsResponsiveStyles } from "../../../../theme/pos/items/style";
import { formatCurrency } from "../../../../utils/orders";
import { useGlobalLoadingDispatch } from "../../../../contexts/pos/GlobalLoadingContext";
import { useSocket } from "../../../../hooks/useSocket";
import { useRealtimeRefresh } from "../../../../utils/pos/realtime";
import dayjs from "dayjs";
import 'dayjs/locale/th';
import { isEqual } from "lodash";

const { Text } = Typography;
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
    const { showLoading, hideLoading } = useGlobalLoadingDispatch();
    const { socket } = useSocket();

    const fetchServedItems = useCallback(async (initial = false) => {
        try {
            if (initial) {
                showLoading("กำลังโหลดรายการรอชำระเงิน...");
                setIsLoading(true);
            }
            
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

            setOrderGroups(prev => {
                if (isEqual(prev, groups)) return prev;
                return groups;
            });
        } catch {
            // Silently handle error or show notification if critical
        } finally {
            if (initial) {
                setIsLoading(false);
                hideLoading();
            }
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
        <>
            <style jsx global>{itemsResponsiveStyles}</style>
            <div style={itemsStyles.container}>
                <UIPageHeader
                    title="รายการรอชำระเงิน"
                    subtitle="Waiting For Payment Orders"
                    onBack={() => router.back()}
                    icon={<CheckCircleOutlined style={{ fontSize: 20 }} />}
                    actions={
                        <Button onClick={() => fetchServedItems(true)} loading={isLoading}>
                            รีเฟรช
                        </Button>
                    }
                />

                <PageContainer>
                    <PageSection>
                {isLoading ? (
                    <Row gutter={[16, 16]}>
                        {Array.from({ length: 6 }).map((_, index) => (
                            <Col xs={24} sm={12} lg={8} key={`skeleton-${index}`}>
                                <Card style={itemsStyles.card}>
                                    <Skeleton active paragraph={{ rows: 3 }} />
                                </Card>
                            </Col>
                        ))}
                    </Row>
                ) : orderGroups.length === 0 ? (
                    <UIEmptyState title="ไม่มีรายการรอชำระเงิน" />
                ) : (
                    <Row gutter={[16, 16]}>
                        {orderGroups.map((group, index) => (
                            <Col xs={24} sm={12} lg={8} key={group.order.id}>
                                <Card 
                                    hoverable 
                                    className={`items-card-mobile items-card-animate items-card-delay-${(index % 3) + 1}`}
                                    style={itemsStyles.card}
                                    bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                                >
                                    {/* Card Header */}
                                    <div style={itemsStyles.cardHeader} className="items-card-header-mobile">
                                        <div style={itemsStyles.cardHeaderLeft}>
                                            <Tag color="geekblue" style={itemsStyles.cardTimeTag}>
                                                {dayjs(group.order.create_date).format('HH:mm')}
                                            </Tag>
                                            <div style={itemsStyles.cardOrderInfo}>
                                                {getOrderIcon(group.order.order_type)}
                                                <Text strong style={{ fontSize: 16 }}>
                                                    {getOrderTypeUserFriendly(group.order.order_type, group.order.table)}
                                                </Text>
                                            </div>
                                            <Space size={4} orientation="vertical" style={{ marginTop: 4 }}>
                                                <Text type="secondary" style={itemsStyles.cardOrderNo}>#{group.order.order_no}</Text>
                                                {group.order.created_by_id && (
                                                    <Text type="secondary" style={{ fontSize: 11 }}>
                                                        <UserOutlined style={{ marginRight: 4 }} />
                                                        {group.order.created_by_id}
                                                    </Text>
                                                )}
                                            </Space>
                                        </div>
                                        <Text strong style={itemsStyles.cardTotal} className="items-card-total-mobile">
                                            {formatCurrency(group.totalAmount)}
                                        </Text>
                                    </div>
                                    
                                    <Divider style={{ margin: '12px 0' }} />
                                    
                                    {/* Items List */}
                                    <div style={itemsStyles.itemsList}>
                                        {group.items.map((item, idx) => (
                                            <div key={idx} style={itemsStyles.itemRow} className="items-item-row-mobile">
                                                <div style={itemsStyles.itemLeft} className="items-item-left-mobile">
                                                    {item.product?.img_url ? (
                                                        <Avatar 
                                                            shape="square" 
                                                            size={40} 
                                                            src={item.product.img_url} 
                                                            style={itemsStyles.itemImage}
                                                        />
                                                    ) : (
                                                        <div style={itemsStyles.itemImagePlaceholder}>
                                                            <ShopOutlined style={{ color: itemsColors.textLight }} />
                                                        </div>
                                                    )}
                                                    
                                                    <div style={itemsStyles.itemInfo}>
                                                        <div style={itemsStyles.itemNameRow}>
                                                            <Tag style={itemsStyles.itemQuantityTag}>x{item.quantity}</Tag>
                                                            <Text strong style={itemsStyles.itemName} ellipsis>{item.product?.display_name}</Text>
                                                        </div>
                                                        <Text type="secondary" style={itemsStyles.itemPrice}>
                                                            {formatCurrency(item.price)}
                                                        </Text>
                                                        {item.notes && (
                                                            <Text type="secondary" style={itemsStyles.itemNotes}>
                                                                * {item.notes}
                                                            </Text>
                                                        )}
                                                    </div>
                                                </div>
                                                <Text strong style={itemsStyles.itemTotal} className="items-item-total-mobile">
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
                                        style={itemsStyles.paymentButton}
                                        className="items-payment-button-mobile"
                                        onClick={() => handlePaymentClick(group.order.id, group.order.order_type as OrderType)}
                                    >
                                        ชำระเงิน
                                    </Button>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}
                    </PageSection>
                </PageContainer>
            </div>
        </>
    );
}
