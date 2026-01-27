"use client";

import React, { useEffect, useState, useContext, useMemo, useCallback } from "react";
import { Typography, Card, Button, Row, Col, Tag, Badge, Empty, Spin, Switch, message, Space, Tooltip } from "antd";
import { CheckOutlined, ClockCircleOutlined, FireOutlined, SoundOutlined, ReloadOutlined, AppstoreOutlined } from "@ant-design/icons";
import { SocketContext } from "../../../../contexts/SocketContext";
import { ordersService } from "../../../../services/pos/orders.service";
import { SalesOrderItem, ItemStatus } from "../../../../types/api/pos/salesOrderItem";
import dayjs from "dayjs";
import 'dayjs/locale/th';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
dayjs.locale('th');

const { Title, Text } = Typography;

// Styles
const pageStyles = {
    container: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        padding: 24,
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        flexWrap: 'wrap' as const,
        gap: 16,
    },
    card: {
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    },
    itemCard: {
        marginBottom: 8,
        borderRadius: 8,
        transition: 'all 0.3s ease',
    },
};

// Timer color helper
const getTimerColor = (createdAt: string): { color: string; urgency: 'low' | 'medium' | 'high' } => {
    const minutes = dayjs().diff(dayjs(createdAt), 'minute');
    if (minutes < 5) return { color: '#52c41a', urgency: 'low' };
    if (minutes < 10) return { color: '#faad14', urgency: 'medium' };
    return { color: '#ff4d4f', urgency: 'high' };
};

interface GroupedOrder {
    order_id: string;
    order_no: string;
    table_name: string | null;
    order_type: string;
    created_at: string;
    items: SalesOrderItem[];
}

