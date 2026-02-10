"use client";

import React, { useCallback, useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Typography, Row, Col, Card, Button, Empty, Divider, message, InputNumber, Tag, Avatar, Alert, Modal } from "antd";
import { ArrowLeftOutlined, ShopOutlined, DollarOutlined, CreditCardOutlined, QrcodeOutlined, UndoOutlined, EditOutlined, SettingOutlined, DownOutlined, UpOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { QRCodeSVG } from 'qrcode.react';
import generatePayload from 'promptpay-qr';
import { ordersService } from "../../../../../../services/pos/orders.service";
import { paymentMethodService } from "../../../../../../services/pos/paymentMethod.service";
import { discountsService } from "../../../../../../services/pos/discounts.service";
import { paymentsService } from "../../../../../../services/pos/payments.service";
import { tablesService } from "../../../../../../services/pos/tables.service";
import { shopProfileService, ShopProfile } from "../../../../../../services/pos/shopProfile.service";
import { getCsrfTokenCached } from "../../../../../../utils/pos/csrf";
import { groupOrderItems } from "../../../../../../utils/orderGrouping";

import { SalesOrder, OrderStatus, OrderType } from "../../../../../../types/api/pos/salesOrder";
import { PaymentMethod } from "../../../../../../types/api/pos/paymentMethod";
import { TableStatus } from "../../../../../../types/api/pos/tables";
import { Discounts, DiscountType } from "../../../../../../types/api/pos/discounts";
import { PaymentStatus } from "../../../../../../types/api/pos/payments";
import { itemsResponsiveStyles, itemsColors } from "../../../../../../theme/pos/items/style";
import { calculatePaymentTotals, isCashMethod, isPromptPayMethod, quickCashAmounts, getPostCancelPaymentRedirect, getEditOrderRedirect, isPaymentMethodConfigured } from "../../../../../../utils/payments";
import dayjs from "dayjs";
import 'dayjs/locale/th';
import { getOrderChannelText, getOrderReference, ConfirmationConfig, formatCurrency, isCancelledStatus } from "../../../../../../utils/orders";
import ConfirmationDialog from "../../../../../../components/dialog/ConfirmationDialog";
import { useGlobalLoading } from "../../../../../../contexts/pos/GlobalLoadingContext";
import { useSocket } from "../../../../../../hooks/useSocket";
import { useRealtimeRefresh } from "../../../../../../utils/pos/realtime";
import { RealtimeEvents } from "../../../../../../utils/realtimeEvents";


const { Title, Text } = Typography;
dayjs.locale('th');


export default function POSPaymentPage() {
    const router = useRouter();
    const params = useParams();
    const [messageApi, contextHolder] = message.useMessage();
    const paymentId = Array.isArray(params?.paymentId) ? params.paymentId[0] : params?.paymentId; 

    const [order, setOrder] = useState<SalesOrder | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [discounts, setDiscounts] = useState<Discounts[]>([]);
    const [shopProfile, setShopProfile] = useState<ShopProfile | null>(null);
    const [summaryExpanded, setSummaryExpanded] = useState(false);
    
    // Payment State
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
    const [receivedAmount, setReceivedAmount] = useState<number>(0);
    const [appliedDiscount, setAppliedDiscount] = useState<Discounts | null>(null);
    const [discountModalVisible, setDiscountModalVisible] = useState(false);
    const { showLoading, hideLoading } = useGlobalLoading();
    const { socket } = useSocket();
    
    // Confirmation Dialog State
    const [confirmConfig, setConfirmConfig] = useState<ConfirmationConfig>({
        open: false,
        type: 'confirm',
        title: '',
        content: '',
        onOk: () => {},
    });

    const closeConfirm = () => setConfirmConfig(prev => ({ ...prev, open: false }));

    const fetchInitialData = useCallback(async (silent = false): Promise<void> => {
        if (!paymentId) return;
        try {
            if (!silent) {
                setIsLoading(true);
                showLoading("กำลังโหลดข้อมูลการชำระเงิน...");
            }

            // Fetch shop profile separately
            const shopRes = await shopProfileService.getProfile().catch(() => null);

            const [orderData, methodsRes, discountsRes] = await Promise.all([
                ordersService.getById(paymentId),
                paymentMethodService.getAll(),
                discountsService.getAll()
            ]);
            
            if ([OrderStatus.Paid, OrderStatus.Cancelled].includes(orderData.status)) {
                router.push('/pos/channels');
                return;
            }

            setOrder(orderData);
            
            // Filter Payment Methods
            const filteredMethods = (methodsRes.data || []).filter(m => {
                // If not delivery order, hide 'Delivery' method
                if (orderData.order_type !== OrderType.Delivery && m.payment_method_name === 'Delivery') {
                    return false;
                }
                return true;
            });

            setPaymentMethods(filteredMethods);
            
            // Ensure discounts is always an array
            let discountsArray: Discounts[] = [];
            if (Array.isArray(discountsRes)) {
                discountsArray = discountsRes;
            } else if (discountsRes && typeof discountsRes === 'object') {
                const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object";
                const record = discountsRes as Record<string, unknown>;

                if (
                    "id" in record &&
                    (typeof record.discount_name === "string" || typeof record.display_name === "string")
                ) {
                    discountsArray = [record as unknown as Discounts];
                } else if (Array.isArray(record.data)) {
                    discountsArray = record.data as Discounts[];
                } else if (record.success === true && Array.isArray(record.data)) {
                    discountsArray = record.data as Discounts[];
                } else if (record.success === true && isRecord(record.data)) {
                    const data = record.data as Record<string, unknown>;
                    if (
                        "id" in data &&
                        (typeof data.discount_name === "string" || typeof data.display_name === "string")
                    ) {
                        discountsArray = [data as unknown as Discounts];
                    }
                }
            }
            setDiscounts(discountsArray);
            setShopProfile(shopRes);
            
            // Sync initial discount
            if (orderData.discount) {
                setAppliedDiscount(orderData.discount);
            }

            // Default received amount to total if exists
            if (orderData) {
                setReceivedAmount(Number(orderData.total_amount));
            }

        } catch {
            if (!silent) messageApi.error("ไม่สามารถโหลดข้อมูลการชำระเงินได้");
        } finally {
            if (!silent) {
                setIsLoading(false);
                hideLoading();
            }
        }
    }, [messageApi, paymentId, router, showLoading, hideLoading]);


    // Memoize discount options for Select component
    const discountOptions = useMemo(() => {
        if (!discounts || !Array.isArray(discounts) || discounts.length === 0) {
            return [];
        }
        
        const activeDiscounts = discounts.filter(d => {
            if (!d) return false;
            return d.is_active === true || d.is_active === undefined;
        });
        
        if (activeDiscounts.length === 0) {
            return [];
        }
        
        const options = activeDiscounts.map(d => {
            const displayName = d.display_name || d.discount_name;
            if (!displayName || !d.id) {
                return null;
            }
            const label = `${displayName} (${d.discount_type === DiscountType.Percentage ? `${d.discount_amount}%` : `-${d.discount_amount}฿`})`;
            return { label, value: d.id };
        }).filter((opt): opt is { label: string; value: string } => opt !== null);
        
        return options;
    }, [discounts]);

    useEffect(() => {
        if (paymentId) {
            fetchInitialData(false);
        }
    }, [fetchInitialData, paymentId]);

    const realtimeEnabled = !discountModalVisible && !confirmConfig.open;

    useRealtimeRefresh({
        socket,
        events: [
            RealtimeEvents.orders.update,
            RealtimeEvents.orders.delete,
            RealtimeEvents.payments.create,
            RealtimeEvents.payments.update,
            RealtimeEvents.paymentMethods.create,
            RealtimeEvents.paymentMethods.update,
            RealtimeEvents.discounts.create,
            RealtimeEvents.discounts.update,
            RealtimeEvents.discounts.delete,
            RealtimeEvents.shopProfile.update,
            RealtimeEvents.salesOrderItem.create,
            RealtimeEvents.salesOrderItem.update,
            RealtimeEvents.salesOrderItem.delete,
            RealtimeEvents.salesOrderDetail.create,
            RealtimeEvents.salesOrderDetail.update,
            RealtimeEvents.salesOrderDetail.delete,
        ],
        onRefresh: async () => {
            if (paymentId) {
                await fetchInitialData(true);
            }
        },
        enabled: Boolean(paymentId) && realtimeEnabled,
        debounceMs: 800,
    });
    
    // Prevent auto-scroll when component re-renders
    useEffect(() => {
        if (typeof window !== 'undefined') {
            if ('scrollRestoration' in window.history) {
                window.history.scrollRestoration = 'manual';
            }
        }
    }, []);

    const { subtotal, discount, vat, total, change } = calculatePaymentTotals(order, receivedAmount);
    
    // Group items for display
    const groupedItems = useMemo(() => {
        if (!order?.items) return [];
        const activeItems = order.items.filter(item => !isCancelledStatus(item.status));
        return groupOrderItems(activeItems);
    }, [order?.items]);

    const handleDiscountChange = async (value: string | undefined) => {
        if (!order) return;
        
        try {
            showLoading("กำลังอัปเดตส่วนลด...");
            const csrfToken = await getCsrfTokenCached();
            
            const updatedOrder = await ordersService.update(
                order.id, 
                { discount_id: value || null },
                undefined,
                csrfToken
            );

            setOrder(updatedOrder);
            
            if (value) {
                const selected = discounts.find(d => d.id === value);
                if (selected) {
                    setAppliedDiscount(selected);
                    messageApi.success(`ใช้ส่วนลด "${selected.display_name}" เรียบร้อย`);
                }
            } else {
                setAppliedDiscount(null);
                messageApi.info("ยกเลิกการใช้ส่วนลด");
            }

            setReceivedAmount(Number(updatedOrder.total_amount));

        } catch {
            messageApi.error("ไม่สามารถบันทึกส่วนลดได้");
        } finally {
            hideLoading();
        }
    };

    const handleConfirmPayment = async () => {
        if (!selectedPaymentMethod) {
            messageApi.error("กรุณาเลือกวิธีการชำระเงิน");
            return;
        }
        
        if (receivedAmount < total) {
            messageApi.error("ยอดเงินที่รับต้องมากกว่าหรือเท่ากับยอดชำระ");
            return;
        }

        const method = paymentMethods.find(m => m.id === selectedPaymentMethod);
        const methodName = method?.display_name || 'ไม่ระบุ';

        setConfirmConfig({
            open: true,
            type: 'success',
            title: 'ยืนยันการชำระเงิน',
            content: (
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, marginBottom: 8 }}>
                        วิธีการชำระเงิน: <Text strong>{methodName}</Text>
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: itemsColors.primary }}>
                        ยอดสุทธิ {formatCurrency(total)}
                    </div>
                    {change > 0 && (
                        <div style={{ color: itemsColors.success, fontSize: 18, marginTop: 4 }}>
                            เงินทอน {formatCurrency(change)}
                        </div>
                    )}
                </div>
            ),
            okText: 'ยืนยัน',
            cancelText: 'ยกเลิก',
            onOk: async () => {
                try {
                    showLoading("กำลังดำเนินการชำระเงิน...");
                    closeConfirm();
                    const csrfToken = await getCsrfTokenCached();
                    
                    const paymentData = {
                        order_id: order!.id,
                        payment_method_id: selectedPaymentMethod,
                        amount: total,
                        amount_received: receivedAmount,
                        change_amount: change,
                        status: PaymentStatus.Success
                    };

                    await paymentsService.create(paymentData, undefined, csrfToken);
                    await ordersService.updateStatus(order!.id, OrderStatus.Paid, csrfToken);

                    if (order!.table_id) {
                         await tablesService.update(order!.table_id, { status: TableStatus.Available }, undefined, csrfToken);
                    }

                    messageApi.success("ชำระเงินเรียบร้อย");
                    router.push(`/pos/dashboard/${order!.id}`);

                } catch {
                    messageApi.error("การชำระเงินล้มเหลว");
                } finally {
                    hideLoading();
                }
            }
        });
    };
    
    const handleEditOrder = async () => {
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
                    router.push(getEditOrderRedirect(order.id));

                } catch {
                    messageApi.error("ไม่สามารถเปลี่ยนสถานะออเดอร์ได้");
                } finally {
                    hideLoading();
                }
            }
        });
    };

    const handleCancelOrder = () => {
        if (!order) return;

        setConfirmConfig({
            open: true,
            type: 'danger',
            title: 'ยืนยันการยกเลิกออเดอร์?',
            content: 'การดำเนินการนี้จะยกเลิกสินค้าทุกรายการและคืนสถานะโต๊ะ (หากมี) คุณแน่ใจหรือไม่?',
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

                    if (order.table_id) {
                        await tablesService.update(order.table_id, { status: TableStatus.Available }, undefined, csrfToken);
                    }

                    messageApi.success("ยกเลิกออเดอร์เรียบร้อย");
                    router.push(getPostCancelPaymentRedirect());

                } catch {
                    messageApi.error("ไม่สามารถยกเลิกออเดอร์ได้");
                } finally {
                    hideLoading();
                }
            }
        });
    };

    const handleBack = () => {
        if (order?.order_type === OrderType.DineIn) {
            router.push('/pos/channels/dine-in');
        } else if (order?.order_type === OrderType.TakeAway) {
            router.push('/pos/channels/takeaway');
        } else if (order?.order_type === OrderType.Delivery) {
            router.push('/pos/channels/delivery');
        } else {
            router.back();
        }
    };

    const getPaymentMethodIcon = (methodName?: string, displayName?: string) => {
        if (isCashMethod(methodName, displayName)) return <DollarOutlined />;
        if (isPromptPayMethod(methodName, displayName)) return <QrcodeOutlined />;
        return <CreditCardOutlined />;
    };

    const getPaymentMethodDescription = (methodName?: string, displayName?: string) => {
        if (isCashMethod(methodName, displayName)) return "ชำระด้วยเงินสด";
        if (isPromptPayMethod(methodName, displayName)) return "สแกน QR Code";
        return "ชำระด้วยบัตร";
    };

    if (isLoading && !order) return null;
    if (!order) return <Empty description="ไม่พบข้อมูลออเดอร์" />;

    const selectedMethod = paymentMethods.find(m => m.id === selectedPaymentMethod);
    const isCash = isCashMethod(selectedMethod?.payment_method_name, selectedMethod?.display_name);
    const isPromptPay = isPromptPayMethod(selectedMethod?.payment_method_name, selectedMethod?.display_name);
    const canConfirm = selectedPaymentMethod && 
        receivedAmount >= total && 
        isPaymentMethodConfigured(selectedMethod?.payment_method_name, selectedMethod?.display_name, shopProfile);

    return (
        <div className="payment-page-container">
            <style jsx global>{itemsResponsiveStyles}</style>
            {contextHolder}
                
            {/* Hero Header - Compact Mobile */}
            <div className="payment-hero-mobile">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <Button 
                        type="text" 
                        icon={<ArrowLeftOutlined style={{ fontSize: 18, color: '#fff' }} />} 
                        style={{ 
                            height: 40, 
                            width: 40, 
                            borderRadius: 12,
                            background: 'rgba(255,255,255,0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }} 
                        onClick={handleBack}
                    />
                    <div style={{ flex: 1 }}>
                        <Title level={4} style={{ margin: 0, color: '#fff', fontSize: 20 }}>ชำระเงิน</Title>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                            <Tag color="rgba(255,255,255,0.2)" style={{ border: 'none', color: '#fff', fontSize: 12 }}>
                                {getOrderChannelText(order.order_type)} {getOrderReference(order)}
                            </Tag>
                            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>#{order.order_no}</Text>
                        </div>
                    </div>
                </div>
                
                {/* Action Buttons */}
                <div className="action-buttons-row">
                    <Button 
                        icon={<EditOutlined />} 
                        onClick={handleEditOrder}
                        className="action-btn"
                        style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff' }}
                    >
                        แก้ไข
                    </Button>
                    <Button 
                        danger
                        onClick={handleCancelOrder}
                        className="action-btn"
                    >
                        ยกเลิก
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div style={{ padding: '16px', maxWidth: 1200, margin: '0 auto' }}>
                <Row gutter={[20, 20]}>
                    {/* Left: Order Summary */}
                    <Col xs={24} lg={12}>
                        {/* Collapsible Order Summary */}
                        <div className="order-summary-collapsible">
                            <div 
                                className="order-summary-header"
                                onClick={() => setSummaryExpanded(!summaryExpanded)}
                            >
                                <div>
                                    <Text strong style={{ fontSize: 16 }}>รายการสรุป</Text>
                                    <Text type="secondary" style={{ marginLeft: 8 }}>({groupedItems.length} รายการ)</Text>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <Text strong style={{ fontSize: 18, color: itemsColors.primary }}>{formatCurrency(subtotal)}</Text>
                                    {summaryExpanded ? <UpOutlined /> : <DownOutlined />}
                                </div>
                            </div>
                            <div className={`order-summary-content ${summaryExpanded ? 'expanded' : ''}`}>
                                <div className="order-summary-items">
                                    {groupedItems.map((item, idx) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 14, borderBottom: `1px solid ${itemsColors.borderLight}` }}>
                                            <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: 0 }}>
                                                <Avatar 
                                                    shape="square" 
                                                    size={48} 
                                                    src={item.product?.img_url} 
                                                    icon={<ShopOutlined />}
                                                    style={{ backgroundColor: itemsColors.backgroundSecondary, flexShrink: 0, borderRadius: 10 }} 
                                                />
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <Text strong style={{ display: 'block', fontSize: 14 }} ellipsis>{item.product?.display_name}</Text>
                                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                        <Text type="secondary" style={{ fontSize: 12 }}>{formatCurrency(item.price)}</Text>
                                                        <Tag style={{ margin: 0, fontSize: 10, padding: '0 6px' }}>x{item.quantity}</Tag>
                                                    </div>
                                                    {item.notes && (
                                                        <Text style={{ display: 'block', fontSize: 11, fontStyle: 'italic', color: '#ef4444', marginTop: 2 }}>
                                                            * {item.notes}
                                                        </Text>
                                                    )}
                                                    {item.details && item.details.length > 0 && (
                                                        <div style={{ marginTop: 2 }}>
                                                            {item.details.map((detail: { detail_name: string; extra_price: number }, dIdx: number) => (
                                                                <Text key={dIdx} style={{ color: '#10b981', fontSize: 11, display: 'block' }}>
                                                                    + {detail.detail_name} {Number(detail.extra_price) > 0 ? `(+${Number(detail.extra_price)})` : ''}
                                                                </Text>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <Text strong style={{ fontSize: 14 }}>{formatCurrency(Number(item.total_price || (Number(item.price) * item.quantity)))}</Text>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Price Summary Card */}
                        <Card style={{ borderRadius: 20, marginBottom: 16 }} styles={{ body: { padding: 20 } }}>
                            <Row justify="space-between" style={{ marginBottom: 8 }}>
                                <Text type="secondary">ยอดรวม</Text>
                                <Text>{formatCurrency(subtotal)}</Text>
                            </Row>
                            {discount > 0 && (
                                <Row justify="space-between" style={{ marginBottom: 8 }}>
                                    <Text type="success">ส่วนลด</Text>
                                    <Text type="success">-{formatCurrency(discount)}</Text>
                                </Row>
                            )}
                            {vat > 0 && (
                                <Row justify="space-between" style={{ marginBottom: 8 }}>
                                    <Text type="secondary">VAT (7%)</Text>
                                    <Text>{formatCurrency(vat)}</Text>
                                </Row>
                            )}
                            <Divider style={{ margin: '12px 0' }} />
                            <Row justify="space-between" align="middle">
                                <Title level={5} style={{ margin: 0 }}>ยอดสุทธิ</Title>
                                <Title level={3} style={{ color: itemsColors.primary, margin: 0 }}>{formatCurrency(total)}</Title>
                            </Row>
                        </Card>

                        {/* Discount Selector */}
                        <div 
                            className={`discount-selector ${appliedDiscount ? 'has-discount' : ''}`}
                            onClick={() => !isLoading && setDiscountModalVisible(true)}
                        >
                            <span style={{ color: appliedDiscount ? '#1f2937' : '#9ca3af' }}>
                                {appliedDiscount 
                                    ? `🎁 ${appliedDiscount.display_name || appliedDiscount.discount_name} (${appliedDiscount.discount_type === 'Percentage' ? `${appliedDiscount.discount_amount}%` : `-${appliedDiscount.discount_amount}฿`})`
                                    : "เลือกส่วนลด (ถ้ามี)"}
                            </span>
                            {appliedDiscount ? (
                                <span 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDiscountChange(undefined);
                                    }}
                                    style={{ color: '#ef4444', padding: 8 }}
                                >
                                    ✕
                                </span>
                            ) : (
                                <span style={{ color: '#9ca3af' }}>▼</span>
                            )}
                        </div>
                    </Col>
                    
                    {/* Right: Payment Methods */}
                    <Col xs={24} lg={12}>
                        <Card style={{ borderRadius: 20 }} styles={{ body: { padding: 20 } }}>
                            <Text strong style={{ display: 'block', marginBottom: 16, fontSize: 16 }}>
                                เลือกวิธีการชำระเงิน
                            </Text>
                            
                            {paymentMethods.length === 0 ? (
                                <Alert
                                    message="ยังไม่มีวิธีการชำระเงิน"
                                    description="กรุณาเพิ่มวิธีการชำระเงินในเมนูตั้งค่าก่อนทำรายการ"
                                    type="warning"
                                    showIcon
                                />
                            ) : (
                                <div className="payment-method-grid">
                                    {paymentMethods.map(method => {
                                        const isSelected = selectedPaymentMethod === method.id;
                                        return (
                                            <div 
                                                key={method.id}
                                                className={`payment-method-card ${isSelected ? 'selected' : ''}`}
                                                onClick={() => {
                                                    setSelectedPaymentMethod(method.id);
                                                    if (isPromptPayMethod(method.payment_method_name, method.display_name)) {
                                                        setReceivedAmount(total);
                                                    } else if (isCashMethod(method.payment_method_name, method.display_name)) {
                                                        setReceivedAmount(0);
                                                    } else {
                                                        setReceivedAmount(total);
                                                    }
                                                }}
                                            >
                                                <div className="payment-method-icon">
                                                    {getPaymentMethodIcon(method.payment_method_name, method.display_name)}
                                                </div>
                                                <div className="payment-method-info">
                                                    <div className="payment-method-name">{method.display_name}</div>
                                                    <div className="payment-method-desc">
                                                        {getPaymentMethodDescription(method.payment_method_name, method.display_name)}
                                                    </div>
                                                </div>
                                                {isSelected && <CheckCircleOutlined style={{ fontSize: 20, color: '#4F46E5' }} />}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Payment Method Details */}
                            {selectedPaymentMethod && (
                                <div style={{ marginTop: 20 }}>
                                    <Divider style={{ margin: '0 0 20px' }} />
                                    
                                    {isPromptPay && (
                                        <>
                                            {!shopProfile?.promptpay_number ? (
                                                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                                    <div style={{ color: '#ff4d4f', marginBottom: 12, fontWeight: 500 }}>
                                                        กรุณาตั้งค่าเบอร์ PromptPay ในระบบก่อน
                                                    </div>
                                                    <Button 
                                                        type="primary" 
                                                        danger 
                                                        ghost 
                                                        icon={<SettingOutlined />}
                                                        onClick={() => router.push('/pos/settings')}
                                                    >
                                                        ไปตั้งค่าที่ Shop Profile
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="qr-display-wrapper">
                                                    <Text style={{ display: 'block', marginBottom: 16, fontSize: 14, color: '#6b7280' }}>
                                                        สแกน QR Code เพื่อชำระเงิน
                                                    </Text>
                                                    <QRCodeSVG 
                                                        value={generatePayload(shopProfile.promptpay_number, { amount: total })} 
                                                        size={200} 
                                                        level="L" 
                                                        includeMargin 
                                                    />
                                                    <div className="qr-amount">{formatCurrency(total)}</div>
                                                    <div className="qr-account-info">
                                                        {shopProfile.promptpay_number}
                                                        {shopProfile.promptpay_name && <><br/>({shopProfile.promptpay_name})</>}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {isCash && (
                                        <>
                                            <div className="amount-input-wrapper">
                                                <Text style={{ display: 'block', marginBottom: 12, fontSize: 14, fontWeight: 500 }}>
                                                    รับเงินมา
                                                </Text>
                                                <InputNumber
                                                    style={{ width: '100%' }} 
                                                    size="large"
                                                    min={0}
                                                    value={receivedAmount}
                                                    onChange={(val) => setReceivedAmount(val || 0)}
                                                    formatter={value => `฿ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                    parser={value => Number(value!.replace(/฿\s?|(,*)/g, ''))}
                                                    onFocus={(e) => e.target.select()}
                                                    controls={false}
                                                    inputMode="decimal"
                                                />
                                            </div>
                                            
                                            {/* Quick Buttons */}
                                            <div className="quick-cash-grid">
                                                <Button 
                                                    onClick={() => setReceivedAmount(total)} 
                                                    type="primary" 
                                                    className="quick-cash-btn quick-cash-btn-exact"
                                                >
                                                    พอดี ({formatCurrency(total)})
                                                </Button>
                                                {quickCashAmounts.map(amt => (
                                                    <Button 
                                                        key={amt} 
                                                        onClick={() => setReceivedAmount(amt)} 
                                                        className="quick-cash-btn"
                                                    >
                                                        ฿{amt.toLocaleString()}
                                                    </Button>
                                                ))}
                                                <Button 
                                                    icon={<UndoOutlined />} 
                                                    onClick={() => setReceivedAmount(0)} 
                                                    danger 
                                                    className="quick-cash-btn"
                                                />
                                            </div>

                                            {/* Change Display */}
                                            <div className={`change-display ${change < 0 ? 'insufficient' : ''}`}>
                                                <div className="change-label">
                                                    {change >= 0 ? 'เงินทอน' : 'ยังขาดอีก'}
                                                </div>
                                                <div className="change-amount">
                                                    {formatCurrency(Math.abs(change))}
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {!isCash && !isPromptPay && (
                                        <div style={{ textAlign: 'center', padding: 20 }}>
                                            <Text type="secondary">ตรวจสอบยอดเงินและชำระผ่านช่องทางที่เลือก</Text>
                                            <div style={{ marginTop: 16 }}>
                                                <InputNumber
                                                    style={{ width: '100%', fontSize: 24 }} 
                                                    value={receivedAmount} 
                                                    onChange={val => setReceivedAmount(val || 0)} 
                                                    formatter={value => `฿ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                    parser={value => Number(value!.replace(/฿\s?|(,*)/g, ''))}
                                                    controls={false}
                                                    inputMode="decimal"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Desktop Confirm Button */}
                            <div className="payment-sticky-footer" style={{ marginTop: 20 }}>
                                <Button 
                                    type="primary" 
                                    size="large" 
                                    block 
                                    className="payment-confirm-btn"
                                    onClick={handleConfirmPayment}
                                    disabled={!canConfirm}
                                    icon={<CheckCircleOutlined />}
                                >
                                    ยืนยันการชำระเงิน {canConfirm && `(${formatCurrency(total)})`}
                                </Button>
                            </div>
                        </Card>
                    </Col>
                </Row>
            </div>

            {/* Mobile Sticky Footer */}
            <div className="payment-sticky-footer" style={{ display: 'block' }}>
                <div className="payment-sticky-footer-content">
                    <div className="payment-total-row">
                        <span className="payment-total-label">ยอดสุทธิ</span>
                        <span className="payment-total-amount">{formatCurrency(total)}</span>
                    </div>
                    <Button 
                        type="primary" 
                        size="large" 
                        block 
                        className="payment-confirm-btn"
                        onClick={handleConfirmPayment}
                        disabled={!canConfirm}
                        icon={<CheckCircleOutlined />}
                    >
                        ยืนยันการชำระเงิน
                    </Button>
                </div>
            </div>
            
            {/* Discount Selection Modal */}
            <Modal
                title="เลือกส่วนลด"
                open={discountModalVisible}
                onCancel={() => setDiscountModalVisible(false)}
                footer={null}
                centered
                width={400}
                zIndex={10001}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '60vh', overflowY: 'auto' }}>
                    {discountOptions.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 24, color: '#9ca3af' }}>
                            ไม่มีส่วนลดที่ใช้งานได้
                        </div>
                    ) : (
                        discountOptions.map(opt => (
                            <div
                                key={opt.value}
                                onClick={() => {
                                    handleDiscountChange(opt.value);
                                    setDiscountModalVisible(false);
                                }}
                                style={{
                                    padding: '14px 18px',
                                    border: '2px solid',
                                    borderRadius: 12,
                                    cursor: 'pointer',
                                    background: appliedDiscount?.id === opt.value ? '#eff6ff' : '#fff',
                                    borderColor: appliedDiscount?.id === opt.value ? '#3b82f6' : '#e5e7eb',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    minHeight: 54
                                }}
                            >
                                <span style={{ fontWeight: appliedDiscount?.id === opt.value ? 600 : 400 }}>
                                    {opt.label}
                                </span>
                                {appliedDiscount?.id === opt.value && (
                                    <CheckCircleOutlined style={{ color: '#3b82f6', fontSize: 18 }} />
                                )}
                            </div>
                        ))
                    )}
                    <div
                        onClick={() => {
                            handleDiscountChange(undefined);
                            setDiscountModalVisible(false);
                        }}
                        style={{
                            padding: '14px 18px',
                            marginTop: 8,
                            textAlign: 'center',
                            color: '#ef4444',
                            cursor: 'pointer',
                            border: '2px dashed #ef4444',
                            borderRadius: 12,
                            minHeight: 54,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        ไม่ใช้ส่วนลด
                    </div>
                </div>
            </Modal>
            
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
