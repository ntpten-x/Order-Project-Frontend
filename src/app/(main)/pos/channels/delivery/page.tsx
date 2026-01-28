"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Typography, Row, Col, Card, Empty, Spin, Modal, Input, message, Button, Tag, Select } from "antd";
import { RocketOutlined, CarOutlined, PlusOutlined, UserOutlined, ShoppingOutlined } from "@ant-design/icons";
import { useDelivery } from "../../../../../hooks/pos/useDelivery";
import { ordersService } from "../../../../../services/pos/orders.service";
import { SalesOrder, OrderStatus, OrderType } from "../../../../../types/api/pos/salesOrder";
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

    const handleOrderClick = (orderId: string) => {
        router.push(`/pos/orders/${orderId}`);
    };

    return (
        <div style={posPageStyles.container}>
            {/* Hero Header */}
            <div style={{ 
                ...posPageStyles.heroParams, 
                background: channelColors.delivery.gradient,
                boxShadow: '0 8px 24px rgba(114, 46, 209, 0.25)',
                paddingBottom: 80
            }}>
                <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={posPageStyles.sectionTitle}>
                            <RocketOutlined style={{ fontSize: 32, color: '#fff' }} />
                            <div>
                                <Title level={2} style={{ margin: 0, color: '#fff' }}>เดลิเวอรี่ (Delivery)</Title>
                                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16 }}>
                                    รายการออเดอร์ที่กำลังดำเนินการ
                                </Text>
                            </div>
                        </div>
                        <Button 
                            type="primary" 
                            size="large"
                            icon={<PlusOutlined />}
                            onClick={handleCreateOrderClick}
                            style={{ 
                                height: 48, 
                                borderRadius: 12, 
                                padding: '0 24px',
                                fontSize: 16,
                                fontWeight: 600,
                                background: '#fff',
                                color: channelColors.delivery.primary,
                                border: 'none',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}
                        >
                            เพิ่มออเดอร์
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div style={{ maxWidth: 1200, margin: '-50px auto 0', padding: '0 24px 40px', position: 'relative', zIndex: 20 }}>
                {isLoadingOrders && orders.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "80px", background: '#fff', borderRadius: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
                        <Spin size="large" />
                        <div style={{ marginTop: 16, color: '#8c8c8c' }}>กำลังโหลดข้อมูล...</div>
                    </div>
                ) : orders.length > 0 ? (
                    <Row gutter={[24, 24]}>
                        {orders.map((order) => {
                            const itemCount = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
                            // Need to find delivery provider name from ID if possible, but SalesOrder might not populate it fully
                            // Assuming delivery_id is provider id.
                            const provider = deliveryProviders.find(d => d.id === order.delivery_id);
                            
                            return (
                                <Col xs={24} sm={12} md={8} lg={6} key={order.id}>
                                    <div 
                                        className="hover-card"
                                        style={{ 
                                            ...posPageStyles.card,
                                            border: 'none', 
                                            cursor: 'pointer',
                                            height: '100%',
                                            position: 'relative',
                                            transition: 'all 0.3s ease',
                                        }}
                                        onClick={() => handleOrderClick(order.id)}
                                    >
                                        <div style={{ padding: 20 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                                <Tag 
                                                    style={{ 
                                                        margin: 0, 
                                                        padding: '4px 10px', 
                                                        borderRadius: 6, 
                                                        background: channelColors.delivery.light, 
                                                        color: channelColors.delivery.primary,
                                                        border: `1px solid ${channelColors.delivery.border}`,
                                                        fontSize: 14,
                                                        fontWeight: 600,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 6
                                                    }}
                                                >
                                                    <CarOutlined />
                                                    {provider?.delivery_name || 'Delivery'}
                                                </Tag>
                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                    {dayjs(order.create_date).fromNow()}
                                                </Text>
                                            </div>

                                            <div style={{ marginBottom: 20 }}>
                                                <Title level={4} style={{ margin: 0, marginBottom: 4 }}>
                                                    {order.delivery_code || order.order_no}
                                                </Title>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <UserOutlined style={{ color: '#8c8c8c' }} />
                                                    <Text type="secondary">
                                                        Code: {order.delivery_code || '-'}
                                                    </Text>
                                                </div>
                                            </div>

                                            <div style={{ 
                                                display: 'flex', 
                                                justifyContent: 'space-between', 
                                                alignItems: 'center',
                                                paddingTop: 16,
                                                borderTop: '1px solid #f0f0f0' 
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <ShoppingOutlined style={{ color: channelColors.delivery.primary }} />
                                                    <Text strong>{itemCount} รายการ</Text>
                                                </div>
                                                <Text strong style={{ color: channelColors.delivery.primary, fontSize: 16 }}>
                                                    ฿{Number(order.total_amount).toLocaleString()}</Text>
                                            </div>
                                        </div>
                                         <div style={{ 
                                            height: 4, 
                                            background: order.status === OrderStatus.Cooking ? '#faad14' : 
                                                       order.status === OrderStatus.Served ? '#52c41a' : '#722ed1',
                                            width: '100%'
                                        }} />
                                    </div>
                                </Col>
                            );
                        })}
                    </Row>
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
