"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Col, Input, Modal, Row, Space, Tag, Typography, message } from "antd";
import { RocketOutlined, PlusOutlined, ClockCircleOutlined, DownOutlined, CheckCircleOutlined } from "@ant-design/icons";
import PageContainer from "../../../../../components/ui/page/PageContainer";
import PageSection from "../../../../../components/ui/page/PageSection";
import UIPageHeader from "../../../../../components/ui/page/PageHeader";
import UIEmptyState from "../../../../../components/ui/states/EmptyState";
import PageState from "../../../../../components/ui/states/PageState";
import { t } from "../../../../../utils/i18n";
import { useDelivery } from "../../../../../hooks/pos/useDelivery";
import { OrderStatus, OrderType, SalesOrderSummary } from "../../../../../types/api/pos/salesOrder";
import { Delivery } from "../../../../../types/api/pos/delivery";
import { posPageStyles, channelColors, tableColors } from "../../../../../theme/pos";
import { channelPageStyles, channelsResponsiveStyles } from "../../../../../theme/pos/channels/style";
import { POSGlobalStyles } from "../../../../../theme/pos/GlobalStyles";
import { getOrderChannelStats, getOrderColorScheme, formatOrderStatus } from "../../../../../utils/channels";
import { getOrderNavigationPath } from "../../../../../utils/orders";
import { useGlobalLoading } from "../../../../../contexts/pos/GlobalLoadingContext";
import { useChannelOrders } from "../../../../../utils/pos/channelOrders";
import RequireOpenShift from "../../../../../components/pos/shared/RequireOpenShift";
import { useAuth } from "../../../../../contexts/AuthContext";
import { useEffectivePermissions } from "../../../../../hooks/useEffectivePermissions";
import { resolveImageSource } from "../../../../../utils/image/source";
import SmartAvatar from "../../../../../components/ui/image/SmartAvatar";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import 'dayjs/locale/th';

const { Text } = Typography;
dayjs.extend(relativeTime);
dayjs.locale('th');

const pendingOrderColors = {
    primary: "#EAB308",
    light: "#FEFCE8",
    border: "#FDE68A",
    text: "#854D0E",
};

const waitingToShipColors = {
    primary: "#EC4899",
    light: "#FDF2F8",
    border: "#F9A8D4",
    text: "#9D174D",
};

export default function DeliverySelectionPage() {
    return (
        <RequireOpenShift>
            <DeliverySelectionPageContent />
        </RequireOpenShift>
    );
}

