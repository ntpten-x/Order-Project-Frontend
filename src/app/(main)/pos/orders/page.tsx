"use client";

import { useOrderListPrefetching } from "../../../../hooks/pos/usePrefetching";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Typography, Button, Grid, Input, Skeleton } from "antd";
import { 
  ReloadOutlined, 
  ClockCircleOutlined,
  ContainerOutlined,
  SearchOutlined,
  ShopOutlined,
  CarOutlined,
  HomeOutlined,
  RightOutlined,
  FireOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { SalesOrder, OrderStatus, OrderType } from "../../../../types/api/pos/salesOrder";
import { ItemStatus } from "../../../../types/api/pos/salesOrderItem";
import { 
 
  getOrderStatusText, 
  getOrderChannelText,
  formatCurrency,
  getOrderNavigationPath
} from "../../../../utils/orders";
import { orderColors } from "../../../../theme/pos/orders/style";
import { useDebouncedValue } from "../../../../utils/useDebouncedValue";
import { useOrders } from "../../../../hooks/pos/useOrders";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import 'dayjs/locale/th';
import PageContainer from "../../../../components/ui/page/PageContainer";
import PageSection from "../../../../components/ui/page/PageSection";
import UIPageHeader from "../../../../components/ui/page/PageHeader";
import PageState from "../../../../components/ui/states/PageState";

const { Text } = Typography;
const { useBreakpoint } = Grid;
dayjs.locale('th');
dayjs.extend(relativeTime);

// ── Status Tab Types ──
type StatusTab = 'all' | 'in-progress' | 'waiting-payment';

const STATUS_TABS: { key: StatusTab; label: string; icon: React.ReactNode; apiStatus: string }[] = [
    { key: 'all', label: 'ทั้งหมด', icon: <ContainerOutlined />, apiStatus: 'Pending,Cooking,Served,WaitingForPayment' },
    { key: 'in-progress', label: 'กำลังดำเนินการ', icon: <FireOutlined />, apiStatus: 'Pending,Cooking,Served' },
    { key: 'waiting-payment', label: 'รอชำระเงิน', icon: <WalletOutlined />, apiStatus: 'WaitingForPayment' },
];

// ── Channel Config ──
const CHANNEL_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
    [OrderType.DineIn]: { icon: <ShopOutlined />, color: '#3B82F6', bg: '#EFF6FF' },
    [OrderType.TakeAway]: { icon: <HomeOutlined />, color: '#F59E0B', bg: '#FFFBEB' },
    [OrderType.Delivery]: { icon: <CarOutlined />, color: '#EC4899', bg: '#FDF2F8' },
};

// ── Status Config ──
const STATUS_CONFIG: Record<string, { color: string; bg: string; glow: string }> = {
    [OrderStatus.Pending]: { color: '#F59E0B', bg: '#FFFBEB', glow: 'rgba(245,158,11,0.15)' },
    [OrderStatus.Cooking]: { color: '#3B82F6', bg: '#EFF6FF', glow: 'rgba(59,130,246,0.15)' },
    [OrderStatus.Served]: { color: '#10B981', bg: '#ECFDF5', glow: 'rgba(16,185,129,0.15)' },
    [OrderStatus.WaitingForPayment]: { color: '#8B5CF6', bg: '#F5F3FF', glow: 'rgba(139,92,246,0.15)' },
};

// ── Responsive CSS ──
const responsiveCSS = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
  }
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  .orders-page-card {
    animation: fadeInUp 0.35s cubic-bezier(0.4, 0, 0.2, 1) both;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .orders-page-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 32px rgba(15,23,42,0.10) !important;
  }
  .orders-page-card:active {
    transform: scale(0.98);
  }

  .orders-tab-btn {
    cursor: pointer;
    transition: all 0.2s ease;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    border: none;
    outline: none;
  }
  .orders-tab-btn:active {
    transform: scale(0.96);
  }

  .orders-stat-card {
    transition: all 0.2s ease;
  }
  .orders-stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(15,23,42,0.08) !important;
  }

  .orders-status-dot {
    animation: pulse-dot 2s ease-in-out infinite;
  }

  .orders-search-input .ant-input {
    border: none !important;
    box-shadow: none !important;
    background: transparent !important;
  }
  .orders-search-input .ant-input-affix-wrapper {
    border: none !important;
    box-shadow: none !important;
    background: transparent !important;
  }

  .orders-refresh-btn {
    transition: all 0.3s ease;
  }
  .orders-refresh-btn:hover {
    background: rgba(59,130,246,0.08) !important;
  }

  @media (max-width: 768px) {
    .orders-stats-grid {
      grid-template-columns: repeat(2, 1fr) !important;
    }
  }

  @media (hover: none) and (pointer: coarse) {
    .orders-page-card:active {
      transform: scale(0.97);
      opacity: 0.9;
    }
  }
