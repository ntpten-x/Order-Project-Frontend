"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Typography, Row, Col, Empty, Modal, Input, message, Button, Select, Tag } from "antd";
import { RocketOutlined, PlusOutlined, ArrowLeftOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { useDelivery } from "../../../../../hooks/pos/useDelivery";
import { OrderType, SalesOrderSummary } from "../../../../../types/api/pos/salesOrder";
import { Delivery } from "../../../../../types/api/pos/delivery";
import { posPageStyles, channelColors, tableColors } from "../../../../../theme/pos";
import { channelPageStyles, channelsResponsiveStyles } from "../../../../../theme/pos/channels/style";
import { POSGlobalStyles } from "../../../../../theme/pos/GlobalStyles";
import { getOrderChannelStats, getOrderColorScheme, formatOrderStatus } from "../../../../../utils/channels";
import { getOrderNavigationPath } from "../../../../../utils/orders";
import { useGlobalLoading } from "../../../../../contexts/pos/GlobalLoadingContext";
import { useChannelOrders } from "../../../../../utils/pos/channelOrders";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import 'dayjs/locale/th';

const { Title, Text } = Typography;
dayjs.extend(relativeTime);
dayjs.locale('th');

export default function DeliverySelectionPage() {
    const router = useRouter();
    const { showLoading, hideLoading } = useGlobalLoading();
    const { deliveryProviders, isLoading: isLoadingProviders } = useDelivery();
    const { orders, isLoading } = useChannelOrders({ orderType: OrderType.Delivery });
    const [isModalOpen, setIsModalOpen] = useState(false);

    const stats = useMemo(() => getOrderChannelStats(orders), [orders]);

    // New Order Modal State
    const [deliveryCode, setDeliveryCode] = useState("");
    const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
    const selectedProvider = useMemo(() =>
        (deliveryProviders as Delivery[]).find((p: Delivery) => p.id === selectedProviderId),
        [deliveryProviders, selectedProviderId]);

    useEffect(() => {
        if (isLoading || isLoadingProviders) {
            showLoading("กำลังโหลดออเดอร์...");
        } else {
            hideLoading();
        }
    }, [isLoading, isLoadingProviders, showLoading, hideLoading]);

    const handleBack = () => {
        router.push('/pos/channels');
    };

    const handleOrderClick = (order: (typeof orders)[number]) => {
        const path = getOrderNavigationPath(order);
        router.push(path);
    };

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

        showLoading("กำลังเข้าสู่หน้าออเดอร์...");

        let finalCode = deliveryCode.trim();
        if (selectedProvider?.delivery_prefix) {
            finalCode = `${selectedProvider.delivery_prefix}-${finalCode}`;
        }

        // Navigate to buying page with params
        router.push(`/pos/channels/delivery/${selectedProviderId}?code=${encodeURIComponent(finalCode)}`);
    };

    const getStatusColor = (colorScheme: string) => {
        switch (colorScheme) {
            case 'available': return 'success';
            case 'occupied': return 'orange';
            case 'waitingForPayment': return 'blue';
            default: return 'default';
        }
    };

    return (
        <>
            <POSGlobalStyles />
            <style jsx global>{channelsResponsiveStyles}</style>
            <style jsx global>{`
                /* Order Card Hover Effects */
                .order-card-hover {
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                }
                .order-card-hover:hover {
                    transform: translateY(-4px) !important;
                    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.1) !important;
                }
                .order-card-hover:active {
                    transform: translateY(-2px) scale(0.99) !important;
                }
                @media (hover: none) {
                    .order-card-hover:active {
                        transform: scale(0.98) !important;
                    }
                    .order-card-hover:hover {
                        transform: none !important;
                    }
                }
                /* Back button hover */
                .back-button-hover:hover {
                    background: rgba(255, 255, 255, 0.28) !important;
                    transform: translateX(-2px);
                }
                /* Add button hover */
                .add-button-hover:hover {
                    transform: translateY(-2px) !important;
                    box-shadow: 0 12px 24px rgba(139, 92, 246, 0.35) !important;
                }
                .add-button-hover:active {
                    transform: scale(0.98) !important;
                }
                /* Mobile-only styles */
                .hide-on-mobile { display: inline !important; }
                .show-on-mobile-inline { display: none !important; }
                @media (max-width: 768px) {
                    .hide-on-mobile { display: none !important; }
                    .show-on-mobile-inline { display: inline !important; }
                }
                /* Modal styling */
                .delivery-modal .ant-modal-content {
                    border-radius: 20px !important;
                    overflow: hidden;
                }
                .delivery-modal .ant-modal-header {
                    padding: 20px 24px 16px !important;
                    border-bottom: 1px solid #f0f0f0 !important;
                }
                .delivery-modal .ant-modal-body {
                    padding: 24px !important;
                }
                .delivery-modal .ant-modal-footer {
                    padding: 16px 24px 20px !important;
                    border-top: 1px solid #f0f0f0 !important;
                }
            `}</style>
            
            <div style={posPageStyles.container}>
                {/* Header Section */}
                <header
                    style={{ ...channelPageStyles.channelHeader, background: channelColors.delivery.gradient }}
                    className="delivery-header-mobile"
                    role="banner"
                >
                    <div className="header-pattern"></div>
                    <div className="header-circle circle-1"></div>
                    <div className="header-circle circle-2"></div>

                    <div style={channelPageStyles.channelHeaderContent} className="delivery-header-content-mobile">
                        {/* Back Button */}
                        <button
                            className="back-button-hover delivery-back-button-mobile"
                            style={channelPageStyles.channelBackButton}
                            onClick={handleBack}
                            aria-label="กลับไปหน้าเลือกช่องทาง"
                        >
                            <ArrowLeftOutlined />
                            <span>กลับ</span>
                        </button>

                        {/* Title Section */}
                        <div style={channelPageStyles.channelTitleSection} className="delivery-title-section-mobile">
                            <RocketOutlined style={channelPageStyles.channelHeaderIcon} className="delivery-header-icon-mobile" aria-hidden="true" />
                            <div>
                                <Title level={3} style={channelPageStyles.channelHeaderTitle} className="delivery-header-title-mobile">
                                    เดลิเวอรี่
                                </Title>
                                <Text style={channelPageStyles.channelHeaderSubtitle}>Delivery</Text>
                            </div>
                        </div>

                        {/* Statistics Bar */}
                        <div style={channelPageStyles.channelStatsBar} className="delivery-stats-bar-mobile">
                            <div style={channelPageStyles.statItem}>
                                <span style={{ ...channelPageStyles.statDot, background: '#fff' }} />
                                <Text style={channelPageStyles.statText}>ทั้งหมด {stats.total}</Text>
                            </div>
                            <div style={channelPageStyles.statItem}>
                                <span style={{ ...channelPageStyles.statDot, background: tableColors.occupied.primary }} />
                                <Text style={channelPageStyles.statText}>กำลังปรุง {stats.cooking}</Text>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Section */}
                <main style={{ maxWidth: 1400, margin: '0 auto', padding: '0 16px 32px' }} className="delivery-content-mobile" role="main">
                    {/* Add Order Button */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
                        <Button
                            type="primary"
                            size="large"
                            icon={<PlusOutlined />}
                            onClick={handleCreateOrderClick}
                            className="add-button-hover delivery-add-button-mobile"
                            style={{
                                ...channelPageStyles.addOrderButton,
                                background: channelColors.delivery.primary,
                                boxShadow: `0 8px 20px ${channelColors.delivery.primary}40`,
                            }}
                        >
                            <span className="hide-on-mobile">เพิ่มออเดอร์ใหม่</span>
                            <span className="show-on-mobile-inline">เพิ่ม</span>
                        </Button>
                    </div>

                    {orders.length > 0 ? (
                        <Row gutter={[16, 16]}>
                            {orders.map((order: SalesOrderSummary, index) => {
                                const colorScheme = getOrderColorScheme(order);
                                const colors = tableColors[colorScheme];
                                const provider = (deliveryProviders as Delivery[]).find((d: Delivery) => d.id === order.delivery_id);
                                const orderNum = order.delivery_code || order.order_no.split('-').pop();

                                return (
                                    <Col xs={24} sm={12} md={8} lg={6} xl={6} key={order.id} className="delivery-order-col-mobile">
                                        <article
                                            className={`order-card-hover delivery-order-card table-card-animate table-card-delay-${(index % 6) + 1}`}
                                            style={{
                                                ...channelPageStyles.orderCard,
                                                border: `1.5px solid ${colors.border}`,
                                            }}
                                            onClick={() => handleOrderClick(order)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    handleOrderClick(order);
                                                }
                                            }}
                                            role="button"
                                            tabIndex={0}
                                            aria-label={`ออเดอร์ ${orderNum} - ${formatOrderStatus(order.status)}`}
                                        >
                                            {/* Card Header */}
                                            <div style={{
                                                ...channelPageStyles.orderCardHeader,
                                                background: colors.light,
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <div style={{
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: 12,
                                                        background: `${colors.primary}20`,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}>
                                                        <RocketOutlined style={{ color: colors.primary, fontSize: 20 }} />
                                                    </div>
                                                    <div>
                                                        <Text strong style={{ fontSize: 16, color: '#1E293B', display: 'block', lineHeight: 1.2 }}>{orderNum}</Text>
                                                        <Text type="secondary" style={{ fontSize: 11 }}>{provider?.delivery_name || 'Delivery'}</Text>
                                                    </div>
                                                </div>
                                                <Tag
                                                    color={getStatusColor(colorScheme)}
                                                    style={{ borderRadius: 8, margin: 0, fontWeight: 600, border: 'none', padding: '4px 12px' }}
                                                >
                                                    {formatOrderStatus(order.status)}
                                                </Tag>
                                            </div>

                                            {/* Card Content */}
                                            <div style={channelPageStyles.orderCardContent}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                                    <div>
                                                        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>รายการสินค้า</Text>
                                                        <Text strong style={{ fontSize: 16 }}>{order.items_count || 0} รายการ</Text>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>ยอดรวม</Text>
                                                        <Text strong style={{ fontSize: 20, color: colors.primary }}>฿{order.total_amount?.toLocaleString()}</Text>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Card Footer */}
                                            <div style={channelPageStyles.orderCardFooter}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <ClockCircleOutlined style={{ fontSize: 12, color: '#94A3B8' }} />
                                                    <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(order.create_date).fromNow()}</Text>
                                                </div>
                                                <Tag
                                                    style={{
                                                        margin: 0,
                                                        borderRadius: 6,
                                                        background: channelColors.delivery.light,
                                                        color: channelColors.delivery.primary,
                                                        border: `1px solid ${channelColors.delivery.border}`,
                                                        fontSize: 11,
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    Delivery
                                                </Tag>
                                            </div>
                                        </article>
                                    </Col>
                                );
                            })}
                        </Row>
                    ) : (
                        <div style={channelPageStyles.emptyStateContainer}>
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description={
                                    <div style={{ marginTop: 16 }}>
                                        <Title level={4} style={{ marginBottom: 8, color: '#1E293B' }}>ไม่มีออเดอร์เดลิเวอรี่</Title>
                                        <Text type="secondary" style={{ fontSize: 15 }}>เริ่มรับออเดอร์โดยกดปุ่ม &quot;เพิ่มออเดอร์&quot;</Text>
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
                                    height: 52,
                                    borderRadius: 16,
                                    padding: '0 32px',
                                    fontWeight: 600,
                                    border: 'none',
                                    boxShadow: `0 8px 20px ${channelColors.delivery.primary}40`,
                                }}
                            >
                                สร้างออเดอร์ใหม่
                            </Button>
                        </div>
                    )}
                </main>

                {/* Create Order Modal */}
                <Modal
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                                width: 40,
                                height: 40,
                                borderRadius: 12,
                                background: channelColors.delivery.light,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <RocketOutlined style={{ color: channelColors.delivery.primary, fontSize: 20 }} />
                            </div>
                            <div>
                                <div style={{ fontSize: 18, fontWeight: 700, color: '#1E293B' }}>เปิดออเดอร์เดลิเวอรี่</div>
                                <div style={{ fontSize: 13, fontWeight: 400, color: '#94A3B8' }}>กรอกข้อมูลเพื่อสร้างออเดอร์ใหม่</div>
                            </div>
                        </div>
                    }
                    open={isModalOpen}
                    onOk={handleConfirmCreate}
                    onCancel={() => setIsModalOpen(false)}
                    okText="ยืนยัน"
                    cancelText="ยกเลิก"
                    centered
                    className="delivery-modal"
                    okButtonProps={{
                        style: {
                            background: channelColors.delivery.primary,
                            borderColor: channelColors.delivery.primary,
                            height: 44,
                            borderRadius: 12,
                            fontWeight: 600,
                            padding: '0 24px',
                        },
                        disabled: !selectedProviderId || !deliveryCode.trim()
                    }}
                    cancelButtonProps={{
                        style: {
                            height: 44,
                            borderRadius: 12,
                            fontWeight: 600,
                            padding: '0 24px',
                        }
                    }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div>
                            <Text strong style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#475569' }}>
                                เลือกผู้ให้บริการ (Delivery Provider)
                            </Text>
                            <Select
                                placeholder="เลือกผู้ให้บริการ"
                                style={{ width: '100%' }}
                                size="large"
                                value={selectedProviderId}
                                onChange={setSelectedProviderId}
                                options={(deliveryProviders as Delivery[]).map((p: Delivery) => ({ label: p.delivery_name, value: p.id }))}
                                loading={isLoadingProviders}
                            />
                        </div>
                        <div>
                            <Text strong style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#475569' }}>
                                รหัสเดลิเวอรี่ / Order Code
                            </Text>
                            <Input
                                placeholder="ระบุรหัสออเดอร์ (เช่น 123)"
                                addonBefore={selectedProvider?.delivery_prefix ? `${selectedProvider.delivery_prefix}-` : undefined}
                                value={deliveryCode}
                                onChange={(e) => setDeliveryCode(e.target.value)}
                                size="large"
                                onPressEnter={handleConfirmCreate}
                                style={{ borderRadius: 8 }}
                            />
                        </div>
                    </div>
                </Modal>
            </div>
        </>
    );
}
