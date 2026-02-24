'use client';

import React, { useEffect, useState, useContext, useMemo, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Typography, Button, Row, Col, Tag, Spin, message, Badge } from "antd";
import { 
    CheckOutlined, 
    ClockCircleOutlined, 
    FireOutlined, 
    SoundOutlined, 
    ReloadOutlined,
    NotificationOutlined,
    WifiOutlined,
    FilterOutlined,
    UpOutlined,
    DownOutlined,
} from "@ant-design/icons";
import { SocketContext } from "../../../../contexts/SocketContext";
import { ordersService } from "../../../../services/pos/orders.service";
import { SalesOrderItem, ItemStatus } from "../../../../types/api/pos/salesOrderItem";
import { OrderStatus } from "../../../../types/api/pos/salesOrder";
import { RealtimeEvents } from "../../../../utils/realtimeEvents";
import dayjs from "dayjs";
import 'dayjs/locale/th';
import relativeTime from 'dayjs/plugin/relativeTime';
import { t } from "../../../../utils/i18n";
import RequireOpenShift from "../../../../components/pos/shared/RequireOpenShift";

dayjs.extend(relativeTime);
dayjs.locale('th');

const { Title, Text } = Typography;

// Responsive Kitchen Styles CSS
const kitchenResponsiveStyles = `
    /* =====================================================
       KITCHEN PAGE - MOBILE FIRST STYLES
       ===================================================== */
    
    .kitchen-page-container {
        min-height: 100vh;
        background: radial-gradient(ellipse at 20% 0%, rgba(249, 115, 22, 0.15) 0%, transparent 50%),
                    radial-gradient(ellipse at 80% 100%, rgba(16, 185, 129, 0.1) 0%, transparent 50%),
                    #0a0f1a;
        padding: 0;
        padding-bottom: 100px;
        color: #f8fafc;
        font-family: var(--font-sans), 'Sarabun', sans-serif;
    }

    /* Hero Header - Mobile First */
    .kitchen-hero {
        background: linear-gradient(145deg, rgba(249, 115, 22, 0.2) 0%, rgba(15, 23, 42, 0.95) 50%, rgba(16, 185, 129, 0.1) 100%);
        padding: 16px;
        border-radius: 0 0 24px 24px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        position: sticky;
        top: 0;
        z-index: 100;
        backdrop-filter: blur(20px);
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .kitchen-hero-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 12px;
    }

    .kitchen-title-section {
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1;
        min-width: 0;
    }

    .kitchen-fire-icon {
        width: 48px;
        height: 48px;
        border-radius: 14px;
        background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 20px rgba(249, 115, 22, 0.4);
        flex-shrink: 0;
    }

    .kitchen-title {
        font-size: 20px !important;
        font-weight: 700 !important;
        margin: 0 !important;
        color: #fff !important;
        white-space: nowrap;
    }

    .kitchen-subtitle {
        display: none;
        color: rgba(255, 255, 255, 0.7);
        font-size: 12px;
    }

    /* Stats Row - Scrollable on Mobile */
    .kitchen-stats-row {
        display: flex;
        gap: 10px;
        overflow-x: auto;
        padding: 4px 0;
        margin: 0 -4px;
        scroll-snap-type: x mandatory;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
    }

    .kitchen-stats-row::-webkit-scrollbar {
        display: none;
    }

    .kitchen-stat-card {
        flex-shrink: 0;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 14px;
        padding: 12px 16px;
        min-width: 90px;
        text-align: center;
        scroll-snap-align: start;
        transition: all 0.2s ease;
    }

    .kitchen-stat-card:active {
        transform: scale(0.95);
        background: rgba(255, 255, 255, 0.1);
    }

    .kitchen-stat-value {
        font-size: 24px;
        font-weight: 800;
        display: block;
        line-height: 1.2;
    }

    .kitchen-stat-label {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.6);
        display: block;
        margin-top: 2px;
    }

    /* Filter Tabs - Mobile */
    .kitchen-filter-row {
        display: flex;
        gap: 8px;
        overflow-x: auto;
        padding: 12px 0 4px;
        scrollbar-width: none;
    }

    .kitchen-filter-row::-webkit-scrollbar {
        display: none;
    }

    .kitchen-filter-btn {
        flex-shrink: 0;
        height: 40px !important;
        padding: 0 16px !important;
        border-radius: 12px !important;
        font-weight: 600 !important;
        font-size: 14px !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .kitchen-filter-btn.active {
        border-color: transparent !important;
    }

    /* Action Buttons */
    .kitchen-action-btns {
        display: flex;
        gap: 8px;
    }

    .kitchen-action-btn {
        width: 44px !important;
        height: 44px !important;
        border-radius: 12px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
    }

    /* Content Area */
    .kitchen-content {
        padding: 16px;
        max-width: 1600px;
        margin: 0 auto;
    }

    /* Order Cards - Mobile First */
    .kitchen-order-card {
        background: linear-gradient(180deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%);
        border-radius: 20px;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.08);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
        margin-bottom: 16px;
        transition: all 0.3s ease;
    }

    .kitchen-order-card.urgent {
        border-color: #ef4444;
        box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.3), 0 8px 32px rgba(239, 68, 68, 0.15);
        animation: pulse-urgent 2s infinite;
    }

    @keyframes pulse-urgent {
        0%, 100% { box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.3), 0 8px 32px rgba(239, 68, 68, 0.15); }
        50% { box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.5), 0 8px 32px rgba(239, 68, 68, 0.25); }
    }

    .kitchen-order-header {
        padding: 16px;
        background: rgba(255, 255, 255, 0.03);
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .kitchen-order-header-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .kitchen-order-number {
        background: #fff;
        color: #0f172a;
        font-weight: 800;
        padding: 4px 12px;
        border-radius: 8px;
        font-size: 16px;
    }

    .kitchen-order-table {
        color: #94a3b8;
        font-size: 15px;
        font-weight: 600;
        margin-left: 10px;
    }

    .kitchen-order-time {
        display: flex;
        align-items: center;
        gap: 6px;
        font-weight: 700;
        font-size: 14px;
    }

    .kitchen-order-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .kitchen-order-type-tag {
        margin: 0 !important;
        border: none !important;
        font-weight: 600;
    }

    .kitchen-order-urgency {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1px;
    }

    /* Progress Bar */
    .kitchen-progress-bar {
        height: 5px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 999px;
        overflow: hidden;
        margin-top: 10px;
    }

    .kitchen-progress-fill {
        height: 100%;
        border-radius: 999px;
        transition: width 0.5s ease;
    }

    /* Items List */
    .kitchen-items-list {
        padding: 12px;
        max-height: 400px;
        overflow-y: auto;
    }

    .kitchen-item-row {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 14px;
        background: rgba(255, 255, 255, 0.04);
        border-radius: 14px;
        margin-bottom: 10px;
        border-left: 4px solid transparent;
        transition: all 0.2s ease;
    }

    .kitchen-item-row:active {
        transform: scale(0.99);
        background: rgba(255, 255, 255, 0.08);
    }

    .kitchen-item-row.pending {
        border-left-color: #f59e0b;
    }

    .kitchen-item-row.cooking {
        border-left-color: #10b981;
        background: rgba(16, 185, 129, 0.08);
    }

    .kitchen-item-row.served {
        border-left-color: #64748b;
        opacity: 0.7;
    }

    .kitchen-item-qty {
        font-size: 20px;
        font-weight: 800;
        color: #fff;
        min-width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        flex-shrink: 0;
    }

    .kitchen-item-info {
        flex: 1;
        min-width: 0;
    }

    .kitchen-item-name {
        font-size: 16px;
        font-weight: 600;
        color: #f1f5f9;
        line-height: 1.4;
        word-break: break-word;
    }

    .kitchen-item-notes {
        display: inline-block;
        margin-top: 8px;
        background: #f59e0b;
        color: #000;
        padding: 5px 10px;
        border-radius: 8px;
        font-weight: 600;
        font-size: 13px;
    }

    .kitchen-item-status {
        font-size: 12px;
        color: #94a3b8;
        margin-top: 6px;
    }

    .kitchen-item-action {
        flex-shrink: 0;
    }

    .kitchen-item-action-btn {
        width: 52px !important;
        height: 52px !important;
        border-radius: 14px !important;
        font-size: 22px !important;
    }

    /* Order Footer */
    .kitchen-order-footer {
        padding: 14px;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
    }

    .kitchen-serve-all-btn {
        height: 54px !important;
        border-radius: 14px !important;
        font-size: 16px !important;
        font-weight: 700 !important;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
        border: none !important;
        box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3) !important;
    }

    .kitchen-serve-all-btn:active {
        transform: scale(0.98) !important;
    }

    /* Empty State */
    .kitchen-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 20px;
        text-align: center;
    }

    .kitchen-empty-icon {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.05) 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 20px;
    }

    .kitchen-empty-text {
        font-size: 18px;
        color: #64748b;
        margin-bottom: 16px;
    }

    /* =====================================================
       TABLET & DESKTOP OVERRIDES
       ===================================================== */
    @media (min-width: 768px) {
        .kitchen-page-container {
            padding-bottom: 40px;
        }

        .kitchen-hero {
            padding: 20px 24px;
            border-radius: 0 0 28px 28px;
            position: relative;
        }

        .kitchen-fire-icon {
            width: 56px;
            height: 56px;
            border-radius: 16px;
        }

        .kitchen-title {
            font-size: 26px !important;
        }

        .kitchen-subtitle {
            display: block;
        }

        .kitchen-stat-card {
            min-width: 110px;
            padding: 14px 20px;
        }

        .kitchen-stat-value {
            font-size: 28px;
        }

        .kitchen-content {
            padding: 24px;
        }

        .kitchen-order-card {
            margin-bottom: 0;
        }

        .kitchen-items-list {
            max-height: 50vh;
        }
    }

    @media (min-width: 1024px) {
        .kitchen-hero {
            padding: 24px 32px;
        }

        .kitchen-fire-icon {
            width: 64px;
            height: 64px;
        }

        .kitchen-title {
            font-size: 30px !important;
        }

        .kitchen-order-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 16px 48px rgba(0, 0, 0, 0.35);
        }
    }
`;

