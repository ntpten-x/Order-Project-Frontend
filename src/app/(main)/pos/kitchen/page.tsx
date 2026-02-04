'use client';

import React, { useEffect, useState, useContext, useMemo, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Typography, Button, Row, Col, Tag, Empty, Spin, message, Space, Tooltip } from "antd";
import { 
    CheckOutlined, 
    ClockCircleOutlined, 
    FireOutlined, 
    SoundOutlined, 
    ReloadOutlined,
    ThunderboltOutlined,
    DoubleRightOutlined,
    NotificationOutlined,
    WifiOutlined
} from "@ant-design/icons";
import { SocketContext } from "../../../../contexts/SocketContext";
import { ordersService } from "../../../../services/pos/orders.service";
import { SalesOrderItem, ItemStatus } from "../../../../types/api/pos/salesOrderItem";
import { useGlobalLoadingDispatch } from "../../../../contexts/pos/GlobalLoadingContext";
import { getCsrfTokenCached } from "../../../../utils/pos/csrf";
import dayjs from "dayjs";
import 'dayjs/locale/th';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
dayjs.locale('th');

const { Title, Text } = Typography;

// KDS Specific Styles
const kdsStyles = {
    container: {
        minHeight: '100vh',
        background: '#0f172a', // Slate 900
        padding: '24px',
        color: '#f8fafc',
        fontFamily: "var(--font-sans), 'Sarabun', sans-serif"
    },
    header: {
        marginBottom: 32,
        background: '#1e293b',
        padding: '16px 24px',
        borderRadius: 20,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        border: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    },
    card: (urgencyColor: string, isHighUrgency: boolean) => ({
        background: '#1e293b',
        borderRadius: 16,
        overflow: 'hidden',
        border: `2px solid ${isHighUrgency ? urgencyColor : 'rgba(255,255,255,0.05)'}`,
        boxShadow: isHighUrgency 
            ? `0 0 0 2px ${urgencyColor}, 0 10px 15px -3px rgba(0, 0, 0, 0.1)` 
            : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column' as const,
        transition: 'all 0.3s ease',
        animation: isHighUrgency ? 'pulse-border 2s infinite' : 'none'
    }),
    itemRow: (status: ItemStatus) => ({
        padding: '12px',
        background: status === ItemStatus.Cooking ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.03)',
        marginBottom: 8,
        borderRadius: 8,
        borderLeft: `4px solid ${
            status === ItemStatus.Cooking ? '#10b981' : 
            status === ItemStatus.Served ? '#64748b' : '#f59e0b'
        }`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
    })
};

