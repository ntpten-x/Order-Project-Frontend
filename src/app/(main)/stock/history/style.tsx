"use client";

import React from "react";
import { Typography, Avatar, Tag, Button, Empty } from "antd";
import { 
    HistoryOutlined,
    CheckCircleFilled,
    CloseCircleFilled,
    EyeOutlined,
    DeleteOutlined,
    CalendarOutlined,
    UserOutlined,
    ShoppingOutlined
} from "@ant-design/icons";
import { Order, OrderStatus } from "../../../../types/api/stock/orders";

const { Text, Title } = Typography;

// ============ STYLES ============

export const pageStyles = {
    container: {
        paddingBottom: 100,
        backgroundColor: '#f8f9fc',
        minHeight: '100vh'
    },
    header: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px 20px 60px 20px',
        position: 'relative' as const,
        overflow: 'hidden' as const
    },
    headerDecoCircle1: {
        position: 'absolute' as const,
        top: -50,
        right: -50,
        width: 150,
        height: 150,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.1)'
    },
    headerDecoCircle2: {
        position: 'absolute' as const,
        bottom: -30,
        left: -30,
        width: 100,
        height: 100,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)'
    },
    headerContent: {
        position: 'relative' as const, 
        zIndex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    headerLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: 12
    },
    headerIconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        background: 'rgba(255,255,255,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(8px)'
    },
    statsCard: {
        margin: '-40px 16px 0 16px',
        padding: '16px',
        background: 'white',
        borderRadius: 20,
        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        display: 'flex',
        justifyContent: 'space-around',
        position: 'relative' as const,
        zIndex: 10
    },
    statItem: {
        textAlign: 'center' as const,
        flex: 1
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 700,
        display: 'block'
    },
    statLabel: {
        fontSize: 12,
        color: '#8c8c8c',
        marginTop: 2
    },
    listContainer: {
        padding: '20px 16px 0 16px'
    },
    sectionTitle: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16
    },
    orderCard: (status: OrderStatus) => ({
        marginBottom: 12,
        borderRadius: 20,
        border: 'none',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        background: status === OrderStatus.COMPLETED 
            ? 'linear-gradient(to right, #f6ffed, white)'
            : 'linear-gradient(to right, #fff2f0, white)'
    }),
    orderCardInner: {
        padding: 16,
        display: 'flex',
        flexDirection: 'column' as const,
        gap: 12
    },
    orderHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
    },
    orderInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: 10
    },
    orderActions: {
        display: 'flex',
        gap: 8
    }
};

// ============ STATUS CONFIG ============

export const statusConfig = {
    [OrderStatus.PENDING]: {
        color: '#faad14',
        bgColor: 'linear-gradient(135deg, #fffbe6 0%, #fff1b8 100%)',
        borderColor: '#ffe58f',
        icon: <></>,
        label: 'รอดำเนินการ',
        tagColor: 'gold'
    },
    [OrderStatus.COMPLETED]: {
        color: '#52c41a',
        bgColor: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)',
        borderColor: '#b7eb8f',
        icon: <CheckCircleFilled style={{ color: '#52c41a' }} />,
        label: 'เสร็จสิ้น',
        tagColor: 'success'
    },
    [OrderStatus.CANCELLED]: {
        color: '#ff4d4f',
        bgColor: 'linear-gradient(135deg, #fff2f0 0%, #ffccc7 100%)',
        borderColor: '#ffa39e',
        icon: <CloseCircleFilled style={{ color: '#ff4d4f' }} />,
        label: 'ยกเลิก',
        tagColor: 'error'
    }
};

// ============ CSS ANIMATIONS ============

export const HistoryPageStyles = () => (
    <style>{`
        .history-page-modal .ant-modal-content {
            border-radius: 24px !important;
            overflow: hidden;
            padding: 0 !important;
        }
        
        @keyframes fadeSlideIn {
            from {
                opacity: 0;
                transform: translateY(12px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .history-order-card {
            animation: fadeSlideIn 0.4s ease both;
        }
        
        .history-order-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important;
        }
        
        .history-order-card:active {
            transform: scale(0.98);
        }
        
        /* Custom scrollbar */
        .history-page *::-webkit-scrollbar {
            width: 6px;
        }
        .history-page *::-webkit-scrollbar-track {
            background: transparent;
        }
        .history-page *::-webkit-scrollbar-thumb {
            background: #d9d9d9;
            border-radius: 3px;
        }
        .history-page *::-webkit-scrollbar-thumb:hover {
            background: #bfbfbf;
        }
    `}</style>
);