export default function KitchenDisplayPage() {
    const { socket, isConnected } = useContext(SocketContext);
    const [allItems, setAllItems] = useState<SalesOrderItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [filterStatus, setFilterStatus] = useState<ItemStatus | 'all'>('all');

    // Group items by order
const groupedOrders = useMemo((): GroupedOrder[] => {
        const grouped: Record<string, GroupedOrder> = {};
        
        const filteredItems = filterStatus === 'all' 
            ? allItems.filter(item => item.status !== ItemStatus.Served)
            : allItems.filter(item => item.status === filterStatus);

        filteredItems.forEach(item => {
            const orderId = item.order_id;
            if (!grouped[orderId]) {
                grouped[orderId] = {
                    order_id: orderId,
                    order_no: item.order?.order_no || 'N/A',
                    table_name: item.order?.table?.table_name || null,
                    order_type: item.order?.order_type || 'Unknown',
                    created_at: item.order?.create_date || new Date().toISOString(),
                    items: [],
                };
            }
            grouped[orderId].items.push(item);
        });

        // Sort by oldest first
        return Object.values(grouped).sort((a, b) => 
            dayjs(a.created_at).valueOf() - dayjs(b.created_at).valueOf()
        );
    }, [allItems, filterStatus]);

    const fetchItems = useCallback(async () => {
        setIsLoading(true);
        try {
            // Fetch Pending and Cooking items
            const items = await ordersService.getItems();
            setAllItems(items.filter((item: SalesOrderItem) => item.status !== ItemStatus.Served));
        } catch (error) {
            console.error("Fetch kitchen items error:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    // Socket listeners for real-time updates
    useEffect(() => {
        if (!socket) return;

        const handleOrderUpdate = (data: { action?: string }) => {
            console.log("Order update received:", data);
            fetchItems();
            if (soundEnabled && data.action === 'new_order') {
                playNotificationSound();
            }
        };

        const handleItemUpdate = (data: { item?: SalesOrderItem }) => {
            console.log("Item update received:", data);
            if (data.item) {
                const item = data.item; // Capture for type narrowing
                setAllItems(prev => {
                    const index = prev.findIndex(i => i.id === item.id);
                    if (index >= 0) {
                        const updated = [...prev];
                        updated[index] = item;
                        return updated;
                    }
                    return prev;
                });
            } else {
                fetchItems();
            }
        };

        socket.on('order:created', handleOrderUpdate);
        socket.on('order:updated', handleOrderUpdate);
        socket.on('item:updated', handleItemUpdate);

        return () => {
            socket.off('order:created', handleOrderUpdate);
            socket.off('order:updated', handleOrderUpdate);
            socket.off('item:updated', handleItemUpdate);
        };
    }, [socket, soundEnabled, fetchItems]);

    const playNotificationSound = () => {
        try {
            const audio = new Audio('/sounds/notification.mp3');
            audio.play().catch(() => {});
        } catch {}
    };

    const updateItemStatus = async (itemId: string, newStatus: ItemStatus) => {
        try {
            await ordersService.updateItemStatus(itemId, newStatus);
            setAllItems(prev => 
                prev.map(item => 
                    item.id === itemId ? { ...item, status: newStatus } : item
                )
            );
            message.success("อัปเดตสถานะสำเร็จ");
        } catch {
            message.error("ไม่สามารถอัปเดตสถานะได้");
        }
    };

    const getStatusColor = (status: ItemStatus) => {
        switch (status) {
            case ItemStatus.Pending: return 'orange';
            case ItemStatus.Cooking: return 'processing';
            case ItemStatus.Served: return 'green';
            default: return 'default';
        }
    };

    const getStatusLabel = (status: ItemStatus) => {
        switch (status) {
            case ItemStatus.Pending: return 'รอทำ';
            case ItemStatus.Cooking: return 'กำลังทำ';
            case ItemStatus.Served: return 'เสร็จแล้ว';
            default: return status;
        }
    };

    const pendingCount = allItems.filter(i => i.status === ItemStatus.Pending).length;
    const cookingCount = allItems.filter(i => i.status === ItemStatus.Cooking).length;

    return (
        <div style={pageStyles.container}>
            {/* Header */}
            <div style={pageStyles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <FireOutlined style={{ fontSize: 36, color: '#ff6b35' }} />
                    <div>
                        <Title level={2} style={{ margin: 0, color: '#fff' }}>Kitchen Display</Title>
                        <Text style={{ color: 'rgba(255,255,255,0.7)' }}>จอครัว - แสดงออเดอร์ที่รอทำ</Text>
                    </div>
                    <Badge status={isConnected ? 'success' : 'error'} text={<Text style={{ color: '#fff' }}>{isConnected ? 'เชื่อมต่อแล้ว' : 'ไม่ได้เชื่อมต่อ'}</Text>} />
                </div>

                <Space wrap>
                    <Badge count={pendingCount} style={{ backgroundColor: '#faad14' }}>
                        <Button 
                            type={filterStatus === ItemStatus.Pending ? 'primary' : 'default'}
                            onClick={() => setFilterStatus(filterStatus === ItemStatus.Pending ? 'all' : ItemStatus.Pending)}
                            style={{ background: filterStatus === ItemStatus.Pending ? '#faad14' : 'rgba(255,255,255,0.1)', borderColor: '#faad14', color: '#fff' }}
                        >
                            รอทำ
                        </Button>
                    </Badge>
                    <Badge count={cookingCount} style={{ backgroundColor: '#1890ff' }}>
                        <Button 
                            type={filterStatus === ItemStatus.Cooking ? 'primary' : 'default'}
                            onClick={() => setFilterStatus(filterStatus === ItemStatus.Cooking ? 'all' : ItemStatus.Cooking)}
                            style={{ background: filterStatus === ItemStatus.Cooking ? '#1890ff' : 'rgba(255,255,255,0.1)', borderColor: '#1890ff', color: '#fff' }}
                        >
                            กำลังทำ
                        </Button>
                    </Badge>
                    <Button 
                        icon={<AppstoreOutlined />}
                        onClick={() => setFilterStatus('all')}
                        type={filterStatus === 'all' ? 'primary' : 'default'}
                        style={{ background: filterStatus === 'all' ? '#52c41a' : 'rgba(255,255,255,0.1)', borderColor: '#52c41a', color: '#fff' }}
                    >
                        ทั้งหมด
                    </Button>
                    <Tooltip title="เปิด/ปิดเสียงแจ้งเตือน">
                        <Switch 
                            checked={soundEnabled} 
                            onChange={setSoundEnabled}
                            checkedChildren={<SoundOutlined />}
                            unCheckedChildren={<SoundOutlined />}
                        />
                    </Tooltip>
                    <Button icon={<ReloadOutlined />} onClick={fetchItems} loading={isLoading} style={{ background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}>
                        รีเฟรช
                    </Button>
                </Space>
            </div>

            {/* Orders Grid */}
            {isLoading ? (
                <div style={{ textAlign: 'center', padding: 100 }}>
                    <Spin size="large" />
                </div>
            ) : groupedOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 100 }}>
                    <Empty description={<Text style={{ color: 'rgba(255,255,255,0.7)' }}>ไม่มีออเดอร์ที่รอทำ</Text>} />
                </div>
            ) : (
                <Row gutter={[16, 16]}>
                    {groupedOrders.map((order) => {
                        const timerInfo = getTimerColor(order.created_at);
                        return (
                            <Col xs={24} sm={12} lg={8} xl={6} key={order.order_id}>
                                <Card
                                    style={{
                                        ...pageStyles.card,
                                        borderTop: `4px solid ${timerInfo.color}`,
                                        background: timerInfo.urgency === 'high' ? 'rgba(255,77,79,0.1)' : '#fff',
                                    }}
                                    title={
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <Text strong style={{ fontSize: 18 }}>#{order.order_no}</Text>
                                                {order.table_name && <Tag color="blue" style={{ marginLeft: 8 }}>{order.table_name}</Tag>}
                                            </div>
                                            <Tooltip title={dayjs(order.created_at).format('HH:mm:ss')}>
                                                <Tag icon={<ClockCircleOutlined />} color={timerInfo.color} style={{ fontSize: 14 }}>
                                                    {dayjs(order.created_at).fromNow()}
                                                </Tag>
                                            </Tooltip>
                                        </div>
                                    }
                                    size="small"
                                >
                                    {order.items.map((item) => (
                                        <div 
                                            key={item.id} 
                                            style={{
                                                ...pageStyles.itemCard,
                                                padding: 12,
                                                background: (item.status as ItemStatus) === ItemStatus.Cooking ? '#e6f7ff' : '#fafafa',
                                                border: `1px solid ${(item.status as ItemStatus) === ItemStatus.Cooking ? '#91d5ff' : '#f0f0f0'}`,
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <Text strong style={{ fontSize: 16 }}>{item.quantity}x</Text>
                                                    <Text style={{ fontSize: 14 }}>{item.product?.display_name || 'สินค้า'}</Text>
                                                </div>
                                                {item.notes && (
                                                    <Text type="warning" style={{ fontSize: 12, display: 'block' }}>📝 {item.notes}</Text>
                                                )}
                                                <Tag color={getStatusColor(item.status as ItemStatus)} style={{ marginTop: 4 }}>
                                                    {getStatusLabel(item.status as ItemStatus)}
                                                </Tag>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                {(item.status as ItemStatus) === ItemStatus.Pending && (
                                                    <Button 
                                                        type="primary" 
                                                        size="small"
                                                        style={{ background: '#1890ff' }}
                                                        onClick={() => updateItemStatus(item.id, ItemStatus.Cooking)}
                                                    >
                                                        เริ่มทำ
                                                    </Button>
                                                )}
                                                {(item.status as ItemStatus) === ItemStatus.Cooking && (
                                                    <Button 
                                                        type="primary" 
                                                        size="small"
                                                        icon={<CheckOutlined />}
                                                        style={{ background: '#52c41a', borderColor: '#52c41a' }}
                                                        onClick={() => updateItemStatus(item.id, ItemStatus.Served)}
                                                    >
                                                        เสร็จ
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </Card>
                            </Col>
                        );
                    })}
                </Row>
            )}
        </div>
    );
}
