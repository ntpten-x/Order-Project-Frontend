import React from "react";
import { Modal, Tag, Typography, Avatar, Button, Card, Space, Divider, Badge, Empty, Tooltip } from "antd";
import { 
    ShoppingCartOutlined, 
    UserOutlined, 
    CalendarOutlined, 
    FileTextOutlined,
    CheckCircleFilled,
    ClockCircleFilled,
    CloseCircleFilled,
    ShoppingOutlined
} from "@ant-design/icons";
import { Order, OrderStatus } from "../types/api/orders";
import { OrdersItem } from "../types/api/ordersDetail";

const { Text, Title } = Typography;

interface OrderDetailModalProps {
    order: Order | null;
    open: boolean;
    onClose: () => void;
}

// Status configuration for visual consistency
const statusConfig = {
    [OrderStatus.PENDING]: {
        color: '#faad14',
        bgColor: 'linear-gradient(135deg, #fffbe6 0%, #fff1b8 100%)',
        borderColor: '#ffe58f',
        icon: <ClockCircleFilled style={{ color: '#faad14' }} />,
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

// Info item component for consistent styling
const InfoItem = ({ icon, label, value, valueStyle }: { 
    icon: React.ReactNode; 
    label: string; 
    value: React.ReactNode;
    valueStyle?: React.CSSProperties;
}) => (
    <div style={{ 
        display: 'flex', 
        alignItems: 'flex-start', 
        gap: 12,
        padding: '12px 0',
    }}>
        <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 16,
            flexShrink: 0
        }}>
            {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
            <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{label}</Text>
            <div style={{ fontWeight: 500, marginTop: 2, ...valueStyle }}>{value}</div>
        </div>
    </div>
);

// Item card component for displaying order items
const ItemCard = ({ item, index }: { item: OrdersItem; index: number }) => {
    const isPurchased = item.ordersDetail?.is_purchased;
    const actual = item.ordersDetail?.actual_quantity;
    const ordered = item.quantity_ordered;
    const unit = item.ingredient?.unit?.display_name || '';
    const hasDifference = isPurchased && actual !== undefined && actual !== ordered;

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: 16,
                background: '#fafafa',
                borderRadius: 16,
                marginBottom: 12,
                border: '1px solid #f0f0f0',
                transition: 'all 0.3s ease',
                animation: `slideIn 0.3s ease ${index * 0.05}s both`,
            }}
            className="item-card"
        >
            {/* Product Image */}
            <Badge 
                count={isPurchased ? <CheckCircleFilled style={{ color: '#52c41a', fontSize: 16 }} /> : 0}
                offset={[-4, 4]}
            >
                <Avatar
                    src={item.ingredient?.img_url || 'https://placehold.co/60x60/f5f5f5/999999?text=📦'}
                    shape="square"
                    size={64}
                    style={{ 
                        borderRadius: 12,
                        border: '2px solid #fff',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        objectFit: 'cover'
                    }}
                />
            </Badge>

            {/* Product Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <Text 
                    strong 
                    style={{ 
                        fontSize: 15, 
                        display: 'block',
                        marginBottom: 4,
                        color: '#1a1a2e'
                    }}
                    ellipsis={{ tooltip: item.ingredient?.display_name }}
                >
                    {item.ingredient?.display_name || 'ไม่ทราบชื่อสินค้า'}
                </Text>
                <Text type="secondary" style={{ fontSize: 13 }}>
                    {item.ingredient?.description || 'ไม่มีรายละเอียดเพิ่มเติม'}
                </Text>
            </div>

            {/* Quantity Badge */}
            <div style={{ textAlign: 'right' }}>
                <div style={{
                    background: isPurchased 
                        ? 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)'
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    padding: '8px 14px',
                    borderRadius: 12,
                    fontWeight: 600,
                    fontSize: 14,
                    minWidth: 80,
                    textAlign: 'center',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.25)'
                }}>
                    {isPurchased ? actual : ordered} {unit}
                </div>
                {hasDifference && (
                    <Tooltip title="จำนวนที่สั่งเดิม">
                        <Text 
                            type="secondary" 
                            style={{ 
                                fontSize: 11, 
                                display: 'block',
                                marginTop: 4,
                                textDecoration: 'line-through'
                            }}
                        >
                            สั่ง {ordered} {unit}
                        </Text>
                    </Tooltip>
                )}
                {item.ordersDetail && !isPurchased && (
                    <Tag color="error" style={{ marginTop: 4 }}>ยังไม่ได้ซื้อ</Tag>
                )}
            </div>
        </div>
    );
};