// ============ HEADER COMPONENT ============

interface HeaderProps {
    onRefresh: () => void;
    loading?: boolean;
}

export const PageHeader = ({ onRefresh, loading }: HeaderProps) => (
    <div style={pageStyles.header}>
        {/* Decorative circles */}
        <div style={pageStyles.headerDecoCircle1} />
        <div style={pageStyles.headerDecoCircle2} />
        
        {/* Header Content */}
        <div style={pageStyles.headerContent}>
            <div style={pageStyles.headerLeft}>
                <div style={pageStyles.headerIconBox}>
                    <HistoryOutlined style={{ fontSize: 24, color: 'white' }} />
                </div>
                <div>
                    <Text style={{ 
                        color: 'rgba(255,255,255,0.85)', 
                        fontSize: 13,
                        display: 'block'
                    }}>
                        ประวัติทั้งหมด
                    </Text>
                    <Title level={4} style={{ 
                        color: 'white', 
                        margin: 0,
                        fontWeight: 700,
                        letterSpacing: '0.5px'
                    }}>
                        รายการสั่งซื้อ
                    </Title>
                </div>
            </div>
            <Button
                type="text"
                icon={<HistoryOutlined style={{ color: 'white' }} />}
                onClick={onRefresh}
                loading={loading}
                style={{
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: 12,
                    height: 40,
                    color: 'white',
                    fontWeight: 600
                }}
            >
                รีเฟรช
            </Button>
        </div>
    </div>
);

// ============ STATS CARD COMPONENT ============

interface StatsCardProps {
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
}

export const StatsCard = ({ totalOrders, completedOrders, cancelledOrders }: StatsCardProps) => (
    <div style={pageStyles.statsCard}>
        <div style={pageStyles.statItem}>
            <span style={{ ...pageStyles.statNumber, color: '#667eea' }}>{totalOrders}</span>
            <Text style={pageStyles.statLabel}>ทั้งหมด</Text>
        </div>
        <div style={{ width: 1, background: '#f0f0f0' }} />
        <div style={pageStyles.statItem}>
            <span style={{ ...pageStyles.statNumber, color: '#52c41a' }}>{completedOrders}</span>
            <Text style={pageStyles.statLabel}>เสร็จสิ้น</Text>
        </div>
        <div style={{ width: 1, background: '#f0f0f0' }} />
        <div style={pageStyles.statItem}>
            <span style={{ ...pageStyles.statNumber, color: '#ff4d4f' }}>{cancelledOrders}</span>
            <Text style={pageStyles.statLabel}>ยกเลิก</Text>
        </div>
    </div>
);

// ============ ORDER CARD COMPONENT ============

interface OrderCardProps {
    order: Order;
    index: number;
    onView: (order: Order) => void;
    onDelete: (order: Order) => void;
    isAdmin: boolean;
}

