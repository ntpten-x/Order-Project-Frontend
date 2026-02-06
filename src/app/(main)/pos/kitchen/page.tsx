'use client';

import React, { useEffect, useState, useContext, useMemo, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Typography, Button, Row, Col, Tag, Empty, Spin, message, Tooltip } from "antd";
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
import { RealtimeEvents } from "../../../../utils/realtimeEvents";
import dayjs from "dayjs";
import 'dayjs/locale/th';
import relativeTime from 'dayjs/plugin/relativeTime';
import PageContainer from "../../../../components/ui/page/PageContainer";
import { t } from "../../../../utils/i18n";

dayjs.extend(relativeTime);
dayjs.locale('th');

const { Title, Text } = Typography;

// KDS Specific Styles
const kdsStyles = {
    container: {
        minHeight: '100vh',
        background: 'radial-gradient(circle at 20% 20%, rgba(59,130,246,0.08), transparent 25%), radial-gradient(circle at 80% 0%, rgba(16,185,129,0.08), transparent 22%), #0b1020',
        padding: '24px',
        color: '#f8fafc',
        fontFamily: "var(--font-sans), 'Sarabun', sans-serif",
        position: 'relative' as const,
        overflow: 'hidden',
    },
    header: {
        marginBottom: 28,
        background: 'linear-gradient(135deg, rgba(30,41,59,0.9) 0%, rgba(15,23,42,0.9) 40%, rgba(28,43,68,0.92) 100%)',
        padding: '18px 22px',
        borderRadius: 24,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
        position: 'relative' as const,
        overflow: 'hidden',
    },
    card: (urgencyColor: string, isHighUrgency: boolean) => ({
        background: 'linear-gradient(180deg, rgba(30,41,59,0.96) 0%, rgba(17,24,39,0.94) 100%)',
        borderRadius: 18,
        overflow: 'hidden',
        border: `1px solid ${isHighUrgency ? urgencyColor : 'rgba(255,255,255,0.08)'}`,
        boxShadow: isHighUrgency
            ? `0 0 0 2px ${urgencyColor}33, 0 16px 32px rgba(0,0,0,0.28)`
            : '0 12px 30px rgba(0,0,0,0.18)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column' as const,
        transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
        animation: isHighUrgency ? 'pulse-border 1.8s infinite' : 'none'
    }),
    itemRow: (status: ItemStatus) => ({
        padding: '12px',
        background: status === ItemStatus.Cooking ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255,255,255,0.05)',
        marginBottom: 10,
        borderRadius: 10,
        borderLeft: `5px solid ${
            status === ItemStatus.Cooking ? '#10b981' :
            status === ItemStatus.Served ? '#64748b' : '#f59e0b'
        }`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 10
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
            audioRef.current.play().catch((err) => {
                console.error(err);
                message.warning(t("kitchen.soundBlocked"));
            });
        }
    }, [soundEnabled]);

    const { data: allItems = [], isLoading, refetch, error } = useQuery<SalesOrderItem[]>({
        queryKey: ["orderItems", "kitchen"],
        queryFn: async () => {
            // Backend sometimes needs explicit status filter; fetch both important statuses
            const [pending, cooking] = await Promise.all([
                ordersService.getItems(ItemStatus.Pending),
                ordersService.getItems(ItemStatus.Cooking),
            ]);

            const merged = [...pending, ...cooking];

            return merged.filter((item: SalesOrderItem) =>
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

        socket.on(RealtimeEvents.orders.create, handleOrderCreate);
        socket.on(RealtimeEvents.orders.update, handleOrderUpdate);
        socket.on(RealtimeEvents.salesOrderItem.create, handleOrderUpdate);
        socket.on(RealtimeEvents.salesOrderItem.update, handleOrderUpdate);
        socket.on(RealtimeEvents.salesOrderItem.delete, handleOrderUpdate);
        socket.on(RealtimeEvents.salesOrderDetail.create, handleOrderUpdate);
        socket.on(RealtimeEvents.salesOrderDetail.update, handleOrderUpdate);
        socket.on(RealtimeEvents.salesOrderDetail.delete, handleOrderUpdate);

        return () => {
            socket.off(RealtimeEvents.orders.create, handleOrderCreate);
            socket.off(RealtimeEvents.orders.update, handleOrderUpdate);
            socket.off(RealtimeEvents.salesOrderItem.create, handleOrderUpdate);
            socket.off(RealtimeEvents.salesOrderItem.update, handleOrderUpdate);
            socket.off(RealtimeEvents.salesOrderItem.delete, handleOrderUpdate);
            socket.off(RealtimeEvents.salesOrderDetail.create, handleOrderUpdate);
            socket.off(RealtimeEvents.salesOrderDetail.update, handleOrderUpdate);
            socket.off(RealtimeEvents.salesOrderDetail.delete, handleOrderUpdate);
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
        <PageContainer maxWidth={99999} style={{ padding: 0 }}>
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
                <div style={{ position: 'absolute', inset: 0, opacity: 0.6, pointerEvents: 'none' }} className="header-pattern" />
                <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', position: 'relative', zIndex: 2 }}>
                    <div style={{
                        width: 62,
                        height: 62,
                        borderRadius: 18,
                        background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 60%, #fb923c 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 24px rgba(249, 115, 22, 0.4)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <FireOutlined style={{ fontSize: 30, color: '#fff' }} className="header-icon-animate" />
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <Title level={2} style={{ margin: 0, color: '#fff', fontSize: 28, letterSpacing: '0.5px' }}>
                                Kitchen Pulse
                            </Title>
                            {isConnected ? (
                                <Tag icon={<WifiOutlined />} color="#10b981" style={{ margin: 0, borderRadius: 12, padding: '2px 12px', fontWeight: 700 }}>LIVE</Tag>
                            ) : (
                                <Tag icon={<WifiOutlined />} color="#ef4444" style={{ margin: 0, borderRadius: 12, padding: '2px 12px', fontWeight: 700 }}>OFFLINE</Tag>
                            )}
                        </div>
                        <Text style={{ color: '#cbd5e1', fontSize: 14 }}>มอนิเตอร์งานครัวแบบเรียลไทม์ • เน้นงานด่วนก่อน</Text>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', justifyContent: 'flex-end', position: 'relative', zIndex: 2 }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                        gap: 10,
                        background: 'rgba(255,255,255,0.04)',
                        padding: '10px 12px',
                        borderRadius: 16,
                        border: '1px solid rgba(255,255,255,0.08)',
                        minWidth: 320
                    }}>
                        {[
                            { label: 'คิวทั้งหมด', value: allItems.length, color: '#38bdf8' },
                            { label: 'รอทำ', value: pendingCount, color: '#f59e0b' },
                            { label: 'กำลังทำ', value: cookingCount, color: '#10b981' },
                        ].map((stat) => (
                            <div key={stat.label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Text style={{ color: '#cbd5e1', fontSize: 12 }}>{stat.label}</Text>
                                <Text strong style={{ color: stat.color, fontSize: 18 }}>{stat.value}</Text>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0b1222', padding: 6, borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)' }}>
                        {['all', ItemStatus.Pending, ItemStatus.Cooking].map((status) => {
                            const isActive = filterStatus === status;
                            let count = allItems.length;
                            let label = 'ทั้งหมด';
                            let activeColor = '#38bdf8';

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
                                        color: isActive ? '#0b1222' : '#cbd5e1',
                                        background: isActive ? activeColor : 'transparent',
                                        borderRadius: 10,
                                        fontWeight: isActive ? 700 : 500,
                                        height: 36,
                                        padding: '0 14px'
                                    }}
                                >
                                    {label} <span style={{ opacity: 0.7, marginLeft: 6, fontSize: 12 }}>{count}</span>
                                </Button>
                            );
                        })}
                    </div>

                    <Tooltip title="เปิด/ปิดเสียงแจ้งเตือน">
                        <Button 
                            type="text"
                            icon={<SoundOutlined style={{ fontSize: 18 }} />}
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            style={{ 
                                color: soundEnabled ? '#10b981' : '#94a3b8',
                                background: soundEnabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.05)',
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
                            background: 'linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)',
                            border: 'none',
                            color: 'white',
                            borderRadius: 12,
                            height: 44,
                            boxShadow: '0 10px 24px rgba(99,102,241,0.3)'
                        }}
                    >
                        รีเฟรช
                    </Button>
                </div>
            </div>

            {/* Grid */}
            {error && (
                <div style={{ textAlign: 'center', padding: '60px 16px', color: '#cbd5e1' }}>
                    <Text style={{ color: '#fca5a5' }}>โหลดข้อมูลไม่สำเร็จ</Text>
                    <div style={{ marginTop: 10 }}>
                        <Button onClick={() => refetch()} type="primary">ลองใหม่</Button>
                    </div>
                </div>
            )}
            {!error && isLoading ? (
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
                        const progress = Math.min(1, Math.max(0.1, dayjs().diff(dayjs(order.created_at), 'minute') / 25));

                        return (
                            <Col xs={24} sm={24} md={12} lg={8} xl={6} key={order.order_id}>
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
                                        <div style={{ marginTop: 10, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden' }}>
                                            <div style={{ width: `${progress * 100}%`, height: '100%', background: urgency.color, transition: 'width 0.3s ease' }} />
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
        </PageContainer>
    );
}