export default function OrderDetailModal({ order, open, onClose }: OrderDetailModalProps) {
    if (!order) return null;

    const status = statusConfig[order.status] || statusConfig[OrderStatus.PENDING];
    const totalItems = order.ordersItems?.length || 0;
    const purchasedItems = order.ordersItems?.filter(item => item.ordersDetail?.is_purchased).length || 0;

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            width={520}
            centered
            className="order-detail-modal"
            style={{ top: 20 }}
            styles={{
                body: {
                    padding: 0,
                },
                mask: {
                    backdropFilter: 'blur(8px)',
                    background: 'rgba(0, 0, 0, 0.45)'
                }
            }}
            closeIcon={null}
        >
            {/* Header Section with Gradient */}
            <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '28px 24px 24px',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Decorative circles */}
                <div style={{
                    position: 'absolute',
                    top: -50,
                    right: -50,
                    width: 150,
                    height: 150,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)'
                }} />
                <div style={{
                    position: 'absolute',
                    bottom: -30,
                    left: -30,
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.08)'
                }} />

                {/* Header Content */}
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                                width: 48,
                                height: 48,
                                borderRadius: 14,
                                background: 'rgba(255,255,255,0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backdropFilter: 'blur(8px)'
                            }}>
                                <ShoppingCartOutlined style={{ fontSize: 24, color: 'white' }} />
                            </div>
                            <div>
                                <Text style={{ 
                                    color: 'rgba(255,255,255,0.8)', 
                                    fontSize: 13,
                                    display: 'block'
                                }}>
                                    รายละเอียดออเดอร์
                                </Text>
                                <Title level={4} style={{ 
                                    color: 'white', 
                                    margin: 0,
                                    fontWeight: 700,
                                    letterSpacing: '0.5px'
                                }}>
                                    #{order.id.substring(0, 8).toUpperCase()}
                                </Title>
                            </div>
                        </div>
                        
                        {/* Status Badge */}
                        <Tag
                            icon={status.icon}
                            style={{
                                background: status.bgColor,
                                border: `1px solid ${status.borderColor}`,
                                borderRadius: 20,
                                padding: '6px 14px',
                                fontSize: 13,
                                fontWeight: 600,
                                color: status.color,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6
                            }}
                        >
                            {status.label}
                        </Tag>
                    </div>

                    {/* Progress indicator for items */}
                    {totalItems > 0 && (
                        <div style={{ marginTop: 20 }}>
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                marginBottom: 8
                            }}>
                                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12 }}>
                                    ความคืบหน้า
                                </Text>
                                <Text style={{ color: 'white', fontWeight: 600, fontSize: 12 }}>
                                    {purchasedItems}/{totalItems} รายการ
                                </Text>
                            </div>
                            <div style={{
                                height: 6,
                                background: 'rgba(255,255,255,0.2)',
                                borderRadius: 3,
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    height: '100%',
                                    width: `${(purchasedItems / totalItems) * 100}%`,
                                    background: 'white',
                                    borderRadius: 3,
                                    transition: 'width 0.5s ease'
                                }} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Body Content */}
            <div style={{ padding: '20px 24px 24px' }}>
                {/* Order Information Card */}
                <Card
                    size="small"
                    style={{
                        borderRadius: 16,
                        border: 'none',
                        background: '#fff',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                        marginBottom: 20
                    }}
                    bodyStyle={{ padding: '8px 16px' }}
                >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                        <InfoItem 
                            icon={<UserOutlined />}
                            label="ผู้สั่งซื้อ"
                            value={order.ordered_by?.username || 'Unknown'}
                        />
                        <InfoItem 
                            icon={<CalendarOutlined />}
                            label="วันที่สั่ง"
                            value={new Date(order.create_date).toLocaleDateString('th-TH', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        />
                    </div>
                    {order.remark && (
                        <>
                            <Divider style={{ margin: '4px 0 8px' }} />
                            <InfoItem 
                                icon={<FileTextOutlined />}
                                label="หมายเหตุ"
                                value={order.remark}
                                valueStyle={{ color: '#8c8c8c', fontWeight: 400 }}
                            />
                        </>
                    )}
                </Card>

                {/* Items Section */}
                <div style={{ marginBottom: 20 }}>
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 8,
                        marginBottom: 16 
                    }}>
                        <ShoppingOutlined style={{ fontSize: 18, color: '#667eea' }} />
                        <Text strong style={{ fontSize: 16, color: '#1a1a2e' }}>
                            รายการสินค้า
                        </Text>
                        <div style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            padding: '2px 10px',
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 600
                        }}>
                            {totalItems} รายการ
                        </div>
                    </div>

                    {/* Items List */}
                    <div style={{ 
                        maxHeight: 300, 
                        overflowY: 'auto',
                        paddingRight: 4,
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#d9d9d9 transparent'
                    }}>
                        {order.ordersItems && order.ordersItems.length > 0 ? (
                            order.ordersItems.map((item, index) => (
                                <ItemCard key={item.id} item={item} index={index} />
                            ))
                        ) : (
                            <Empty 
                                description="ไม่มีรายการสินค้า" 
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                style={{ padding: '40px 0' }}
                            />
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div style={{ display: 'flex', gap: 12 }}>
                    <Button
                        type="primary"
                        block
                        size="large"
                        onClick={onClose}
                        style={{
                            height: 48,
                            borderRadius: 12,
                            fontWeight: 600,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            border: 'none',
                            boxShadow: '0 4px 16px rgba(102, 126, 234, 0.35)'
                        }}
                    >
                        ปิด
                    </Button>
                </div>
            </div>

            {/* CSS Animations */}
            <style>{`
                .order-detail-modal .ant-modal-content {
                    border-radius: 24px !important;
                    overflow: hidden;
                    padding: 0 !important;
                }
                
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .item-card:hover {
                    background: #f0f5ff !important;
                    border-color: #adc6ff !important;
                    transform: translateX(4px);
                }
                
                /* Custom scrollbar */
                *::-webkit-scrollbar {
                    width: 6px;
                }
                *::-webkit-scrollbar-track {
                    background: transparent;
                }
                *::-webkit-scrollbar-thumb {
                    background: #d9d9d9;
                    border-radius: 3px;
                }
                *::-webkit-scrollbar-thumb:hover {
                    background: #bfbfbf;
                }
            `}</style>
        </Modal>
    );
}
