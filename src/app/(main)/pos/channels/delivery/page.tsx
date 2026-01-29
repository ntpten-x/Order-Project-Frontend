"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Typography, Row, Col, Empty, Spin, Modal, Input, message, Button, Tag, Select, Space } from "antd";
import { RocketOutlined, PlusOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useDelivery } from "../../../../../hooks/pos/useDelivery";
import { ordersService } from "../../../../../services/pos/orders.service";
import { SalesOrder, OrderStatus, OrderType } from "../../../../../types/api/pos/salesOrder";
import { posPageStyles, channelColors, posColors, tableColors } from "@/theme/pos";
import { dineInPageStyles } from "@/theme/pos/dine-in.theme";
import { POSGlobalStyles } from "@/theme/pos/GlobalStyles";
import { getOrderChannelStats, getOrderColorScheme, formatOrderStatus } from "@/utils/channels";
import { getOrderNavigationPath } from "@/utils/orders";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import 'dayjs/locale/th';

const { Title, Text } = Typography;
dayjs.extend(relativeTime);
dayjs.locale('th');

export default function DeliverySelectionPage() {
    const router = useRouter();
    const { deliveryProviders, isLoading: isLoadingProviders } = useDelivery();
    const [orders, setOrders] = useState<SalesOrder[]>([]);
    const [isLoadingOrders, setIsLoadingOrders] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const stats = useMemo(() => getOrderChannelStats(orders), [orders]);

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

    const handleOrderClick = (order: SalesOrder) => {
        const path = getOrderNavigationPath(order);
        router.push(path);
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
        <>
            <POSGlobalStyles />
            <div style={posPageStyles.container}>
                {/* Header Section */}
                <div style={{ ...posPageStyles.channelHeader, background: channelColors.delivery.gradient }} className="delivery-header-mobile">
                    <div className="header-pattern"></div>

                    <div style={posPageStyles.channelHeaderContent} className="delivery-header-content-mobile">
                        {/* Back Button */}
                        <div
                            className="back-button-hover delivery-back-button-mobile"
                            style={posPageStyles.channelBackButton}
                            onClick={handleBack}
                        >
                            <ArrowLeftOutlined />
                            <span>กลับ</span>
                        </div>

                        {/* Title Section */}
                        <div style={posPageStyles.channelTitleSection} className="delivery-title-section-mobile">
                            <RocketOutlined style={posPageStyles.channelHeaderIcon} className="delivery-header-icon-mobile" />
                            <div>
                                <Title level={3} style={posPageStyles.channelHeaderTitle} className="delivery-header-title-mobile">
                                    เดลิเวอรี่
                                </Title>
                                <Text style={posPageStyles.channelHeaderSubtitle}>Delivery</Text>
                            </div>
                        </div>

                        {/* Statistics Bar */}
                        <div style={posPageStyles.channelStatsBar} className="delivery-stats-bar-mobile">
                            <div style={dineInPageStyles.statItem}>
                                <span style={{ ...dineInPageStyles.statDot, background: '#fff' }} />
                                <Text style={dineInPageStyles.statText}>ทั้งหมด {stats.total}</Text>
                            </div>
                            <div style={dineInPageStyles.statItem}>
                                <span style={{ ...dineInPageStyles.statDot, background: tableColors.occupied.primary }} />
                                <Text style={dineInPageStyles.statText}>กำลังปรุง {stats.cooking}</Text>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 16px 24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
                        <Button 
                            type="primary" 
                            size="large"
                            icon={<PlusOutlined />}
                            onClick={handleCreateOrderClick}
                            style={{ 
                                height: 48, 
                                borderRadius: 12, 
                                padding: '0 24px',
                                fontWeight: 700,
                                background: channelColors.delivery.primary,
                                border: 'none',
                                boxShadow: `0 8px 16px rgba(114, 46, 209, 0.25)`,
                            }}
                        >
                            เพิ่มออเดอร์ใหม่
                        </Button>
                    </div>

                {isLoadingOrders && orders.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "80px", background: '#fff', borderRadius: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
                        <Spin size="large" />
                        <div style={{ marginTop: 16, color: '#8c8c8c' }}>กำลังดึงข้อมูลออเดอร์...</div>
                    </div>
                ) : orders.length > 0 ? (
                    <Row gutter={[20, 20]}>
                        {orders.map((order, index) => {
                            const colorScheme = getOrderColorScheme(order);
                            const colors = tableColors[colorScheme];
                            const provider = deliveryProviders.find(d => d.id === order.delivery_id);
                            const orderNum = order.delivery_code || order.order_no.split('-').pop();

                            return (
                                <Col xs={12} sm={8} md={6} lg={4} key={order.id}>
                                    <div
                                        className={`delivery-order-card table-card-animate table-card-delay-${(index % 6) + 1}`}
                                        style={{
                                            ...posPageStyles.channelPageCard,
                                            background: colors.light,
                                            border: `2px solid ${colors.border}`,
                                        }}
                                        onClick={() => handleOrderClick(order)}
                                    >
                                        <div
                                            style={{
                                                ...posPageStyles.channelPageCardGradientOverlay,
                                                background: colors.gradient,
                                            }}
                                        />

                                        <div style={posPageStyles.channelPageCardInner}>
                                            <RocketOutlined
                                                style={{
                                                    ...posPageStyles.channelPageCardIcon,
                                                    color: colors.primary,
                                                }}
                                            />

                                            <div style={posPageStyles.channelPageCardMainText}>
                                                {orderNum}
                                            </div>

                                            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                                                <div style={{ fontSize: 12, fontWeight: 700, color: colors.primary, textTransform: 'uppercase' }}>
                                                    {provider?.delivery_name || 'DELIVERY'} • {dayjs(order.create_date).fromNow()}
                                                </div>
                                                <div
                                                    style={{
                                                        ...posPageStyles.channelPageCardStatusBadge,
                                                        background: colors.primary,
                                                        color: '#fff',
                                                    }}
                                                >
                                                    {formatOrderStatus(order.status)}
                                                </div>
                                            </div>
                                        </div>
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
        </>
    );
}