function DeliverySelectionPageContent() {
    const router = useRouter();
    const { showLoading, hideLoading } = useGlobalLoading();
    const { deliveryProviders, isLoading: isLoadingProviders, isError: deliveryError, mutate: refetchProviders } = useDelivery();
    const { orders, isLoading } = useChannelOrders({ orderType: OrderType.Delivery });
    const loadingKey = "pos:channels:delivery";
    const navigateLoadingKey = "pos:channels:delivery:navigate";
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { user } = useAuth();
    const { can } = useEffectivePermissions({ enabled: Boolean(user?.id) });
    const canCreateOrder = can("orders.page", "create");

    const stats = useMemo(() => getOrderChannelStats(orders), [orders]);

    // New Order Modal State
    const [deliveryCode, setDeliveryCode] = useState("");
    const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
    const [isProviderSelectorOpen, setIsProviderSelectorOpen] = useState(false);
    const selectedProvider = useMemo(() =>
        (deliveryProviders as Delivery[]).find((p: Delivery) => p.id === selectedProviderId),
        [deliveryProviders, selectedProviderId]);
    const selectedProviderLogo = resolveImageSource(selectedProvider?.logo);


    useEffect(() => {
        if (isLoading || isLoadingProviders) {
            showLoading(t("delivery.loadingOrders"), loadingKey);
        } else {
            hideLoading(loadingKey);
        }
        return () => {
            hideLoading(loadingKey);
            hideLoading(navigateLoadingKey);
        };
    }, [isLoading, isLoadingProviders, showLoading, hideLoading, loadingKey, navigateLoadingKey]);

    const handleBack = () => {
        router.push('/pos/channels');
    };

    const handleOrderClick = (order: (typeof orders)[number]) => {
        const path = getOrderNavigationPath(order);
        router.push(path);
    };

    const handleCreateOrderClick = () => {
        if (!canCreateOrder) {
            message.warning("คุณไม่มีสิทธิ์สร้างออเดอร์");
            return;
        }
        setDeliveryCode("");
        setSelectedProviderId(null);
        setIsModalOpen(true);
    };

    const handleConfirmCreate = () => {
        if (!canCreateOrder) {
            message.warning("คุณไม่มีสิทธิ์สร้างออเดอร์");
            return;
        }
        if (!selectedProviderId) {
            message.error("กรุณาเลือกผู้ให้บริการ");
            return;
        }
        if (!deliveryCode.trim()) {
            message.error("กรุณากรอกรหัสออเดอร์");
            return;
        }

        showLoading("กำลังเข้าสู่หน้าออเดอร์...", navigateLoadingKey);

        let finalCode = deliveryCode.trim();
        if (selectedProvider?.delivery_prefix) {
            finalCode = `${selectedProvider.delivery_prefix}-${finalCode}`;
        }

        // Navigate to buying page with params
        router.push(`/pos/channels/delivery/${selectedProviderId}?code=${encodeURIComponent(finalCode)}`);
    };

    const getStatusColor = (order: SalesOrderSummary, colorScheme: string) => {
        if (order.status === OrderStatus.Pending) return "gold";
        if (order.status === OrderStatus.WaitingForPayment) return "magenta";

        switch (colorScheme) {
            case "available": return "success";
            case "occupied": return "orange";
            case "waitingForPayment": return "blue";
            default: return "default";
        }
    };

    const getCardColors = (order: SalesOrderSummary, colorScheme: string) => {
        if (order.status === OrderStatus.Pending) {
            return pendingOrderColors;
        }
        if (order.status === OrderStatus.WaitingForPayment) {
            return waitingToShipColors;
        }
        return tableColors[colorScheme as keyof typeof tableColors] || tableColors.inactive;
    };

    const getDeliveryStatusText = (status: OrderStatus) => {
        if (status === OrderStatus.WaitingForPayment) {
            return "รอส่ง";
        }
        if (status === OrderStatus.Served) {
            return "ทำแล้ว";
        }
        return formatOrderStatus(status);
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
                <UIPageHeader
                    title="เดลิเวอรี่"
                    subtitle={
                        <Space size={8} wrap>
                            <Tag>ทั้งหมด {stats.total}</Tag>
                            <Tag color="orange">กำลังปรุง {stats.cooking}</Tag>
                        </Space>
                    }
                    onBack={handleBack}
                    icon={<RocketOutlined style={{ fontSize: 20 }} />}
                    actions={
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateOrderClick} disabled={!canCreateOrder}>
                            เพิ่มออเดอร์
                        </Button>
                    }
                />

        <PageContainer>
            {deliveryError ? (
                <PageState
                    status="error"
                    title={t("page.error")}
                    error={deliveryError}
                    onRetry={() => refetchProviders()}
                />
            ) : !isLoadingProviders && deliveryProviders.length === 0 ? (
                <PageState status="empty" title={t("delivery.noProviders")} action={
                    <Button onClick={() => refetchProviders()}>{t("delivery.retry")}</Button>
                } />
            ) : (
            <PageSection title="ออเดอร์">
                    {orders.length > 0 ? (
                        <Row gutter={[16, 16]}>
                            {orders.map((order: SalesOrderSummary, index) => {
                                const colorScheme = getOrderColorScheme(order);
                                const colors = getCardColors(order, colorScheme);
                                const provider = (deliveryProviders as Delivery[]).find((d: Delivery) => d.id === order.delivery_id);
                                const providerLogo = resolveImageSource(provider?.logo);
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
                                            aria-label={`ออเดอร์ ${orderNum} - ${getDeliveryStatusText(order.status)}`}
                                        >
                                            {/* Card Header */}
                                            <div style={{
                                                ...channelPageStyles.orderCardHeader,
                                                background: colors.light,
                                                flexWrap: "wrap",
                                                rowGap: 8,
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <SmartAvatar
                                                        src={provider?.logo}
                                                        alt={provider?.delivery_name || "Delivery"}
                                                        shape="square"
                                                        size={40}
                                                        icon={<RocketOutlined />}
                                                        imageStyle={{ objectFit: "contain" }}
                                                        style={{
                                                            borderRadius: 12,
                                                            background: providerLogo ? "#ffffff" : `${colors.primary}20`,
                                                            color: colors.primary,
                                                            border: `1px solid ${colors.border}`,
                                                            boxShadow: providerLogo ? "0 2px 8px rgba(15, 23, 42, 0.06)" : "none",
                                                            flex: "0 0 auto",
                                                        }}
                                                    />
                                                    <div>
                                                        <Text strong style={{ fontSize: 16, color: '#1E293B', display: 'block', lineHeight: 1.2 }}>{orderNum}</Text>
                                                        <Text type="secondary" style={{ fontSize: 11 }}>{provider?.delivery_name || 'Delivery'}</Text>
                                                    </div>
                                                </div>
                                                <Tag
                                                    color={getStatusColor(order, colorScheme)}
                                                    style={{ borderRadius: 8, margin: 0, fontWeight: 600, border: 'none', padding: '4px 12px' }}
                                                >
                                                    {getDeliveryStatusText(order.status)}
                                                </Tag>
                                            </div>

                                            {/* Card Content */}
                                            <div style={channelPageStyles.orderCardContent}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                                                    <div>
                                                        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>รายการสินค้า</Text>
                                                        <Text strong style={{ fontSize: 16 }}>{order.items_count || 0} รายการ</Text>
                                                    </div>
                                                    <div style={{ textAlign: 'right', marginLeft: 'auto' }}>
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
                        <UIEmptyState
                            title={t("delivery.noOrders")}
                            description="เริ่มรับออเดอร์โดยกดปุ่ม “เพิ่มออเดอร์”"
                            action={
                                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateOrderClick}>
                                    {t("delivery.createNewOrder")}
                                </Button>
                            }
                        />
                    )}
                    </PageSection>
                )}
                </PageContainer>

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
                                <div style={{ fontSize: 18, fontWeight: 700, color: '#1E293B' }}>{t("delivery.createOrder")}</div>
                                <div style={{ fontSize: 13, fontWeight: 400, color: '#94A3B8' }}>{t("delivery.createOrderSubtitle")}</div>
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
                        disabled: isLoadingProviders || !selectedProviderId || !deliveryCode.trim()
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
                                {t("delivery.selectProvider")}
                            </Text>
                            <div
                                onClick={() => setIsProviderSelectorOpen(true)}
                                style={{
                                    padding: '10px 16px',
                                    borderRadius: 12,
                                    border: '2px solid',
                                    cursor: 'pointer',
                                    background: selectedProviderId ? 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)' : '#fff',
                                    borderColor: selectedProviderId ? '#4F46E5' : '#e2e8f0',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    minHeight: 46
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    {selectedProvider ? (
                                        <>
                                            <SmartAvatar
                                                src={selectedProvider.logo}
                                                alt={selectedProvider.delivery_name}
                                                shape="square"
                                                size={24}
                                                icon={<RocketOutlined />}
                                                imageStyle={{ objectFit: "contain" }}
                                                style={{
                                                    borderRadius: 6,
                                                    background: selectedProviderLogo ? "#ffffff" : channelColors.delivery.light,
                                                    color: channelColors.delivery.primary,
                                                    border: `1px solid ${channelColors.delivery.border}`,
                                                }}
                                            />
                                            <span style={{ color: '#1e293b', fontWeight: 600 }}>
                                                {selectedProvider.delivery_name}
                                            </span>
                                        </>
                                    ) : (
                                        <span style={{ color: '#94a3b8' }}>{t("delivery.selectProviderPlaceholder")}</span>
                                    )}
                                </div>
                                <DownOutlined style={{ fontSize: 12, color: '#94a3b8' }} />
                            </div>
                        </div>
                        <div>
                            <Text strong style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#475569' }}>
                                {t("delivery.orderCode")}
                            </Text>
                            <Input
                                placeholder={t("delivery.enterOrderCode")}
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

                {/* Provider Selection Modal */}
                <Modal
                    title={t("delivery.selectProvider")}
                    open={isProviderSelectorOpen}
                    onCancel={() => setIsProviderSelectorOpen(false)}
                    footer={null}
                    centered
                    width={400}
                    styles={{ body: { padding: '12px 16px 24px' } }}
                >
                     <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '60vh', overflowY: 'auto' }}>
                        {(deliveryProviders as Delivery[]).map(provider => {
                            const logoSource = resolveImageSource(provider.logo);
                            const isSelected = selectedProviderId === provider.id;
                            return (
                                <div
                                    key={provider.id}
                                    onClick={() => {
                                        setSelectedProviderId(provider.id);
                                        setIsProviderSelectorOpen(false);
                                    }}
                                    style={{
                                        padding: '14px 18px',
                                        border: '2px solid',
                                        borderRadius: 12,
                                        cursor: 'pointer',
                                        background: isSelected ? '#eff6ff' : '#fff',
                                        borderColor: isSelected ? '#3b82f6' : '#e5e7eb',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        minHeight: 54
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <SmartAvatar
                                            src={provider.logo}
                                            alt={provider.delivery_name}
                                            shape="square"
                                            size={32}
                                            icon={<RocketOutlined />}
                                            imageStyle={{ objectFit: "contain" }}
                                            style={{
                                                borderRadius: 8,
                                                background: logoSource ? "#ffffff" : channelColors.delivery.light,
                                                color: channelColors.delivery.primary,
                                                border: `1px solid ${channelColors.delivery.border}`,
                                                flex: "0 0 auto",
                                            }}
                                        />
                                        <div style={{ minWidth: 0, display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
                                            <Text
                                                style={{
                                                    fontSize: 14,
                                                    fontWeight: isSelected ? 600 : 500,
                                                    color: "#1E293B",
                                                }}
                                            >
                                                {provider.delivery_name}
                                            </Text>
                                            {provider.delivery_prefix ? (
                                                <Text type="secondary" style={{ fontSize: 11 }}>
                                                    Prefix: {provider.delivery_prefix}
                                                </Text>
                                            ) : null}
                                        </div>
                                    </div>
                                    {isSelected && <CheckCircleOutlined style={{ color: '#3b82f6', fontSize: 18 }} />}
                                </div>
                            );
                        })}
                    </div>
                </Modal>
            </div>
        </>
    );
}