// Urgency Logic
const getUrgencyConfig = (createdAt: string) => {
    const minutes = dayjs().diff(dayjs(createdAt), 'minute');
    if (minutes < 10) return { 
        color: '#10b981',
        label: 'ปกติ',
        level: 1
    };
    if (minutes < 20) return { 
        color: '#f59e0b',
        label: 'เริ่มช้า',
        level: 2
    };
    return { 
        color: '#ef4444',
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
    return (
        <RequireOpenShift>
            <KitchenDisplayPageContent />
        </RequireOpenShift>
    );
}

function KitchenDisplayPageContent() {
    const { socket, isConnected } = useContext(SocketContext);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [filterStatus, setFilterStatus] = useState<ItemStatus | 'all'>('all');
    const [statsExpanded, setStatsExpanded] = useState(false);

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
            const [pending, cooking, served] = await Promise.all([
                ordersService.getItems(ItemStatus.Pending),
                ordersService.getItems(ItemStatus.Cooking),
                ordersService.getItems(ItemStatus.Served),
            ]);

            const merged = [...pending, ...cooking, ...served].map((item: SalesOrderItem) => {
                const normalizedStatus =
                    item.status === ItemStatus.Cooking || item.status === ItemStatus.Served
                        ? ItemStatus.Pending
                        : item.status;
                return { ...item, status: normalizedStatus };
            });

            // Filter items: show only active order items (not cancelled, not paid/completed/waiting payment).
            return merged.filter((item: SalesOrderItem) =>
                item.status !== ItemStatus.Cancelled &&
                item.order &&
                (
                    item.order.status === OrderStatus.Pending ||
                    item.order.status === OrderStatus.Cooking ||
                    item.order.status === OrderStatus.Served
                )
            );
        },
        // Primary freshness from socket events; polling is fallback only when socket is disconnected.
        staleTime: isConnected ? 30_000 : 7_500,
        refetchInterval: isConnected ? false : 30_000,
        refetchIntervalInBackground: false,
    });

    const groupedOrders = useMemo((): GroupedOrder[] => {
        const grouped: Record<string, GroupedOrder> = {};
        
        let filteredItems = allItems;
        
        if (filterStatus !== 'all') {
            filteredItems = allItems.filter(item => item.status === filterStatus);
        }

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

        return Object.values(grouped).sort((a, b) => 
            dayjs(a.created_at).valueOf() - dayjs(b.created_at).valueOf()
        );
    }, [allItems, filterStatus]);

    // Socket Event Handlers
    useEffect(() => {
        if (!socket) return;

        const handleOrderCreate = (newOrder: { order_no: string }) => {
            // Data refresh is handled by global useOrderSocketEvents
            playNotificationSound();
            message.open({
                type: 'info',
                content: `ออเดอร์ใหม่: #${newOrder.order_no}`,
                icon: <NotificationOutlined style={{ color: '#10b981' }} />,
                className: 'kds-notification',
                duration: 5,
            });
        };

        socket.on(RealtimeEvents.orders.create, handleOrderCreate);
        // Other update/delete events are handled globally and trigger query invalidation automatically

        return () => {
            socket.off(RealtimeEvents.orders.create, handleOrderCreate);
        };
    }, [socket, playNotificationSound]);

    const inProgressCount = allItems.filter(i => i.status === ItemStatus.Pending).length;

    const stats = [
        { label: 'คิวทั้งหมด', value: allItems.length, color: '#38bdf8' },
        { label: 'กำลังดำเนินการ', value: inProgressCount, color: '#f59e0b' },
    ];

    const filters = [
        { key: 'all', label: 'ทั้งหมด', count: allItems.length, color: '#38bdf8' },
        { key: ItemStatus.Pending, label: 'กำลังดำเนินการ', count: inProgressCount, color: '#f59e0b' },
    ];

    return (
        <div className="kitchen-page-container">
            <style jsx global>{kitchenResponsiveStyles}</style>
            
            {/* Hero Header */}
            <div className="kitchen-hero">
                <div className="kitchen-hero-top">
                    <div className="kitchen-title-section">
                        <div className="kitchen-fire-icon">
                            <FireOutlined style={{ fontSize: 26, color: '#fff' }} />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Title className="kitchen-title">Kitchen Pulse</Title>
                                {isConnected ? (
                                    <Tag icon={<WifiOutlined />} color="#10b981" style={{ margin: 0, borderRadius: 10, fontSize: 11, padding: '2px 8px', fontWeight: 700 }}>LIVE</Tag>
                                ) : (
                                    <Tag icon={<WifiOutlined />} color="#ef4444" style={{ margin: 0, borderRadius: 10, fontSize: 11, padding: '2px 8px', fontWeight: 700 }}>OFFLINE</Tag>
                                )}
                            </div>
                            <Text className="kitchen-subtitle">มอนิเตอร์งานครัวแบบเรียลไทม์</Text>
                        </div>
                    </div>
                    
                    <div className="kitchen-action-btns">
                        <Button 
                            type="text"
                            icon={<SoundOutlined style={{ fontSize: 18 }} />}
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            className="kitchen-action-btn"
                            style={{ 
                                color: soundEnabled ? '#10b981' : '#64748b',
                                background: soundEnabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.08)',
                            }}
                        />
                        <Button 
                            icon={<ReloadOutlined style={{ fontSize: 18 }} />}
                            onClick={() => refetch()}
                            loading={isLoading}
                            className="kitchen-action-btn"
                            style={{ 
                                background: 'linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)',
                                border: 'none',
                                color: 'white',
                            }}
                        />
                    </div>
                </div>

                {/* Stats Row - Collapsible on Mobile */}
                <div 
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', marginBottom: statsExpanded ? 8 : 0 }}
                    onClick={() => setStatsExpanded(!statsExpanded)}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Badge count={allItems.length} style={{ backgroundColor: '#38bdf8' }} />
                        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>รายการงานครัว</Text>
                    </div>
                    <Button type="text" size="small" icon={statsExpanded ? <UpOutlined /> : <DownOutlined />} style={{ color: 'rgba(255,255,255,0.5)' }} />
                </div>

                {statsExpanded && (
                    <div className="kitchen-stats-row">
                        {stats.map((stat) => (
                            <div key={stat.label} className="kitchen-stat-card">
                                <span className="kitchen-stat-value" style={{ color: stat.color }}>{stat.value}</span>
                                <span className="kitchen-stat-label">{stat.label}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Filter Tabs */}
                <div className="kitchen-filter-row">
                    {filters.map((filter) => {
                        const isActive = filterStatus === filter.key;
                        return (
                            <Button
                                key={filter.key}
                                type="text"
                                onClick={() => setFilterStatus(filter.key as ItemStatus | 'all')}
                                className={`kitchen-filter-btn ${isActive ? 'active' : ''}`}
                                style={{
                                    color: isActive ? '#0f172a' : '#94a3b8',
                                    background: isActive ? filter.color : 'rgba(255,255,255,0.06)',
                                }}
                            >
                                <FilterOutlined style={{ fontSize: 14 }} />
                                {filter.label}
                                <span style={{ opacity: 0.7, fontSize: 12 }}>({filter.count})</span>
                            </Button>
                        );
                    })}
                </div>
            </div>

            {/* Content */}
            <div className="kitchen-content">
                {error && (
                    <div className="kitchen-empty">
                        <Text style={{ color: '#fca5a5', fontSize: 16 }}>โหลดข้อมูลไม่สำเร็จ</Text>
                        <Button onClick={() => refetch()} type="primary" style={{ marginTop: 16 }}>ลองใหม่</Button>
                    </div>
                )}

                {!error && isLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
                        <Spin size="large" />
                    </div>
                ) : groupedOrders.length === 0 ? (
                    <div className="kitchen-empty">
                        <div className="kitchen-empty-icon">
                            <CheckOutlined style={{ fontSize: 48, color: '#10b981' }} />
                        </div>
                        <Text className="kitchen-empty-text">ไม่มีออเดอร์ในหน้าจอนี้</Text>
                        <Button 
                            onClick={() => refetch()} 
                            type="default"
                            icon={<ReloadOutlined />}
                            style={{ borderRadius: 12, height: 44, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#94a3b8' }}
                        >
                            รีเฟรช
                        </Button>
                    </div>
                ) : (
                    <Row gutter={[16, 16]}>
                        {groupedOrders.map((order) => {
                            const urgency = getUrgencyConfig(order.created_at);
                            const isHighUrgency = urgency.level === 3;
                            const progress = Math.min(1, Math.max(0.1, dayjs().diff(dayjs(order.created_at), 'minute') / 25));

                            return (
                                <Col xs={24} sm={24} md={12} lg={8} xl={6} key={order.order_id}>
                                    <div className={`kitchen-order-card ${isHighUrgency ? 'urgent' : ''}`}>
                                        
                                        {/* Card Header */}
                                        <div className="kitchen-order-header" style={{ background: isHighUrgency ? 'rgba(239, 68, 68, 0.08)' : undefined }}>
                                            <div className="kitchen-order-header-top">
                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                    <span className="kitchen-order-number">#{order.order_no}</span>
                                                    {order.table_name && (
                                                        <span className="kitchen-order-table">โต๊ะ {order.table_name}</span>
                                                    )}
                                                </div>
                                                <div className="kitchen-order-time" style={{ color: urgency.color }}>
                                                    <ClockCircleOutlined />
                                                    <span>{dayjs(order.created_at).fromNow(true)}</span>
                                                </div>
                                            </div>
                                            <div className="kitchen-order-meta">
                                                <Tag color={isHighUrgency ? 'red' : 'blue'} className="kitchen-order-type-tag">
                                                    {order.order_type}
                                                </Tag>
                                                {isHighUrgency && (
                                                    <span className="kitchen-order-urgency" style={{ color: '#ef4444' }}>
                                                        ⚠️ LATE
                                                    </span>
                                                )}
                                            </div>
                                            <div className="kitchen-progress-bar">
                                                <div 
                                                    className="kitchen-progress-fill" 
                                                    style={{ width: `${progress * 100}%`, background: urgency.color }} 
                                                />
                                            </div>
                                        </div>

                                        {/* Items List */}
                                        <div className="kitchen-items-list">
                                            {order.items.map((item) => (
                                                <div 
                                                    key={item.id} 
                                                    className="kitchen-item-row pending"
                                                >
                                                    <div className="kitchen-item-qty">{item.quantity}</div>
                                                    <div className="kitchen-item-info">
                                                        <div className="kitchen-item-name">{item.product?.display_name}</div>
                                                        {item.notes && (
                                                            <div className="kitchen-item-notes">⚠️ {item.notes}</div>
                                                        )}
                                                        <div className="kitchen-item-status">
                                                            ⏳ กำลังดำเนินการ
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </Col>
                            );
                        })}
                    </Row>
                )}
            </div>
        </div>
    );
}
