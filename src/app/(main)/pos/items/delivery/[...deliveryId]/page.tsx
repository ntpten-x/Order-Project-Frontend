"use client";

import React, { useCallback, useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Typography, Row, Col, Card, Button, Empty, Divider, message, Tag, Result, Spin } from "antd";
import { ArrowLeftOutlined, ShopOutlined, RocketOutlined, CheckCircleOutlined, EditOutlined, InfoCircleOutlined, DownOutlined, UpOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { ordersService } from "../../../../../../services/pos/orders.service";
import { paymentMethodService } from "../../../../../../services/pos/paymentMethod.service";
import { paymentsService } from "../../../../../../services/pos/payments.service";
import { getCsrfTokenCached } from "../../../../../../utils/pos/csrf";
import { groupOrderItems } from "../../../../../../utils/orderGrouping";
import { SalesOrder, OrderStatus, OrderType } from "../../../../../../types/api/pos/salesOrder";
import { PaymentStatus } from "../../../../../../types/api/pos/payments";
import { itemsResponsiveStyles, itemsColors } from "../../../../../../theme/pos/items/style";
import { calculatePaymentTotals } from "../../../../../../utils/payments";
import dayjs from "dayjs";
import 'dayjs/locale/th';
import {
    getEditOrderNavigationPath,
    getCancelOrderNavigationPath,
    getOrderNavigationPath,
    ConfirmationConfig,
    formatCurrency,
    isCancelledStatus,
    isPaidOrCompletedStatus,
    isWaitingForPaymentStatus,
} from "../../../../../../utils/orders";
import ConfirmationDialog from "../../../../../../components/dialog/ConfirmationDialog";
import { useGlobalLoading } from "../../../../../../contexts/pos/GlobalLoadingContext";
import { useAuth } from "../../../../../../contexts/AuthContext";
import { useSocket } from "../../../../../../hooks/useSocket";
import { useEffectivePermissions } from "../../../../../../hooks/useEffectivePermissions";
import { useRealtimeRefresh } from "../../../../../../utils/pos/realtime";
import { ORDER_REALTIME_EVENTS } from "../../../../../../utils/pos/orderRealtimeEvents";
import { resolveImageSource } from "../../../../../../utils/image/source";
import SmartAvatar from "../../../../../../components/ui/image/SmartAvatar";

const { Title, Text } = Typography;
dayjs.locale('th');

export default function POSDeliverySummaryPage() {
    const router = useRouter();
    const params = useParams();
    const [messageApi, contextHolder] = message.useMessage();
    const deliveryId = Array.isArray(params?.deliveryId) ? params.deliveryId[0] : params?.deliveryId; 

    const { user } = useAuth();
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });
    const isAdminUser = user?.role === "Admin";
    const canCreatePayment = can("payments.page", "create");
    const canEditOrder = isAdminUser || can("orders.edit.feature", "access") || can("orders.page", "update");
    const canCancelOrder = isAdminUser || can("orders.cancel.feature", "access") || can("orders.page", "delete");

    const [order, setOrder] = useState<SalesOrder | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasDeliveryMethod, setHasDeliveryMethod] = useState(true);
    const [summaryExpanded, setSummaryExpanded] = useState(false);
    const { showLoading, hideLoading } = useGlobalLoading();
    const { socket, isConnected } = useSocket();

    // Confirmation Dialog State
    const [confirmConfig, setConfirmConfig] = useState<ConfirmationConfig>({
        open: false,
        type: 'confirm',
        title: '',
        content: '',
        onOk: () => {},
    });

    const closeConfirm = () => setConfirmConfig(prev => ({ ...prev, open: false }));

    const fetchInitialData = useCallback(async () => {
        if (!deliveryId) return;
        try {
            setIsLoading(true);
            showLoading("กำลังโหลดข้อมูลออเดอร์...");

            const [orderData, deliveryMethod] = await Promise.all([
                ordersService.getById(deliveryId),
                paymentMethodService.getByName('Delivery').catch(() => null)
            ]);
            
            if (orderData.order_type !== OrderType.Delivery) {
                messageApi.warning("รายการนี้ไม่ใช่ Order Delivery");
                router.push(getOrderNavigationPath(orderData));
                return;
            }

            if (isPaidOrCompletedStatus(orderData.status)) {
                router.push(`/pos/dashboard/${orderData.id}?from=payment`);
                return;
            }

            if (isCancelledStatus(orderData.status)) {
                router.push(getCancelOrderNavigationPath(orderData.order_type));
                return;
            }

            if (!isWaitingForPaymentStatus(orderData.status)) {
                router.push(`/pos/orders/${orderData.id}`);
                return;
            }

            setOrder(orderData);
            setHasDeliveryMethod(!!deliveryMethod);
        } catch {
            messageApi.error("ไม่สามารถโหลดข้อมูลออเดอร์ได้");
        } finally {
            setIsLoading(false);
            hideLoading();
        }
    }, [deliveryId, messageApi, router, showLoading, hideLoading]);

    useEffect(() => {
        if (deliveryId) {
            fetchInitialData();
        }
    }, [fetchInitialData, deliveryId]);

    useRealtimeRefresh({
        socket,
        events: ORDER_REALTIME_EVENTS,
        onRefresh: () => {
            if (deliveryId) {
                fetchInitialData();
            }
        },
        intervalMs: isConnected ? undefined : 15000,
        enabled: Boolean(deliveryId),
    });

    const { subtotal, discount, vat, total } = calculatePaymentTotals(order, Number(order?.total_amount || 0));

    // Group items for display
    const groupedItems = useMemo(() => {
        if (!order?.items) return [];
        const activeItems = order.items.filter(item => !isCancelledStatus(item.status));
        return groupOrderItems(activeItems);
    }, [order?.items]);

    const handleHandoverToRider = async () => {
        if (!order) return;

        setConfirmConfig({
            open: true,
            type: 'confirm',
            title: 'ยืนยันการส่งมอบสินค้า',
            content: (
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, marginBottom: 12 }}>
                        คุณกำลังจะส่งมอบสินค้าให้ไรเดอร์สำหรับออเดอร์ <Text strong>#{order.order_no}</Text>
                    </div>
                    <Tag color="magenta" style={{ fontSize: 14, padding: '6px 16px', borderRadius: 8 }}>
                        {order.delivery?.delivery_name} {order.delivery_code ? `(${order.delivery_code})` : ''}
                    </Tag>
                </div>
            ),
            okText: 'ยืนยันส่งมอบ',
            cancelText: 'ยกเลิก',
            onOk: async () => {
                try {
                    showLoading("กำลังดำเนินการส่งมอบ...");
                    closeConfirm();
                    const csrfToken = await getCsrfTokenCached();
                    
                    // 1. Fetch the explicit "Delivery" payment method
                    const deliveryMethod = await paymentMethodService.getByName('Delivery');

                    // 2. Create Payment Record (to record sales data)
                    const paymentData = {
                        order_id: order.id,
                        payment_method_id: deliveryMethod?.id,
                        amount: total,
                        amount_received: total,
                        change_amount: 0,
                        status: PaymentStatus.Success
                    };

                    await paymentsService.create(paymentData, undefined, csrfToken);

                    messageApi.success("ส่งมอบสินค้าให้ไรเดอร์เรียบร้อย");
                    
                    // Navigate to success/dashboard
                    router.push(`/pos/dashboard/${order.id}?from=payment`);

                } catch {
                    messageApi.error("เกิดข้อผิดพลาดในการส่งมอบ");
                } finally {
                    hideLoading();
                }
            }
        });
    };

    const handleEditOrder = async () => {
        if (!canEditOrder) {
            messageApi.warning("คุณไม่มีสิทธิ์แก้ไขออเดอร์");
            return;
        }
        if (!order) return;
        
        setConfirmConfig({
            open: true,
            type: 'warning',
            title: 'ย้อนกลับไปแก้ไขออเดอร์?',
            content: 'สถานะออเดอร์จะถูกเปลี่ยนกลับเป็น "กำลังดำเนินการ" เพื่อให้คุณสามารถแก้ไขรายการอาหารได้ คุณแน่ใจหรือไม่?',
            okText: 'ตกลง',
            cancelText: 'ยกเลิก',
            onOk: async () => {
                try {
                    showLoading("กำลังดำเนินการ...");
                    closeConfirm();
                    const csrfToken = await getCsrfTokenCached();
                    
                    const activeItems = order.items?.filter(item => !isCancelledStatus(item.status)) || [];
                    await Promise.all(
                        activeItems.map(item => 
                            ordersService.updateItemStatus(item.id, OrderStatus.Served, undefined, csrfToken)
                        )
                    );

                    await ordersService.updateStatus(order.id, OrderStatus.Pending, csrfToken);

                    messageApi.success("ย้อนกลับไปแก้ไขออเดอร์เรียบร้อย");
                    router.push(getEditOrderNavigationPath(order.id));

                } catch {
                    messageApi.error("ไม่สามารถเปลี่ยนสถานะออเดอร์ได้");
                } finally {
                    hideLoading();
                }
            }
        });
    };

    const handleCancelOrder = () => {
        if (!canCancelOrder) {
            messageApi.warning("คุณไม่มีสิทธิ์ยกเลิกออเดอร์");
            return;
        }
        if (!order) return;

        setConfirmConfig({
            open: true,
            type: 'danger',
            title: 'ยืนยันการยกเลิกออเดอร์?',
            content: 'การดำเนินการนี้จะยกเลิกสินค้าทุกรายการ คุณแน่ใจหรือไม่?',
            okText: 'ยืนยันการยกเลิก',
            cancelText: 'ยกเลิก',
            onOk: async () => {
                try {
                    showLoading("กำลังดำเนินการยกเลิก...");
                    closeConfirm();
                    const csrfToken = await getCsrfTokenCached();

                    const activeItems = order.items?.filter(item => !isCancelledStatus(item.status)) || [];
                    await Promise.all(
                        activeItems.map(item => 
                            ordersService.updateItemStatus(item.id, OrderStatus.Cancelled, undefined, csrfToken)
                        )
                    );

                    await ordersService.updateStatus(order.id, OrderStatus.Cancelled, csrfToken);

                    messageApi.success("ยกเลิกออเดอร์เรียบร้อย");
                    router.push(getCancelOrderNavigationPath(order.order_type));

                } catch {
                    messageApi.error("ไม่สามารถยกเลิกออเดอร์ได้");
                } finally {
                    hideLoading();
                }
            }
        });
    };

    const handleBack = () => {
        router.push('/pos/channels/delivery');
    };

    if (!user) return null;

    if (permissionLoading && !isAdminUser) {
        return (
            <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!canCreatePayment) {
        return (
            <Result
                status="403"
                title="403"
                subTitle="คุณไม่มีสิทธิ์ชำระเงิน (ต้องมีสิทธิ์ payments.page:create)"
                extra={
                    <Button type="primary" onClick={() => router.push("/pos/items")}>
                        กลับไปหน้ารายการ
                    </Button>
                }
            />
        );
    }

    if (isLoading && !order) return null;
    if (!order) return <Empty description="ไม่พบข้อมูลออเดอร์" />;

    return (
        <div className="delivery-page-container">
            <style jsx global>{itemsResponsiveStyles}</style>
            {contextHolder}
                
            {/* Hero Header - Pink/Magenta Theme */}
            <div className="delivery-hero-mobile">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <Button 
                        type="text" 
                        icon={<ArrowLeftOutlined style={{ fontSize: 18, color: '#fff' }} />} 
                        style={{ 
                            height: 44, 
                            width: 44, 
                            borderRadius: 14,
                            background: 'rgba(255,255,255,0.2)',
                            backdropFilter: 'blur(10px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }} 
                        onClick={handleBack}
                    />
                    <div style={{ flex: 1 }}>
                        <Title level={4} style={{ margin: 0, color: '#fff', fontSize: 20, fontWeight: 700 }}>ส่งมอบสินค้า</Title>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                            <Tag color="rgba(255,255,255,0.2)" style={{ border: 'none', color: '#fff', fontSize: 12 }}>
                                <RocketOutlined style={{ marginRight: 4 }} />Delivery
                            </Tag>
                            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: 500 }}>#{order.order_no}</Text>
                        </div>
                    </div>
                </div>
                
                {/* Action Buttons */}
                <div className="delivery-action-buttons">
                    {canEditOrder ? (
                        <Button 
                            icon={<EditOutlined />} 
                            onClick={handleEditOrder}
                            className="delivery-action-btn"
                            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff' }}
                        >
                            แก้ไข
                        </Button>
                    ) : null}
                    {canCancelOrder ? (
                        <Button 
                            danger
                            onClick={handleCancelOrder}
                            className="delivery-action-btn"
                        >
                            ยกเลิก
                        </Button>
                    ) : null}
                </div>
            </div>

            {/* Main Content */}
            <div style={{ padding: '16px', maxWidth: 1200, margin: '0 auto' }}>
                <Row gutter={[20, 20]}>
                    {/* Left: Order Summary */}
                    <Col xs={24} lg={12}>
                        {/* Collapsible Order Summary */}
                        <div className="delivery-order-summary">
                            <div 
                                className="delivery-summary-header"
                                onClick={() => setSummaryExpanded(!summaryExpanded)}
                            >
                                <div>
                                    <Text strong style={{ fontSize: 16, color: '#be185d' }}>รายการอาหาร</Text>
                                    <Text type="secondary" style={{ marginLeft: 8 }}>({groupedItems.length} รายการ)</Text>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <Text strong style={{ fontSize: 18, color: '#EC4899' }}>{formatCurrency(subtotal)}</Text>
                                    {summaryExpanded ? <UpOutlined style={{ color: '#be185d' }} /> : <DownOutlined style={{ color: '#be185d' }} />}
                                </div>
                            </div>
                            <div className={`delivery-summary-content ${summaryExpanded ? 'expanded' : ''}`}>
                                <div className="delivery-summary-items">
                                    {groupedItems.map((item, idx) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 14, borderBottom: `1px solid ${itemsColors.borderLight}` }}>
                                            <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: 0 }}>
                                                <SmartAvatar
                                                    shape="square"
                                                    size={52}
                                                    src={resolveImageSource(item.product?.img_url)}
                                                    alt={item.product?.display_name || "product"}
                                                    icon={<ShopOutlined />}
                                                    imageStyle={{ objectFit: "cover" }}
                                                    style={{ backgroundColor: '#fdf2f8', flexShrink: 0, borderRadius: 12, border: '1px solid #fce7f3' }}
                                                />
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <Text strong style={{ display: 'block', fontSize: 15 }} ellipsis>{item.product?.display_name}</Text>
                                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                                                        <Text type="secondary" style={{ fontSize: 13 }}>{formatCurrency(item.price)}</Text>
                                                        <Tag color="magenta" style={{ margin: 0, fontSize: 11, padding: '0 8px', borderRadius: 6 }}>x{item.quantity}</Tag>
                                                    </div>
                                                    {item.notes && (
                                                        <Text style={{ display: 'block', fontSize: 12, fontStyle: 'italic', color: '#f43f5e', marginTop: 4 }}>
                                                            * {item.notes}
                                                        </Text>
                                                    )}
                                                    {item.details && item.details.length > 0 && (
                                                        <div style={{ marginTop: 4 }}>
                                                            {item.details.map((detail: { detail_name: string; extra_price: number }, dIdx: number) => (
                                                                <Text key={dIdx} style={{ color: '#10b981', fontSize: 11, display: 'block' }}>
                                                                    + {detail.detail_name} {Number(detail.extra_price) > 0 ? `(+${Number(detail.extra_price)})` : ''}
                                                                </Text>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <Text strong style={{ fontSize: 15, color: '#1f2937' }}>{formatCurrency(Number(item.total_price || (Number(item.price) * item.quantity)))}</Text>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Price Summary Card */}
                        <Card style={{ borderRadius: 20, marginBottom: 16, border: '1px solid #fce7f3' }} styles={{ body: { padding: 20 } }}>
                            <Row justify="space-between" style={{ marginBottom: 10 }}>
                                <Text type="secondary">ยอดรวม</Text>
                                <Text>{formatCurrency(subtotal)}</Text>
                            </Row>
                            {discount > 0 && (
                                <Row justify="space-between" style={{ marginBottom: 10 }}>
                                    <Text type="success">ส่วนลด</Text>
                                    <Text type="success">-{formatCurrency(discount)}</Text>
                                </Row>
                            )}
                            {vat > 0 && (
                                <Row justify="space-between" style={{ marginBottom: 10 }}>
                                    <Text type="secondary">VAT (0%)</Text>
                                    <Text>{formatCurrency(vat)}</Text>
                                </Row>
                            )}
                            <Divider style={{ margin: '14px 0', borderColor: '#fce7f3' }} />
                            <Row justify="space-between" align="middle">
                                <Title level={5} style={{ margin: 0, color: '#374151' }}>ยอดสุทธิ</Title>
                                <Title level={3} style={{ color: '#EC4899', margin: 0 }}>{formatCurrency(total)}</Title>
                            </Row>
                        </Card>

                        {/* Delivery Info Card - Mobile Only */}
                        <div className="delivery-info-card" style={{ display: 'block' }}>
                            <div className="delivery-info-row">
                                <span className="delivery-info-label">ผู้ให้บริการ</span>
                                <span className="delivery-info-value">{order.delivery?.delivery_name || '-'}</span>
                            </div>
                            <div className="delivery-info-row">
                                <span className="delivery-info-label">รหัสออเดอร์ไรเดอร์</span>
                                <span className="delivery-info-value">{order.delivery_code || '-'}</span>
                            </div>
                            <div className="delivery-info-row">
                                <span className="delivery-info-label">เลขที่ออเดอร์ POS</span>
                                <span className="delivery-info-value">{order.order_no}</span>
                            </div>
                        </div>
                    </Col>
                    
                    {/* Right: Rider Handover Section */}
                    <Col xs={24} lg={12}>
                        <div className="delivery-rider-section">
                            <div className="delivery-rider-icon-wrapper">
                                <RocketOutlined className="delivery-rider-icon" />
                            </div>
                            <div className="delivery-rider-title">พร้อมสำหรับการจัดส่ง</div>
                            <div className="delivery-rider-subtitle">
                                ตรวจสอบความถูกต้องของรายการอาหารและเครื่องดื่ม<br />ก่อนส่งมอบให้ไรเดอร์
                            </div>

                            {/* Delivery Provider Badge */}
                            <div className="delivery-provider-badge">
                                <span className="delivery-provider-name">{order.delivery?.delivery_name || 'ไม่ระบุ'}</span>
                                {order.delivery_code && (
                                    <span className="delivery-code-badge">{order.delivery_code}</span>
                                )}
                            </div>

                            {/* Warning if no delivery method */}
                            {!hasDeliveryMethod && (
                                <div className="delivery-warning-card">
                                    <div className="delivery-warning-icon">
                                        <ExclamationCircleOutlined />
                                    </div>
                                    <div className="delivery-warning-text">
                                        <strong>ไม่พบวิธีการชำระเงิน &apos;Delivery&apos;</strong><br />
                                        กรุณาเพิ่มวิธีการชำระเงินชื่อ &apos;Delivery&apos; ในเมนูตั้งค่า เพื่อให้สามารถส่งมอบสินค้าได้
                                    </div>
                                </div>
                            )}

                            {/* Desktop Confirm Button */}
                            <Button 
                                type="primary" 
                                size="large" 
                                block 
                                className="delivery-confirm-btn"
                                onClick={handleHandoverToRider}
                                disabled={!hasDeliveryMethod}
                                icon={<CheckCircleOutlined />}
                            >
                                ส่งมอบสินค้าให้ไรเดอร์
                            </Button>

                            <div className="delivery-info-note">
                                <InfoCircleOutlined style={{ color: '#9ca3af' }} />
                                <span className="delivery-info-note-text">
                                    เมื่อกดแล้ว ระบบจะบันทึกยอดขายและปิดออเดอร์นี้
                                </span>
                            </div>
                        </div>
                    </Col>
                </Row>
            </div>

            <ConfirmationDialog
                open={confirmConfig.open}
                type={confirmConfig.type}
                title={confirmConfig.title}
                content={confirmConfig.content}
                okText={confirmConfig.okText}
                cancelText={confirmConfig.cancelText}
                onOk={confirmConfig.onOk}
                onCancel={closeConfirm}
            />
        </div>
    );
}