`;

export default function POSOrdersPage() {
    const router = useRouter();
    const screens = useBreakpoint();
    const isMobile = !screens.md;
    
    useOrderListPrefetching();

    const [page, setPage] = useState(1);
    const [activeTab, setActiveTab] = useState<StatusTab>('all');
    const [searchValue, setSearchValue] = useState("");
    const [showSearch, setShowSearch] = useState(false);
    const debouncedSearch = useDebouncedValue(searchValue.trim(), 400);
    const LIMIT = 20;

    const currentTabConfig = STATUS_TABS.find(t => t.key === activeTab)!;

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, activeTab]);

    const { orders, total, isLoading, isFetching, isError, refetch } = useOrders({
        page,
        limit: LIMIT,
        status: currentTabConfig.apiStatus,
        query: debouncedSearch || undefined
    });

    const getEffectiveStatus = useCallback((order: SalesOrder): OrderStatus => {
        // Only override for In-Progress orders
        if (![OrderStatus.Pending, OrderStatus.Cooking, OrderStatus.Served].includes(order.status)) {
            return order.status;
        }

        // Filter out cancelled items for calculation
        const items = (order.items || []).filter(item => item.status !== ItemStatus.Cancelled);
        if (items.length === 0) return order.status;

        // If any item is cooking, entire order is Cooking
        if (items.some(item => item.status === ItemStatus.Cooking)) {
            return OrderStatus.Cooking;
        }

        // If no items cooking, but some are pending, it is Pending
        if (items.some(item => item.status === ItemStatus.Pending)) {
            return OrderStatus.Pending;
        }

        // If all active items are served, it is Served
        if (items.every(item => item.status === ItemStatus.Served)) {
            return OrderStatus.Served;
        }

        return order.status;
    }, []);

    // ── Stats ──
    const stats = useMemo(() => {
        let pending = 0;
        let cooking = 0;
        let served = 0;
        let waitingPayment = 0;

        orders.forEach(o => {
            const effStatus = getEffectiveStatus(o);
            if (effStatus === OrderStatus.Pending) pending++;
            else if (effStatus === OrderStatus.Cooking) cooking++;
            else if (effStatus === OrderStatus.Served) served++;
            else if (effStatus === OrderStatus.WaitingForPayment) waitingPayment++;
        });

        const inProgress = pending + cooking + served;
        return { pending, cooking, served, waitingPayment, inProgress, total };
    }, [orders, total, getEffectiveStatus]);

    const navigateToOrder = useCallback((order: SalesOrder) => {
        const path = getOrderNavigationPath(order);
        router.push(path);
    }, [router]);

    const getTimeSince = (date: string) => {
        const diff = dayjs().diff(dayjs(date), 'minute');
        if (diff < 1) return 'เมื่อกี้';
        if (diff < 60) return `${diff} นาทีที่แล้ว`;
        const hours = Math.floor(diff / 60);
        if (hours < 24) return `${hours} ชม.ที่แล้ว`;
        return dayjs(date).format('DD MMM HH:mm');
    };

    // ── Error State ──
    if (isError) {
        return (
            <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
                <UIPageHeader
                    title="ออเดอร์"
                    subtitle="รายการออเดอร์ที่กำลังดำเนินการ"
                    onBack={() => router.push('/pos')}
                    icon={<ContainerOutlined style={{ fontSize: 20 }} />}
                    actions={
                        <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
                            โหลดใหม่
                        </Button>
                    }
                />
                <PageContainer>
                    <PageSection>
                        <PageState
                            status="error"
                            title="เกิดข้อผิดพลาด ไม่สามารถโหลดข้อมูลได้"
                            error={isError}
                            onRetry={() => refetch()}
                        />
                    </PageSection>
                </PageContainer>
            </div>
        );
    }

    const isInitialLoading = isLoading && orders.length === 0;

    return (
        <div style={{ 
            minHeight: '100vh', 
            background: '#F8FAFC',
            paddingBottom: 120,
        }}>
            <style>{responsiveCSS}</style>

            {/* ═══ Page Header ═══ */}
            <UIPageHeader
                title="ออเดอร์"
                subtitle={`รายการทั้งหมด ${total} รายการ`}
                onBack={() => router.push('/pos')}
                icon={<ContainerOutlined style={{ fontSize: 20 }} />}
                actions={
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <Button 
                            type="text" 
                            icon={<SearchOutlined />} 
                            onClick={() => setShowSearch(v => !v)}
                            style={{ 
                                borderRadius: 12, 
                                width: 40, height: 40,
                                color: showSearch ? orderColors.primary : undefined,
                                background: showSearch ? orderColors.primaryLight : undefined,
                            }}
                        />
                        <Button 
                            type="text"
                            icon={<ReloadOutlined spin={isFetching} />} 
                            onClick={() => refetch()}
                            className="orders-refresh-btn"
                            style={{ borderRadius: 12, width: 40, height: 40 }}
                        />
                    </div>
                }
            />

            <PageContainer>
                {/* ═══ Search Bar (Collapsible) ═══ */}
                {showSearch && (
                    <div style={{
                        marginBottom: 16,
                        background: '#fff',
                        borderRadius: 16,
                        padding: '4px 16px',
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
                        animation: 'fadeInUp 0.2s ease',
                    }}>
                        <Input
                            allowClear
                            prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
                            placeholder="ค้นหาเลขที่ออเดอร์ โต๊ะ หรือรหัสอ้างอิง..."
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            variant="borderless"
                            style={{ fontSize: 15 }}
                        />
                    </div>
                )}

                {/* ═══ Status Tabs ═══ */}
                <div style={{
                    display: 'flex',
                    gap: 8,
                    marginBottom: 16,
                    overflowX: 'auto',
                    WebkitOverflowScrolling: 'touch',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    paddingBottom: 4,
                }}>
                    {STATUS_TABS.map(tab => {
                        const isActive = activeTab === tab.key;
                        let badgeCount = 0;
                        if (tab.key === 'all') badgeCount = total;
                        else if (tab.key === 'in-progress') badgeCount = stats.inProgress;
                        else if (tab.key === 'waiting-payment') badgeCount = stats.waitingPayment;

                        return (
                            <button
                                key={tab.key}
                                className="orders-tab-btn"
                                onClick={() => setActiveTab(tab.key)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '10px 18px',
                                    borderRadius: 14,
                                    background: isActive
                                        ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
                                        : '#fff',
                                    color: isActive ? '#fff' : '#64748B',
                                    fontWeight: 600,
                                    fontSize: 14,
                                    whiteSpace: 'nowrap',
                                    boxShadow: isActive
                                        ? '0 4px 12px rgba(59,130,246,0.25)'
                                        : '0 1px 4px rgba(15,23,42,0.06)',
                                    border: isActive ? 'none' : '1px solid #E2E8F0',
                                    minHeight: 44,
                                }}
                            >
                                {tab.icon}
                                <span>{tab.label}</span>
                                {badgeCount > 0 && (
                                    <span style={{
                                        background: isActive ? 'rgba(255,255,255,0.25)' : '#F1F5F9',
                                        color: isActive ? '#fff' : '#475569',
                                        padding: '2px 8px',
                                        borderRadius: 20,
                                        fontSize: 12,
                                        fontWeight: 700,
                                        minWidth: 24,
                                        textAlign: 'center',
                                    }}>
                                        {badgeCount}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* ═══ Orders List ═══ */}
                <PageSection>
                    {isInitialLoading ? (
                        <div style={{ padding: 20 }}>
                            {[1, 2, 3].map(i => (
                                <div key={i} style={{
                                    background: '#fff',
                                    borderRadius: 16,
                                    padding: 20,
                                    marginBottom: 12,
                                    border: '1px solid #F1F5F9',
                                }}>
                                    <Skeleton active paragraph={{ rows: 2 }} />
                                </div>
                            ))}
                        </div>
                    ) : orders.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '60px 20px',
                        }}>
                            <div style={{ fontSize: 56, marginBottom: 16, opacity: 0.7 }}>📋</div>
                            <Text strong style={{ fontSize: 17, display: 'block', color: '#1E293B', marginBottom: 6 }}>
                                ไม่พบรายการออเดอร์
                            </Text>
                            <Text style={{ color: '#94A3B8', fontSize: 14 }}>
                                {searchValue ? 'ลองค้นหาด้วยคำอื่น' : 'ยังไม่มีออเดอร์ในสถานะนี้'}
                            </Text>
                        </div>
                    ) : (
                        <>
                            {/* Order Cards */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {orders.map((order, index) => {
                                    const effStatus = getEffectiveStatus(order);
                                    const statusConf = STATUS_CONFIG[effStatus] || { color: '#64748B', bg: '#F1F5F9', glow: 'rgba(100,116,139,0.1)' };
                                    const channelConf = CHANNEL_CONFIG[order.order_type] || { icon: <ContainerOutlined />, color: '#64748B', bg: '#F1F5F9' };

                                    const activeItems = order.items?.filter(i => i.status !== ItemStatus.Cancelled) || [];
                                    const totalQty = activeItems.reduce((sum, item) => sum + Number(item.quantity), 0) || 0;
                                    const cookingQty = activeItems.filter(i => i.status === ItemStatus.Cooking).reduce((sum, item) => sum + Number(item.quantity), 0) || 0;
                                    const servedQty = activeItems.filter(i => i.status === ItemStatus.Served).reduce((sum, item) => sum + Number(item.quantity), 0) || 0;
                                    const isUrgent = effStatus === OrderStatus.Pending && dayjs().diff(dayjs(order.create_date), 'minute') > 15;

                                    return (
                                        <div
                                            key={order.id}
                                            className="orders-page-card"
                                            style={{
                                                background: '#fff',
                                                borderRadius: 18,
                                                border: `1px solid ${isUrgent ? '#FCA5A5' : '#E2E8F0'}`,
                                                boxShadow: isUrgent
                                                    ? '0 4px 16px rgba(239,68,68,0.10)'
                                                    : '0 2px 12px rgba(15,23,42,0.04)',
                                                overflow: 'hidden',
                                                animationDelay: `${index * 0.04}s`,
                                            }}
                                            onClick={() => navigateToOrder(order)}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => e.key === 'Enter' && navigateToOrder(order)}
                                            aria-label={`ออเดอร์ ${order.order_no}`}
                                        >
                                            {/* ── Card Top ── */}
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '14px 16px 10px',
                                            }}>
                                                {/* Left: Order No + Status */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                                                    <Text strong style={{ 
                                                        fontSize: 16, 
                                                        color: '#1E293B',
                                                        whiteSpace: 'nowrap',
                                                    }}>
                                                        #{order.order_no}
                                                    </Text>
                                                    <span style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: 5,
                                                        padding: '3px 10px',
                                                        borderRadius: 20,
                                                        background: statusConf.bg,
                                                        color: statusConf.color,
                                                        fontSize: 12,
                                                        fontWeight: 700,
                                                        whiteSpace: 'nowrap',
                                                    }}>
                                                        <span className="orders-status-dot" style={{
                                                            width: 6, height: 6,
                                                            borderRadius: '50%',
                                                            background: statusConf.color,
                                                            display: 'inline-block',
                                                        }} />
                                                        {getOrderStatusText(effStatus)}
                                                    </span>
                                                </div>

                                                {/* Right: Channel */}
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 5,
                                                    padding: '4px 10px',
                                                    borderRadius: 10,
                                                    background: channelConf.bg,
                                                    color: channelConf.color,
                                                    fontSize: 12,
                                                    fontWeight: 600,
                                                    flexShrink: 0,
                                                }}>
                                                    {channelConf.icon}
                                                    {!isMobile && getOrderChannelText(order.order_type)}
                                                </span>
                                            </div>

                                            {/* ── Card Body ── */}
                                            <div style={{
                                                padding: '0 16px 14px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                gap: 12,
                                            }}>
                                                {/* Left: Reference + Items + Time */}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    {/* Reference */}
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 6,
                                                        marginBottom: 8,
                                                    }}>
                                                        {order.order_type === OrderType.DineIn && (
                                                            <span style={{
                                                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                                                padding: '3px 10px', borderRadius: 8,
                                                                background: '#F0F9FF', color: '#0369A1',
                                                                fontSize: 13, fontWeight: 600,
                                                            }}>
                                                                🪑 โต๊ะ {order.table?.table_name || '-'}
                                                            </span>
                                                        )}
                                                        {order.order_type === OrderType.Delivery && (
                                                            <span style={{
                                                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                                                padding: '3px 10px', borderRadius: 8,
                                                                background: '#FDF2F8', color: '#BE185D',
                                                                fontSize: 13, fontWeight: 600,
                                                            }}>
                                                                📦 {order.delivery_code || 'ไม่ระบุ'}
                                                            </span>
                                                        )}
                                                        {order.order_type === OrderType.TakeAway && (
                                                            <span style={{
                                                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                                                padding: '3px 10px', borderRadius: 8,
                                                                background: '#FFFBEB', color: '#B45309',
                                                                fontSize: 13, fontWeight: 600,
                                                            }}>
                                                                🛍️ สั่งกลับบ้าน
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Status Progress Badges */}
                                                    {(cookingQty > 0 || servedQty > 0) && (
                                                        <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                                                            {cookingQty > 0 && (
                                                                <span style={{
                                                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                                                    padding: '3px 10px', borderRadius: 10,
                                                                    background: '#EFF6FF', color: '#2563EB',
                                                                    fontSize: 11, fontWeight: 700,
                                                                    border: '1px solid #DBEAFE',
                                                                }}>
                                                                    🔥 {cookingQty} กำลังปรุง
                                                                </span>
                                                            )}
                                                            {servedQty > 0 && (
                                                                <span style={{
                                                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                                                    padding: '3px 10px', borderRadius: 10,
                                                                    background: '#ECFDF5', color: '#059669',
                                                                    fontSize: 11, fontWeight: 700,
                                                                    border: '1px solid #D1FAE5',
                                                                }}>
                                                                    ✅ {servedQty} เสิร์ฟแล้ว
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Meta Row: Items + Time */}
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        flexWrap: 'wrap',
                                                        columnGap: 14,
                                                        rowGap: 4,
                                                        color: '#64748B',
                                                        fontSize: 13,
                                                    }}>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                                                            <ContainerOutlined style={{ fontSize: 13 }} />
                                                            <span>{totalQty} รายการ</span>
                                                        </span>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                                                            <ClockCircleOutlined style={{ fontSize: 13 }} />
                                                            <span>{getTimeSince(order.create_date)}</span>
                                                        </span>
                                                        {isUrgent && (
                                                            <span style={{
                                                                color: '#EF4444',
                                                                fontWeight: 700,
                                                                fontSize: 11,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 3,
                                                                whiteSpace: 'nowrap',
                                                            }}>
                                                                ⚠️ รอนาน
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Right: Amount + Arrow */}
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 10,
                                                    flexShrink: 0,
                                                }}>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <Text style={{ fontSize: 11, color: '#94A3B8', display: 'block', lineHeight: 1.3 }}>
                                                            ยอดรวม
                                                        </Text>
                                                        <Text strong style={{
                                                            fontSize: 18,
                                                            color: '#059669',
                                                            lineHeight: 1.3,
                                                        }}>
                                                            {formatCurrency(Number(order.total_amount))}
                                                        </Text>
                                                    </div>
                                                    <div style={{
                                                        width: 32, height: 32,
                                                        borderRadius: 10,
                                                        background: '#F1F5F9',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: '#94A3B8',
                                                        flexShrink: 0,
                                                    }}>
                                                        <RightOutlined style={{ fontSize: 12 }} />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* ── Urgent Bar ── */}
                                            {isUrgent && (
                                                <div style={{
                                                    height: 3,
                                                    background: 'linear-gradient(90deg, #EF4444, #F59E0B)',
                                                    borderRadius: '0 0 18px 18px',
                                                }} />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* ── Pagination ── */}
                            {total > LIMIT && (
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: 8,
                                    marginTop: 24,
                                    paddingBottom: 8,
                                }}>
                                    <Button
                                        disabled={page <= 1}
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        style={{ borderRadius: 12, fontWeight: 600 }}
                                    >
                                        ก่อนหน้า
                                    </Button>
                                    <span style={{
                                        padding: '6px 16px',
                                        borderRadius: 10,
                                        background: '#F1F5F9',
                                        fontSize: 14,
                                        fontWeight: 600,
                                        color: '#475569',
                                    }}>
                                        {page} / {Math.ceil(total / LIMIT)}
                                    </span>
                                    <Button
                                        disabled={page >= Math.ceil(total / LIMIT)}
                                        onClick={() => setPage(p => p + 1)}
                                        style={{ borderRadius: 12, fontWeight: 600 }}
                                    >
                                        ถัดไป
                                    </Button>
                                </div>
                            )}

                            {/* ── Loading overlay for pagination ── */}
                            {isFetching && !isLoading && (
                                <div style={{
                                    position: 'fixed',
                                    bottom: 80,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    background: 'rgba(30,41,59,0.9)',
                                    color: '#fff',
                                    padding: '8px 20px',
                                    borderRadius: 20,
                                    fontSize: 13,
                                    fontWeight: 600,
                                    zIndex: 100,
                                    backdropFilter: 'blur(8px)',
                                    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                }}>
                                    <ReloadOutlined spin />
                                    กำลังโหลด...
                                </div>
                            )}
                        </>
                    )}
                </PageSection>
            </PageContainer>
        </div>
    );
}
