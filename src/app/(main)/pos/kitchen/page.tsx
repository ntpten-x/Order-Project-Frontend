"use client";

import React, { useEffect, useState, useContext, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Typography, Card, Button, Row, Col, Tag, Badge, Empty, Spin, Switch, message, Space, Tooltip, Divider } from "antd";
import { 
    CheckOutlined, 
    ClockCircleOutlined, 
    FireOutlined, 
    SoundOutlined, 
    ReloadOutlined, 
    AppstoreOutlined,
    NotificationOutlined,
    ThunderboltOutlined,
    DoubleRightOutlined
} from "@ant-design/icons";
import { SocketContext } from "../../../../contexts/SocketContext";
import { ordersService } from "../../../../services/pos/orders.service";
import { SalesOrderItem, ItemStatus } from "../../../../types/api/pos/salesOrderItem";
import { posPageStyles, posColors } from "@/theme/pos";
import { useGlobalLoading } from "@/contexts/pos/GlobalLoadingContext";
import { getCsrfTokenCached } from "@/utils/pos/csrf";
import dayjs from "dayjs";
import 'dayjs/locale/th';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
dayjs.locale('th');

const { Title, Text } = Typography;

// Timer color helper with glow/gradient intent
const getUrgencyConfig = (createdAt: string): { 
    color: string; 
    bgColor: string; 
    urgency: 'low' | 'medium' | 'high';
    label: string 
} => {
    const minutes = dayjs().diff(dayjs(createdAt), 'minute');
    if (minutes < 5) return { 
        color: '#52c41a', 
        bgColor: 'rgba(82, 196, 26, 0.1)', 
        urgency: 'low',
        label: 'ปกติ'
    };
    if (minutes < 15) return { 
        color: '#faad14', 
        bgColor: 'rgba(250, 173, 20, 0.1)', 
        urgency: 'medium',
        label: 'ล่าช้า'
    };
    return { 
        color: '#ff4d4f', 
        bgColor: 'rgba(255, 77, 79, 0.15)', 
        urgency: 'high',
        label: 'ด่วนมาก'
    };
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
    const { showLoading, hideLoading } = useGlobalLoading();
    const queryClient = useQueryClient();
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [filterStatus, setFilterStatus] = useState<ItemStatus | 'all'>('all');

    const { data: allItems = [], isLoading, refetch } = useQuery<SalesOrderItem[]>({
        queryKey: ["orderItems", "kitchen"],
        queryFn: async () => {
            const items = await ordersService.getItems();
            return items.filter((item: SalesOrderItem) =>
                item.status !== ItemStatus.Served &&
                item.status !== ItemStatus.Cancelled
            );
        },
        staleTime: 2000,
    });

    // Group items by order
    const groupedOrders = useMemo((): GroupedOrder[] => {
        const grouped: Record<string, GroupedOrder> = {};
        
        const filteredItems = filterStatus === 'all' 
            ? allItems.filter(item => item.status !== ItemStatus.Served && item.status !== ItemStatus.Cancelled)
            : allItems.filter(item => item.status === filterStatus);

        filteredItems.forEach(item => {
            const orderId = item.order_id;
            if (!grouped[orderId]) {
                const orderDate = item.order?.create_date || new Date().toISOString();
                grouped[orderId] = {
                    order_id: orderId,
                    order_no: item.order?.order_no || 'N/A',
                    table_name: item.order?.table?.table_name || null,
                    order_type: item.order?.order_type || 'Unknown',
                    created_at: orderDate,
                    items: [],
                };
            }
            grouped[orderId].items.push(item);
        });

        // Sort by oldest first (those waiting longest)
        return Object.values(grouped).sort((a, b) => 
            dayjs(a.created_at).valueOf() - dayjs(b.created_at).valueOf()
        );
    }, [allItems, filterStatus]);

    // Socket listeners for real-time updates
    useEffect(() => {
        if (!socket) return;

        const handleOrderCreate = (newOrder: any) => {
            refetch();
            if (soundEnabled) {
                playNotificationSound();
                message.info(`ออเดอร์ใหม่: #${newOrder.order_no}`);
            }
        };

        const handleOrderUpdate = () => {
            refetch();
        };

        socket.on('orders:create', handleOrderCreate);
        socket.on('orders:update', handleOrderUpdate);

        return () => {
            socket.off('orders:create', handleOrderCreate);
            socket.off('orders:update', handleOrderUpdate);
        };
    }, [socket, soundEnabled, refetch]);

    const playNotificationSound = () => {
        try {
            // Using a system beep or data URI if .mp3 not found
            const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
            audio.volume = 0.5;
            audio.play().catch(() => {});
        } catch {}
    };

    const updateItemStatus = async (itemId: string, newStatus: ItemStatus) => {
        try {
            showLoading("กำลังอัปเดต...");
            const csrfToken = await getCsrfTokenCached();
            await ordersService.updateItemStatus(itemId, newStatus, undefined, csrfToken);
            queryClient.setQueryData<SalesOrderItem[]>(["orderItems", "kitchen"], (prev = []) =>
                prev
                    .map(item => (item.id === itemId ? { ...item, status: newStatus } : item))
                    .filter(item => item.status !== ItemStatus.Served && item.status !== ItemStatus.Cancelled)
            );
            message.success("อัปเดตสถานะสำเร็จ");
        } catch {
            message.error("ไม่สามารถอัปเดตสถานะได้");
        } finally {
            hideLoading();
        }
    };

    const serveAllItems = async (orderId: string) => {
        try {
            showLoading("กำลังเสิร์ฟทั้งหมด...");
            const order = groupedOrders.find(o => o.order_id === orderId);
            if (!order) return;

            const csrfToken = await getCsrfTokenCached();
            const updatePromises = order.items.map(item => 
                ordersService.updateItemStatus(item.id, ItemStatus.Served, undefined, csrfToken)
            );

            await Promise.all(updatePromises);
            
            queryClient.setQueryData<SalesOrderItem[]>(["orderItems", "kitchen"], (prev = []) =>
                prev.filter(item => item.order_id !== orderId)
            );
            message.success(`เสิร์ฟออเดอร์ #${order.order_no} ทั้งหมดแล้ว`);
            refetch();
        } catch {
            message.error("เกิดข้อผิดพลาดในการเสิร์ฟทั้งหมด");
        } finally {
            hideLoading();
        }
    };

    const getStatusColor = (status: ItemStatus) => {
        switch (status) {
            case ItemStatus.Pending: return '#faad14';
            case ItemStatus.Cooking: return '#1890ff';
            case ItemStatus.Served: return '#52c41a';
            default: return '#8c8c8c';
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
        <div style={posPageStyles.kitchenContainer}>
            {/* Header */}
            <div style={posPageStyles.kitchenHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ 
                        width: 50, 
                        height: 50, 
                        borderRadius: 12, 
                        background: 'linear-gradient(135deg, #ff6b35 0%, #ff9f1c 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(255, 107, 53, 0.4)'
                    }}>
                        <FireOutlined style={{ fontSize: 28, color: '#fff' }} />
                    </div>
                    <div>
                        <Title level={2} style={{ margin: 0, color: '#fff', fontSize: 24 }}>Kitchen Display</Title>
                        <Space split={<Divider type="vertical" style={{ borderColor: 'rgba(255,255,255,0.2)' }} />}>
                            <Text style={{ color: 'rgba(255,255,255,0.7)' }}>จอครัวอัจฉริยะ</Text>
                            <Badge status={isConnected ? 'success' : 'error'} text={
                                <Text style={{ color: isConnected ? '#52c41a' : '#ff4d4f', fontSize: 12 }}>
                                    {isConnected ? 'LIVE' : 'OFFLINE'}
                                </Text>
                            } />
                        </Space>
                    </div>
                </div>

                <Space wrap>
                    <div style={{ 
                        background: 'rgba(255,255,255,0.05)', 
                        padding: '4px 8px', 
                        borderRadius: 12, 
                        border: '1px solid rgba(255,255,255,0.1)',
                        display: 'flex',
                        gap: 8
                    }}>
                        <Button 
                            type="text"
                            onClick={() => setFilterStatus('all')}
                            style={{ 
                                color: filterStatus === 'all' ? '#fff' : 'rgba(255,255,255,0.5)',
                                background: filterStatus === 'all' ? 'rgba(255,255,255,0.1)' : 'transparent',
                                borderRadius: 8
                            }}
                        >
                            ทั้งหมด ({allItems.length})
                        </Button>
                        <Button 
                            type="text"
                            onClick={() => setFilterStatus(ItemStatus.Pending)}
                            style={{ 
                                color: filterStatus === ItemStatus.Pending ? '#faad14' : 'rgba(255,255,255,0.5)',
                                background: filterStatus === ItemStatus.Pending ? 'rgba(250, 173, 20, 0.1)' : 'transparent',
                                borderRadius: 8
                            }}
                        >
                            รอทำ ({pendingCount})
                        </Button>
                        <Button 
                            type="text"
                            onClick={() => setFilterStatus(ItemStatus.Cooking)}
                            style={{ 
                                color: filterStatus === ItemStatus.Cooking ? '#1890ff' : 'rgba(255,255,255,0.5)',
                                background: filterStatus === ItemStatus.Cooking ? 'rgba(24, 144, 255, 0.1)' : 'transparent',
                                borderRadius: 8
                            }}
                        >
                            กำลังปรุง ({cookingCount})
                        </Button>
                    </div>

                    <Space size={12}>
                        <Tooltip title="เปิด/ปิดเสียงแจ้งเตือน">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.7)' }}>
                                <SoundOutlined />
                                <Switch 
                                    size="small"
                                    checked={soundEnabled} 
                                    onChange={setSoundEnabled}
                                />
                            </div>
                        </Tooltip>
                        <Button 
                            icon={<ReloadOutlined />} 
                            onClick={() => fetchItems()} 
                            loading={isLoading}
                            style={{ 
                                background: 'rgba(255,255,255,0.1)', 
                                borderColor: 'transparent', 
                                color: '#fff',
                                borderRadius: 10
                            }}
                        >
                            รีเฟรช
                        </Button>
                    </Space>
                </Space>
            </div>

            {/* Orders Grid */}
            {isLoading ? (
                <div style={{ textAlign: 'center', padding: 100 }}>
                    <Spin size="large" tip="กำลังโหลดออเดอร์..." />
                </div>
            ) : groupedOrders.length === 0 ? (
                <div style={{ 
                    textAlign: 'center', 
                    padding: 100,
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: 24,
                    border: '2px dashed rgba(255,255,255,0.05)'
                }}>
                    <Empty 
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={<Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 18 }}>ไม่มีออเดอร์ค้างในครัว</Text>} 
                    />
                </div>
            ) : (
                <Row gutter={[20, 20]}>
                    {groupedOrders.map((order) => {
                        const urgency = getUrgencyConfig(order.created_at);
                        return (
                            <Col xs={24} sm={12} lg={8} xl={6} key={order.order_id}>
                                <div style={{
                                    ...posPageStyles.kitchenGlassCard,
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    borderTop: `4px solid ${urgency.color}`,
                                    boxShadow: urgency.urgency === 'high' ? `0 0 20px ${urgency.bgColor}` : posPageStyles.kitchenGlassCard.boxShadow
                                }}>
                                    {/* Order Header */}
                                    <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                            <div>
                                                <Title level={4} style={{ margin: 0, color: '#fff', fontSize: 20 }}>#{order.order_no}</Title>
                                                <Space style={{ marginTop: 4 }}>
                                                    {order.table_name ? (
                                                        <Tag color="blue" style={{ borderRadius: 4, margin: 0 }}>โต๊ะ: {order.table_name}</Tag>
                                                    ) : (
                                                        <Tag color="purple" style={{ borderRadius: 4, margin: 0 }}>{order.order_type}</Tag>
                                                    )}
                                                </Space>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <Tag 
                                                    icon={<ClockCircleOutlined />} 
                                                    style={{ 
                                                        background: urgency.bgColor, 
                                                        color: urgency.color, 
                                                        border: 'none',
                                                        borderRadius: 6,
                                                        fontWeight: 600,
                                                        margin: 0
                                                    }}
                                                >
                                                    {dayjs(order.created_at).fromNow(true)}
                                                </Tag>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Items List */}
                                    <div style={{ flex: 1, padding: 12, maxHeight: 400, overflowY: 'auto' }}>
                                        {order.items.map((item) => (
                                            <div 
                                                key={item.id} 
                                                style={{
                                                    background: 'rgba(255,255,255,0.03)',
                                                    borderRadius: 12,
                                                    padding: 12,
                                                    marginBottom: 10,
                                                    border: `1px solid ${item.status === ItemStatus.Cooking ? 'rgba(24, 144, 255, 0.3)' : 'rgba(255,255,255,0.05)'}`,
                                                    position: 'relative'
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                            <div style={{ 
                                                                fontSize: 18, 
                                                                fontWeight: 800, 
                                                                color: item.status === ItemStatus.Cooking ? '#1890ff' : '#fff',
                                                                minWidth: 35
                                                            }}>
                                                                {item.quantity}x
                                                            </div>
                                                            <Text style={{ fontSize: 15, color: '#f1f5f9', fontWeight: 500 }}>
                                                                {item.product?.display_name || 'สินค้า'}
                                                            </Text>
                                                        </div>
                                                        
                                                        {item.notes && (
                                                            <div style={{ 
                                                                marginTop: 6, 
                                                                padding: '4px 8px', 
                                                                background: 'rgba(250, 173, 20, 0.1)', 
                                                                borderRadius: 6,
                                                                borderLeft: '3px solid #faad14'
                                                            }}>
                                                                <Text style={{ color: '#faad14', fontSize: 13 }}>{item.notes}</Text>
                                                            </div>
                                                        )}

                                                        <div style={{ marginTop: 8 }}>
                                                            <Badge 
                                                                status={item.status === ItemStatus.Cooking ? 'processing' : 'default'} 
                                                                text={
                                                                    <Text style={{ 
                                                                        color: getStatusColor(item.status as ItemStatus), 
                                                                        fontSize: 12,
                                                                        fontWeight: 600
                                                                    }}>
                                                                        {getStatusLabel(item.status as ItemStatus).toUpperCase()}
                                                                    </Text>
                                                                } 
                                                            />
                                                        </div>
                                                    </div>

                                                    <div style={{ marginLeft: 12, display: 'flex', alignItems: 'center' }}>
                                                        {item.status === ItemStatus.Pending && (
                                                            <Button 
                                                                type="primary"
                                                                shape="circle"
                                                                icon={<ThunderboltOutlined />}
                                                                onClick={() => updateItemStatus(item.id, ItemStatus.Cooking)}
                                                                style={{ background: '#1890ff', boxShadow: '0 4px 10px rgba(24, 144, 255, 0.3)' }}
                                                            />
                                                        )}
                                                        {item.status === ItemStatus.Cooking && (
                                                            <Button 
                                                                type="primary"
                                                                shape="circle"
                                                                icon={<CheckOutlined />}
                                                                onClick={() => updateItemStatus(item.id, ItemStatus.Served)}
                                                                style={{ background: '#52c41a', borderColor: '#52c41a', boxShadow: '0 4px 10px rgba(82, 196, 26, 0.3)' }}
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Order Footer */}
                                    <div style={{ padding: 12, background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                        <Button 
                                            block 
                                            type="primary" 
                                            icon={<DoubleRightOutlined />}
                                            onClick={() => serveAllItems(order.order_id)}
                                            style={{ 
                                                background: 'rgba(82, 196, 26, 0.15)', 
                                                color: '#52c41a', 
                                                borderColor: 'rgba(82, 196, 26, 0.3)',
                                                height: 40,
                                                borderRadius: 10,
                                                fontWeight: 600
                                            }}
                                        >
                                            เสิร์ฟทั้งหมด
                                        </Button>
                                    </div>
                                </div>
                            </Col>
                        );
                    })}
                </Row>
            )}

            {/* Float Stats Bar */}
            <div style={{
                position: 'fixed',
                bottom: 24,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1000,
                background: 'rgba(15, 23, 42, 0.8)',
                backdropFilter: 'blur(20px)',
                padding: '12px 24px',
                borderRadius: 50,
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                gap: 24,
                alignItems: 'center',
                boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#faad14' }} />
                    <Text style={{ color: '#fff' }}>รอทำ: <span style={{ fontWeight: 800, fontSize: 18 }}>{pendingCount}</span></Text>
                </div>
                <div style={{ height: 20, width: 1, background: 'rgba(255,255,255,0.1)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#1890ff', boxShadow: '0 0 10px #1890ff' }} />
                    <Text style={{ color: '#fff' }}>กำลังทำ: <span style={{ fontWeight: 800, fontSize: 18 }}>{cookingCount}</span></Text>
                </div>
                <div style={{ height: 20, width: 1, background: 'rgba(255,255,255,0.1)' }} />
                <Button 
                    type="text" 
                    icon={<ReloadOutlined style={{ color: '#fff' }} />} 
                    onClick={() => fetchItems()}
                    style={{ color: '#fff' }}
                >
                    REFRESH
                </Button>
            </div>
        </div>
    );
}
