"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Typography, Row, Col, Card, Empty, Spin, Modal, Input, message, Button, Tag, Select, Space } from "antd";
import { RocketOutlined, CarOutlined, PlusOutlined, UserOutlined, ShoppingOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useDelivery } from "../../../../../hooks/pos/useDelivery";
import { ordersService } from "../../../../../services/pos/orders.service";
import { SalesOrder, OrderStatus, OrderType } from "../../../../../types/api/pos/salesOrder";
import { getOrderStatusColor, getOrderStatusText } from "../../../../../utils/orders";
import { posPageStyles, channelColors, posColors } from "@/theme/pos";
import { useGlobalLoading } from "../../../../../contexts/pos/GlobalLoadingContext";
import dayjs from "dayjs";
import 'dayjs/locale/th';
import relativeTime from "dayjs/plugin/relativeTime";

const { Title, Text } = Typography;
dayjs.extend(relativeTime);
dayjs.locale('th');

export default function DeliverySelectionPage() {
    const router = useRouter();
    const { deliveryProviders, isLoading: isLoadingProviders } = useDelivery();
    const { showLoading, hideLoading } = useGlobalLoading();
    
    // State
    const [orders, setOrders] = useState<SalesOrder[]>([]);
    const [isLoadingOrders, setIsLoadingOrders] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // New Order Modal State
    const [deliveryCode, setDeliveryCode] = useState("");
    const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);

    const fetchOrders = useCallback(async () => {
        setIsLoadingOrders(true);
        try {
            const res = await ordersService.getAll(undefined, 1, 100, undefined, OrderType.Delivery);
            const activeOrders = res.data.filter(o => 
                o.order_type === OrderType.Delivery &&
                o.status !== OrderStatus.Paid && 
                o.status !== OrderStatus.Cancelled
            );
            setOrders(activeOrders);
        } catch (error) {
            // Silent error
        } finally {
            setIsLoadingOrders(false);
        }
    }, []);

    const handleBack = () => {
        router.push('/pos/channels');
    };

    const handleOrderClick = (orderId: string) => {
        router.push(`/pos/orders/${orderId}`);
    };

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 15000);
        return () => clearInterval(interval);
    }, [fetchOrders]);

    const handleCreateOrderClick = () => {
        setDeliveryCode("");
        setSelectedProviderId(null);
        setIsModalOpen(true);
    };

    const handleConfirmCreate = () => {
        if (!selectedProviderId) {
            message.error("กรุณาเลือกผู้ให้บริการ");
            return;
        }
        if (!deliveryCode.trim()) {
            message.error("กรุณากรอกรหัสออเดอร์");
            return;
        }
        
        // Navigate to buying page with params
        router.push(`/pos/channels/delivery/${selectedProviderId}?code=${encodeURIComponent(deliveryCode)}`);
    };

    return (
        <div style={posPageStyles.container}>
            {/* Hero Header */}
            <div style={{ 
                ...posPageStyles.heroParams, 
                background: channelColors.delivery.gradient,
                boxShadow: '0 8px 32px rgba(114, 46, 209, 0.3)',
                paddingBottom: 100,
                borderRadius: '0 0 40px 40px'
            }}>
                <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                            <Button 
                                type="text"
                                icon={<ArrowLeftOutlined style={{ fontSize: 24, color: '#fff' }} />}
                                onClick={handleBack}
                                style={{ 
                                    width: 48, 
                                    height: 48, 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    background: 'rgba(255,255,255,0.2)',
                                    borderRadius: '50%',
                                    border: 'none'
                                }}
                            />
                            <div style={posPageStyles.sectionTitle}>
                                <RocketOutlined style={{ fontSize: 36, color: '#fff' }} />
                                <div>
                                    <Title level={2} style={{ margin: 0, color: '#fff', fontWeight: 800 }}>เดลิเวอรี่ (Delivery)</Title>
                                    <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16 }}>
                                        รายการออเดอร์ที่กำลังดำเนินการ ({orders.length})
                                    </Text>
                                </div>
                            </div>
                        </div>

                        <Button 
                            type="primary" 
                            size="large"
                            icon={<PlusOutlined />}
                            onClick={handleCreateOrderClick}
                            style={{ 
                                height: 56, 
                                borderRadius: 16, 
                                padding: '0 32px',
                                fontSize: 18,
                                fontWeight: 700,
                                background: '#fff',
                                color: channelColors.delivery.primary,
                                border: 'none',
                                boxShadow: '0 10px 20px rgba(0,0,0,0.15)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8
                            }}
                        >
                            เพิ่มออเดอร์ใหม่
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content Subsection */}
            <div style={{ maxWidth: 1200, margin: '-50px auto 0', padding: '0 24px 80px', position: 'relative', zIndex: 20 }}>
                {isLoadingOrders && orders.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "80px", background: '#fff', borderRadius: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
                        <Spin size="large" />
                        <div style={{ marginTop: 16, color: '#8c8c8c' }}>กำลังดึงข้อมูลออเดอร์...</div>
                    </div>
                ) : orders.length > 0 ? (
                    <div style={{ marginBottom: 40 }}>
                        <Title level={4} style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, color: '#595959' }}>
                            <CarOutlined style={{ color: channelColors.delivery.primary }} />
                            รายการออเดอร์ปัจจุปัน
                        </Title>
                        <Row gutter={[24, 24]}>
                            {orders.map((order) => {
                                const itemCount = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
                                const provider = deliveryProviders.find(d => d.id === order.delivery_id);
                                
                                return (
                                    <Col xs={24} sm={12} md={8} lg={6} key={order.id}>
                                        <div 
                                            className="delivery-order-card"
                                            style={{ 
                                                ...posPageStyles.card,
                                                cursor: 'pointer',
                                                height: '100%',
                                                position: 'relative',
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                border: '1px solid #f0f0f0',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
                                            }}
                                            onClick={() => handleOrderClick(order.id)}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-8px)';
                                                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)';
                                                e.currentTarget.style.borderColor = channelColors.delivery.primary;
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)';
                                                e.currentTarget.style.borderColor = '#f0f0f0';
                                            }}
                                        >
                                            <div style={{ padding: '24px 20px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                                                    <Space direction="vertical" size={4}>
                                                        <Tag 
                                                            color={channelColors.delivery.primary}
                                                            style={{ 
                                                                margin: 0, 
                                                                borderRadius: 4, 
                                                                fontSize: 12,
                                                                fontWeight: 700,
                                                                textTransform: 'uppercase'
                                                            }}
                                                        >
                                                            {provider?.delivery_name || 'DELIVERY'}
                                                        </Tag>
                                                        <Text strong style={{ fontSize: 14, color: '#8c8c8c' }}>
                                                            {dayjs(order.create_date).fromNow()}
                                                        </Text>
                                                    </Space>
                                                    
                                                    <Tag 
                                                        color={getOrderStatusColor(order.status)}
                                                        style={{ 
                                                            margin: 0, 
                                                            padding: '4px 12px', 
                                                            borderRadius: 20, 
                                                            fontSize: 13,
                                                            fontWeight: 600,
                                                            border: 'none',
                                                            boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
                                                        }}
                                                    >
                                                        {getOrderStatusText(order.status)}
                                                    </Tag>
                                                </div>

                                                <div style={{ marginBottom: 24 }}>
                                                    <Title level={4} style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1f1f1f' }}>
                                                        {order.delivery_code || `Order: #${order.order_no.split('-').pop()}`}
                                                    </Title>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                                        <UserOutlined style={{ color: '#bfbfbf' }} />
                                                        <Text style={{ color: '#595959' }}>
                                                            {order.created_by?.display_name || 'ลูกค้าทั่วไป'}
                                                        </Text>
                                                    </div>
                                                </div>

                                                <div style={{ 
                                                    display: 'flex', 
                                                    justifyContent: 'space-between', 
                                                    alignItems: 'end',
                                                    paddingTop: 16,
                                                    borderTop: '1px dashed #f0f0f0' 
                                                }}>
                                                    <div>
                                                        <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>รายการสินค้า</Text>
                                                        <Text strong style={{ fontSize: 16 }}>{itemCount} ชิ้น</Text>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>ยอดรวม</Text>
                                                        <Text strong style={{ color: channelColors.delivery.primary, fontSize: 22 }}>
                                                            ฿{Number(order.total_amount).toLocaleString()}
                                                        </Text>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Status Progress Bar */}
                                            <div style={{ 
                                                height: 6, 
                                                background: getOrderStatusColor(order.status) === 'orange' ? '#faad14' : 
                                                           getOrderStatusColor(order.status) === 'blue' ? '#1890ff' : 
                                                           getOrderStatusColor(order.status) === 'green' ? '#52c41a' : '#d9d9d9',
                                                width: '100%',
                                                position: 'absolute',
                                                bottom: 0,
                                                left: 0,
                                                borderRadius: '0 0 16px 16px'
                                            }} />
                                        </div>
                                    </Col>
                                );
                            })}
                        </Row>
                    </div>
                ) : (
                    <div style={{ 
                        background: '#fff', 
                        borderRadius: 24, 
                        padding: '80px 24px', 
                        textAlign: 'center',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.06)' 
                    }}>
                        <Empty 
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={
                                <div style={{ marginTop: 16 }}>
                                    <Title level={4} style={{ marginBottom: 8 }}>ไม่มีออเดอร์เดลิเวอรี่</Title>
                                    <Text type="secondary">เริ่มรับออเดอร์โดยกดปุ่ม "เพิ่มออเดอร์"</Text>
                                </div>
                            } 
                        />
                        <Button 
                            type="primary" 
                            size="large" 
                            icon={<PlusOutlined />} 
                            onClick={handleCreateOrderClick}
                            style={{ 
                                marginTop: 24, 
                                background: channelColors.delivery.primary,
                                borderColor: channelColors.delivery.primary,
                                height: 44,
                                borderRadius: 10,
                                padding: '0 32px'
                            }}
                        >
                            สร้างออเดอร์ใหม่
                        </Button>
                    </div>
                )}
            </div>

            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <RocketOutlined style={{ color: channelColors.delivery.primary }} />
                        <span>เปิดออเดอร์เดลิเวอรี่ใหม่</span>
                    </div>
                }
                open={isModalOpen}
                onOk={handleConfirmCreate}
                onCancel={() => setIsModalOpen(false)}
                okText="ยืนยัน"
                cancelText="ยกเลิก"
                centered
                okButtonProps={{ 
                    style: { background: channelColors.delivery.primary, borderColor: channelColors.delivery.primary },
                    disabled: !selectedProviderId || !deliveryCode.trim()
                }}
            >
                <div style={{ paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                        <Text strong style={{ display: 'block', marginBottom: 8 }}>เลือกผู้ให้บริการ (Delivery Provider)</Text>
                        <Select
                            placeholder="เลือกผู้ให้บริการ"
                            style={{ width: '100%' }}
                            size="large"
                            value={selectedProviderId}
                            onChange={setSelectedProviderId}
                            options={deliveryProviders.map(p => ({ label: p.delivery_name, value: p.id }))}
                            loading={isLoadingProviders}
                        />
                    </div>
                    <div>
                        <Text strong style={{ display: 'block', marginBottom: 8 }}>รหัสเดลิเวอรี่ / Order Code</Text>
                        <Input 
                            placeholder="ระบุรหัสออเดอร์ (เช่น #A001)" 
                            value={deliveryCode}
                            onChange={(e) => setDeliveryCode(e.target.value)}
                            size="large"
                            onPressEnter={handleConfirmCreate}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
}