// Urgency Logic
const getUrgencyConfig = (createdAt: string) => {
    const minutes = dayjs().diff(dayjs(createdAt), 'minute');
    if (minutes < 10) return { 
        color: '#10b981', // Emerald 500
        bgColor: 'rgba(16, 185, 129, 0.2)', 
        label: 'ปกติ',
        level: 1
    };
    if (minutes < 20) return { 
        color: '#f59e0b', // Amber 500
        bgColor: 'rgba(245, 158, 11, 0.2)', 
        label: 'เริ่มช้า',
        level: 2
    };
    return { 
        color: '#ef4444', // Red 500
        bgColor: 'rgba(239, 68, 68, 0.2)', 
        label: 'ด่วน!',
        level: 3
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
    const { showLoading, hideLoading } = useGlobalLoadingDispatch();
    const queryClient = useQueryClient();
    const [soundEnabled, setSoundEnabled] = useState(true);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [filterStatus, setFilterStatus] = useState<ItemStatus | 'all'>('all');

    // Initialize audio
    useEffect(() => {
        audioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
        audioRef.current.volume = 0.6;
    }, []);

    const playNotificationSound = useCallback(() => {
        if (soundEnabled && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(console.error);
        }
    }, [soundEnabled]);

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
        refetchInterval: 30000, // Safety polling every 30s
    });

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

        // Sort: Urgent (Oldest) First
        return Object.values(grouped).sort((a, b) => 
            dayjs(a.created_at).valueOf() - dayjs(b.created_at).valueOf()
        );
    }, [allItems, filterStatus]);

    // Socket Event Handlers
    useEffect(() => {
        if (!socket) return;

        const handleOrderCreate = (newOrder: { order_no: string }) => {
            console.log("New Order Received:", newOrder);
            refetch();
            playNotificationSound();
            message.open({
                type: 'info',
                content: `ออเดอร์ใหม่: #${newOrder.order_no}`,
                icon: <NotificationOutlined style={{ color: '#10b981' }} />,
                className: 'kds-notification',
                duration: 5,
            });
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
    }, [socket, refetch, playNotificationSound]);

    const updateItemStatus = async (itemId: string, newStatus: ItemStatus) => {
        try {
            // Optimistic Update
            queryClient.setQueryData<SalesOrderItem[]>(["orderItems", "kitchen"], (prev = []) =>
                prev.map(item => (item.id === itemId ? { ...item, status: newStatus } : item))
            );

            const csrfToken = await getCsrfTokenCached();
            await ordersService.updateItemStatus(itemId, newStatus, undefined, csrfToken);
        } catch {
            message.error("อัปเดตสถานะไม่สำเร็จ");
            refetch(); // Revert on failure
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
            
            // Remove locally immediately for snappy feel
            queryClient.setQueryData<SalesOrderItem[]>(["orderItems", "kitchen"], (prev = []) =>
                prev.filter(item => item.order_id !== orderId)
            );
            
            message.success(`เสิร์ฟออเดอร์ #${order.order_no} เรียบร้อย`);
        } catch {
            message.error("เกิดข้อผิดพลาดในการเสิร์ฟทั้งหมด");
            refetch();
        } finally {
            hideLoading();
        }
    };

    const pendingCount = allItems.filter(i => i.status === ItemStatus.Pending).length;
    const cookingCount = allItems.filter(i => i.status === ItemStatus.Cooking).length;

    return (
        <div style={kdsStyles.container}>
            <style jsx global>{`
                @keyframes pulse-border {
                    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
                    70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }
                .kds-notification .ant-message-custom-content {
                    display: flex;
                    align-items: center;
                    font-size: 16px;
                    font-weight: 600;
                }
            `}</style>
            
            {/* Header */}
            <div style={kdsStyles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                     <div style={{ 
                        width: 56, 
                        height: 56, 
                        borderRadius: 16, 
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', // Amber for Kitchen
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 20px rgba(245, 158, 11, 0.3)'
                    }}>
                        <FireOutlined style={{ fontSize: 30, color: '#fff' }} />
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Title level={2} style={{ margin: 0, color: '#fff', fontSize: 28, letterSpacing: '0.5px' }}>
                                KITCHEN DISPLAY
                            </Title>
                            {isConnected ? (
                                <Tag icon={<WifiOutlined />} color="#10b981" style={{ margin: 0, borderRadius: 12, padding: '2px 10px' }}>LIVE</Tag>
                            ) : (
                                <Tag icon={<WifiOutlined />} color="#ef4444" style={{ margin: 0, borderRadius: 12, padding: '2px 10px' }}>OFFLINE</Tag>
                            )}
                        </div>
                        <Text style={{ color: '#94a3b8', fontSize: 14 }}>ระบบจัดการออเดอร์ในครัวอัจฉริยะ</Text>
                    </div>
                </div>

                <Space size={16}>
                     {/* Stats Filter Buttons */}
                     <div style={{ background: '#020617', padding: 6, borderRadius: 14, display: 'flex', gap: 4 }}>
                        {['all', ItemStatus.Pending, ItemStatus.Cooking].map((status) => {
                            const isActive = filterStatus === status;
                            let count = allItems.length;
                            let label = 'ทั้งหมด';
                            let activeColor = '#3b82f6';

                            if (status === ItemStatus.Pending) {
                                count = pendingCount;
                                label = 'รอทำ';
                                activeColor = '#f59e0b';
                            } else if (status === ItemStatus.Cooking) {
                                count = cookingCount;
                                label = 'กำลังทำ';
                                activeColor = '#10b981';
                            }

                            return (
                                <Button
                                    key={status}
                                    type="text"
                                    onClick={() => setFilterStatus(status as ItemStatus | 'all')}
                                    style={{
                                        color: isActive ? '#fff' : '#64748b',
                                        background: isActive ? activeColor : 'transparent',
                                        borderRadius: 10,
                                        fontWeight: isActive ? 600 : 400,
                                        height: 36,
                                        padding: '0 16px'
                                    }}
                                >
                                    {label} <span style={{ opacity: 0.7, marginLeft: 6, fontSize: 12 }}>{count}</span>
                                </Button>
                            );
                        })}
                    </div>

                    <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.1)' }} />

                    <Tooltip title="เปิด/ปิดเสียง">
                        <Button 
                            type="text"
                            icon={<SoundOutlined style={{ fontSize: 18 }} />}
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            style={{ 
                                color: soundEnabled ? '#10b981' : '#64748b',
                                background: soundEnabled ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)',
                                width: 44,
                                height: 44,
                                borderRadius: 12
                            }}
                        />
                    </Tooltip>
                    
                    <Button 
                        icon={<ReloadOutlined />}
                        onClick={() => refetch()}
                        loading={isLoading}
                        style={{ 
                            background: '#334155',
                            border: 'none',
                            color: 'white',
                            borderRadius: 12,
                            height: 44
                        }}
                    >
                        รีเฟรช
                    </Button>
                </Space>
            </div>

            {/* Grid */}
            {isLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 100 }}>
                    <Spin size="large" />
                </div>
            ) : groupedOrders.length === 0 ? (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={<Text style={{ color: '#64748b', fontSize: 18 }}>ไม่มีออเดอร์ในครัวขณะนี้</Text>}
                    style={{ marginTop: 100 }}
                />
            ) : (
                <Row gutter={[20, 20]}>
                    {groupedOrders.map((order) => {
                        const urgency = getUrgencyConfig(order.created_at);
                        const isHighUrgency = urgency.level === 3;

                        return (
                            <Col xs={24} sm={12} lg={8} xl={6} key={order.order_id}>
                                <div style={kdsStyles.card(urgency.color, isHighUrgency)}>
                                    
                                    {/* Card Header */}
                                    <div style={{ 
                                        padding: '16px', 
                                        background: isHighUrgency ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                                        borderBottom: '1px solid rgba(255,255,255,0.05)' 
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                <span style={{ 
                                                    background: '#fff', 
                                                    color: '#0f172a', 
                                                    fontWeight: 800, 
                                                    padding: '2px 8px', 
                                                    borderRadius: 6,
                                                    fontSize: 16
                                                }}>
                                                    #{order.order_no}
                                                </span>
                                                {order.table_name && (
                                                    <span style={{ color: '#94a3b8', fontSize: 16, fontWeight: 600 }}>
                                                        โต๊ะ {order.table_name}
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: urgency.color }}>
                                                <ClockCircleOutlined />
                                                <span style={{ fontWeight: 700, fontSize: 14 }}>
                                                    {dayjs(order.created_at).fromNow(true)}
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Tag color={isHighUrgency ? 'red' : 'blue'} style={{ margin: 0, border: 'none' }}>
                                                {order.order_type}
                                            </Tag>
                                            {isHighUrgency && (
                                                <span style={{ color: '#ef4444', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                                                    LATE
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Items List */}
                                    <div style={{ flex: 1, padding: 16, overflowY: 'auto', maxHeight: '50vh' }}>
                                        {order.items.map((item) => (
                                            <div key={item.id} style={kdsStyles.itemRow(item.status as ItemStatus)}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', gap: 12 }}>
                                                        <span style={{ 
                                                            fontSize: 18, 
                                                            fontWeight: 800, 
                                                            color: '#f8fafc',
                                                            minWidth: 32
                                                        }}>
                                                            {item.quantity}
                                                        </span>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontSize: 16, fontWeight: 600, color: '#f1f5f9', lineHeight: 1.4 }}>
                                                                {item.product?.display_name}
                                                            </div>
                                                            {item.notes && (
                                                                <div style={{ 
                                                                    marginTop: 8, 
                                                                    background: '#f59e0b', 
                                                                    color: '#000', 
                                                                    padding: '4px 8px', 
                                                                    borderRadius: 6, 
                                                                    fontWeight: 600,
                                                                    fontSize: 13,
                                                                    display: 'inline-block'
                                                                }}>
                                                                    ⚠️ {item.notes}
                                                                </div>
                                                            )}
                                                            <div style={{ marginTop: 6, fontSize: 12, color: '#94a3b8' }}>
                                                                {item.status === ItemStatus.Cooking && 'กำลังปรุง...'}
                                                                {item.status === ItemStatus.Pending && 'รอคิว'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Action Button */}
                                                <div style={{ marginLeft: 8 }}>
                                                    {item.status === ItemStatus.Pending && (
                                                        <Button 
                                                            type="text"
                                                            icon={<ThunderboltOutlined style={{ fontSize: 18 }} />}
                                                            onClick={() => updateItemStatus(item.id, ItemStatus.Cooking)}
                                                            style={{ 
                                                                color: '#f59e0b', 
                                                                background: 'rgba(245, 158, 11, 0.1)',
                                                                width: 44, 
                                                                height: 44,
                                                                borderRadius: 12
                                                            }}
                                                        />
                                                    )}
                                                    {item.status === ItemStatus.Cooking && (
                                                        <Button 
                                                            type="text"
                                                            icon={<CheckOutlined style={{ fontSize: 20 }} />}
                                                            onClick={() => updateItemStatus(item.id, ItemStatus.Served)}
                                                            style={{ 
                                                                color: '#10b981', 
                                                                background: 'rgba(16, 185, 129, 0.2)',
                                                                width: 44, 
                                                                height: 44,
                                                                borderRadius: 12,
                                                                border: '1px solid rgba(16, 185, 129, 0.3)'
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Action Footer */}
                                    <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                        <Button
                                            block
                                            type="primary"
                                            size="large"
                                            icon={<DoubleRightOutlined />}
                                            onClick={() => serveAllItems(order.order_id)}
                                            style={{
                                                background: '#10b981',
                                                borderColor: '#10b981',
                                                borderRadius: 12,
                                                height: 48,
                                                fontWeight: 700,
                                                fontSize: 16
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
        </div>
    );
}