export const OrderCard = ({ order, index, onView, onDelete, isAdmin }: OrderCardProps) => {
    const status = statusConfig[order.status] || statusConfig[OrderStatus.PENDING];
    const itemCount = order.ordersItems?.length || 0;
    const purchasedCount = order.ordersItems?.filter(i => i.ordersDetail?.is_purchased).length || 0;
    
    // Get first 3 items for preview
    const previewItems = order.ordersItems?.slice(0, 3) || [];
    const moreItems = itemCount - 3;

    return (
        <div
            className="history-order-card"
            style={{
                ...pageStyles.orderCard(order.status),
                animationDelay: `${index * 0.05}s`
            }}
        >
            <div style={pageStyles.orderCardInner}>
                {/* Header row */}
                <div style={pageStyles.orderHeader}>
                    <div style={pageStyles.orderInfo}>
                        {/* Status Icon */}
                        <div style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            background: status.bgColor,
                            border: `1px solid ${status.borderColor}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 20
                        }}>
                            {status.icon}
                        </div>
                        <div>
                            <Text strong style={{ fontSize: 15, color: '#1a1a2e', display: 'block' }}>
                                #{order.id.substring(0, 8).toUpperCase()}
                            </Text>
                            <Tag 
                                color={status.tagColor as "gold" | "success" | "error"} 
                                style={{ 
                                    marginTop: 4, 
                                    borderRadius: 10,
                                    fontWeight: 600 
                                }}
                            >
                                {status.label}
                            </Tag>
                        </div>
                    </div>
                    
                    {/* Actions */}
                    <div style={pageStyles.orderActions}>
                        <Button
                            type="primary"
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => onView(order)}
                            style={{
                                borderRadius: 10,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                border: 'none'
                            }}
                        >
                            ดู
                        </Button>
                        {isAdmin && (
                            <Button
                                danger
                                size="small"
                                icon={<DeleteOutlined />}
                                onClick={() => onDelete(order)}
                                style={{ borderRadius: 10 }}
                            >
                                ลบ
                            </Button>
                        )}
                    </div>
                </div>

                {/* Order Info */}
                <div style={{ 
                    display: 'flex', 
                    gap: 16, 
                    padding: '12px 0',
                    borderTop: '1px solid #f0f0f0',
                    borderBottom: '1px solid #f0f0f0'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <UserOutlined style={{ color: '#8c8c8c' }} />
                        <Text type="secondary" style={{ fontSize: 13 }}>
                            {order.ordered_by?.username || 'Unknown'}
                        </Text>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <CalendarOutlined style={{ color: '#8c8c8c' }} />
                        <Text type="secondary" style={{ fontSize: 13 }}>
                            {new Date(order.create_date).toLocaleDateString('th-TH', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </Text>
                    </div>
                </div>

                {/* Items Preview */}
                <div>
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 6,
                        marginBottom: 10
                    }}>
                        <ShoppingOutlined style={{ color: '#667eea', fontSize: 14 }} />
                        <Text style={{ fontSize: 13, color: '#666' }}>
                            {order.status === OrderStatus.COMPLETED 
                                ? `ซื้อแล้ว ${purchasedCount}/${itemCount} รายการ`
                                : `${itemCount} รายการ`
                            }
                        </Text>
                    </div>
                    
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {previewItems.map((item) => (
                            <div 
                                key={item.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '6px 10px',
                                    background: '#f5f5f5',
                                    borderRadius: 10
                                }}
                            >
                                <Avatar
                                    src={item.ingredient?.img_url || 'https://placehold.co/32x32/f5f5f5/999999?text=📦'}
                                    size={28}
                                    shape="square"
                                    style={{ borderRadius: 6 }}
                                />
                                <div>
                                    <Text 
                                        style={{ fontSize: 12, display: 'block' }}
                                        ellipsis={{ tooltip: item.ingredient?.display_name }}
                                    >
                                        {item.ingredient?.display_name}
                                    </Text>
                                    <Text type="secondary" style={{ fontSize: 11 }}>
                                        {item.ordersDetail?.is_purchased 
                                            ? item.ordersDetail.actual_quantity 
                                            : item.quantity_ordered
                                        } {item.ingredient?.unit?.display_name}
                                    </Text>
                                </div>
                            </div>
                        ))}
                        {moreItems > 0 && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '6px 12px',
                                background: '#e6f4ff',
                                borderRadius: 10,
                                color: '#1890ff',
                                fontWeight: 600,
                                fontSize: 12
                            }}>
                                +{moreItems} อื่นๆ
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============ EMPTY STATE COMPONENT ============

export const EmptyState = () => (
    <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
            <div style={{ textAlign: 'center' }}>
                <Text type="secondary" style={{ fontSize: 15 }}>
                    ยังไม่มีประวัติการสั่งซื้อ
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: 13 }}>
                    เมื่อมีการสั่งซื้อเสร็จสิ้นหรือยกเลิก จะแสดงที่นี่
                </Text>
            </div>
        }
        style={{
            padding: '60px 20px',
            background: 'white',
            borderRadius: 20,
            margin: '0 16px'
        }}
    />
);
