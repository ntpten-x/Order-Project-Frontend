"use client";

import React, { useCallback, useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Typography, Row, Col, Card, Button, Empty, Divider, message, InputNumber, Tag, Avatar, Alert, Modal } from "antd";
import { ArrowLeftOutlined, ShopOutlined, DollarOutlined, CreditCardOutlined, QrcodeOutlined, UndoOutlined, EditOutlined, SettingOutlined } from "@ant-design/icons";
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
import { itemsPaymentStyles, itemsColors, itemsResponsiveStyles } from "../../../../../../theme/pos/items/style";
import { calculatePaymentTotals, isCashMethod, isPromptPayMethod, quickCashAmounts, getPostCancelPaymentRedirect, getEditOrderRedirect, isPaymentMethodConfigured } from "../../../../../../utils/payments";
import dayjs from "dayjs";
import 'dayjs/locale/th';
import { getOrderChannelText, getOrderReference, getOrderStatusColor, getOrderStatusText, ConfirmationConfig, formatCurrency } from "../../../../../../utils/orders";
import ConfirmationDialog from "../../../../../../components/dialog/ConfirmationDialog";
import { useGlobalLoading } from "../../../../../../contexts/pos/GlobalLoadingContext";
import { useSocket } from "../../../../../../hooks/useSocket";
import { useRealtimeRefresh } from "../../../../../../utils/pos/realtime";
import { RealtimeEvents } from "../../../../../../utils/realtimeEvents";
import PageContainer from "../../../../../../components/ui/page/PageContainer";


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
            // discountsService.getAll() should always return Discounts[]
            // but handle edge cases just in case
            let discountsArray: Discounts[] = [];
            if (Array.isArray(discountsRes)) {
                discountsArray = discountsRes;
            } else if (discountsRes && typeof discountsRes === 'object') {
                const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object";
                const record = discountsRes as Record<string, unknown>;

                // Handle single object response
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
            // Use display_name first, fallback to discount_name
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
        // Disable Next.js auto-scroll behavior
        if (typeof window !== 'undefined') {
            // Prevent scroll restoration
            if ('scrollRestoration' in window.history) {
                window.history.scrollRestoration = 'manual';
            }
        }
    }, []);

    const { subtotal, discount, vat, total, change } = calculatePaymentTotals(order, receivedAmount);
    
    // Group items for display
    const groupedItems = useMemo(() => {
        if (!order?.items) return [];
        const activeItems = order.items.filter(item => item.status !== OrderStatus.Cancelled);
        return groupOrderItems(activeItems);
    }, [order?.items]);

    const handleDiscountChange = async (value: string | undefined) => {
        if (!order) return;
        
        try {
            showLoading("กำลังอัปเดตส่วนลด...");
            const csrfToken = await getCsrfTokenCached();
            
            const updatedOrder = await ordersService.update(
                order.id, 
                { discount_id: value || null }, // Send null if cleared
                undefined,
                csrfToken
            );

            setOrder(updatedOrder);
            
            // Update applied discount state
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

            // Update received amount to match new total for convenience
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
                    
                    // 1. Create Payment Record
                    const paymentData = {
                        order_id: order!.id,
                        payment_method_id: selectedPaymentMethod,
                        amount: total,
                        amount_received: receivedAmount,
                        change_amount: change,
                        status: PaymentStatus.Success
                    };

                    await paymentsService.create(paymentData, undefined, csrfToken);

                    // 2. Update Order Status to Paid
                    await ordersService.updateStatus(order!.id, OrderStatus.Paid, csrfToken);

                    // 3. Update Table Status if DineIn
                    if (order!.table_id) {
                         await tablesService.update(order!.table_id, { status: TableStatus.Available }, undefined, csrfToken);
                    }

                    messageApi.success("ชำระเงินเรียบร้อย");
                    router.push(`/pos/dashboard/${order!.id}`); // Go to order detail/dashboard

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
                    
                    // 1. Revert all non-cancelled items to 'Served' status
                    const activeItems = order.items?.filter(item => item.status !== OrderStatus.Cancelled) || [];
                    await Promise.all(
                        activeItems.map(item => 
                            ordersService.updateItemStatus(item.id, OrderStatus.Served, undefined, csrfToken)
                        )
                    );

                    // 2. Revert order status back to 'Pending'
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

                    // 1. Cancel all non-cancelled items
                    const activeItems = order.items?.filter(item => item.status !== OrderStatus.Cancelled) || [];
                    await Promise.all(
                        activeItems.map(item => 
                            ordersService.updateItemStatus(item.id, OrderStatus.Cancelled, undefined, csrfToken)
                        )
                    );

                    // 2. Set Order status to Cancelled
                    await ordersService.updateStatus(order.id, OrderStatus.Cancelled, csrfToken);

                    // 3. Set Table to Available if Dine-In
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

    if (isLoading && !order) return null;
    if (!order) return <Empty description="ไม่พบข้อมูลออเดอร์" />;

    return (
        <PageContainer maxWidth={99999} style={{ padding: 0 }}>
        <div style={itemsPaymentStyles.container}>
            <style jsx global>{itemsResponsiveStyles}</style>
            {contextHolder}
                
                {/* Hero Header */}
                <div style={itemsPaymentStyles.heroSection} className="payment-hero-mobile">
                <div style={itemsPaymentStyles.contentWrapper} className="payment-content-mobile">
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                         <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                             <Button 
                                type="text" 
                                icon={<ArrowLeftOutlined style={{ fontSize: 20 }} />} 
                                style={{ color: '#fff', padding: 0, height: 'auto', marginTop: 4 }} 
                                onClick={handleBack}
                              />
                             <div>
                                <Title level={3} style={itemsPaymentStyles.pageTitle}>ชำระเงิน</Title>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                                    <Tag color="blue" style={{ borderRadius: 4, border: 'none' }}>
                                        {getOrderChannelText(order.order_type)} {getOrderReference(order)}
                                    </Tag>
                                    <Tag color={getOrderStatusColor(order.status)} style={{ borderRadius: 4, border: 'none' }}>
                                        {getOrderStatusText(order.status)}
                                    </Tag>
                                    <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>#{order.order_no}</Text>
                                </div>
                            </div>
                        </div>

                         <div style={{ display: 'flex', gap: 8 }}>
                            <Button 
                                icon={<EditOutlined />} 
                                onClick={handleEditOrder}
                                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff' }}
                            >
                                แก้ไขออเดอร์
                            </Button>
                            <Button 
                                danger
                                onClick={handleCancelOrder}
                            >
                                ยกเลิกออเดอร์
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ ...itemsPaymentStyles.contentWrapper, marginTop: -30, paddingBottom: 40 }}>
                <Row gutter={[24, 24]}>
                    {/* Left: Summary */}
                    <Col xs={24} lg={14}>
                        <Card 
                            style={itemsPaymentStyles.card} 
                            styles={{ body: { height: '100%', display: 'flex', flexDirection: 'column' } }}
                        >
                             <Title level={4} style={{ marginBottom: 16, marginTop: 0 }}>รายการสรุป (Order Summary)</Title>
                            <div style={{ flex: 1, overflowY: 'auto', paddingRight: 8, minHeight: 300, maxHeight: 500 }}>
                                {groupedItems.map((item, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${itemsColors.borderLight}` }}>
                                         <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: 0 }}>
                                            <Avatar 
                                                shape="square" 
                                                size={50} 
                                                src={item.product?.img_url} 
                                                icon={<ShopOutlined />}
                                                style={{ backgroundColor: itemsColors.backgroundSecondary, flexShrink: 0, borderRadius: 8 }} 
                                            />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <Text strong style={{ display: 'block' }} ellipsis>{item.product?.display_name}</Text>
                                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                    <Text type="secondary" style={{ fontSize: 13 }}>{formatCurrency(item.price)}</Text>
                                                    <Tag style={{ margin: 0, fontSize: 11 }}>x{item.quantity}</Tag>
                                                </div>
                                                {item.notes && (
                                                    <Text style={{ display: 'block', fontSize: 12, fontStyle: 'italic', color: '#ef4444', marginTop: 2 }}>
                                                        * {item.notes}
                                                    </Text>
                                                )}
                                                {item.details && item.details.length > 0 && (
                                                    <div style={{ marginTop: 2, display: 'flex', flexDirection: 'column', gap: 0 }}>
                                                        {item.details.map((detail: { detail_name: string; extra_price: number }, dIdx: number) => (
                                                            <div key={dIdx}>
                                                                <Text style={{ color: '#10b981', fontSize: 12 }}>
                                                                    + {detail.detail_name} {Number(detail.extra_price) > 0 ? `(+${Number(detail.extra_price)})` : ''}
                                                                </Text>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                         </div>
                                         <Text strong>{formatCurrency(Number(item.total_price || (Number(item.price) * item.quantity)))}</Text>
                                    </div>
                                ))}
                            </div>
                            
                            <div style={itemsPaymentStyles.summaryBox}>
                                <Row justify="space-between" style={{ marginBottom: 8 }}>
                                    <Text type="secondary">ยอดรวม (Subtotal)</Text>
                                    <Text>{formatCurrency(subtotal)}</Text>
                                </Row>
                                {discount > 0 && (
                                    <Row justify="space-between" style={{ marginBottom: 8, color: itemsColors.success }}>
                                        <Text type="success">ส่วนลด (Discount)</Text>
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
                                    <Title level={4} style={{ margin: 0 }}>ยอดสุทธิ (Total)</Title>
                                    <Title level={3} style={{ color: itemsColors.primary, margin: 0 }}>{formatCurrency(total)}</Title>
                                </Row>
                            </div>
                        </Card>
                    </Col>
                    
                    {/* Right: Payment Actions */}
                    <Col xs={24} lg={10}>
                         <Card 
                            style={{ ...itemsPaymentStyles.card, height: 'auto', marginBottom: 12, overflow: 'visible' }} 
                            styles={{ body: { padding: '12px 16px', overflow: 'visible' } }}
                        >
                            <Text strong style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>ส่วนลด (Discount)</Text>
                            {/* Discount Selection - Switched to Modal for better Mobile/Touch experience */}
                            <div 
                                style={{ 
                                    border: `1px solid ${appliedDiscount ? '#4F46E5' : '#d9d9d9'}`,
                                    borderRadius: 8,
                                    padding: '8px 12px',
                                    cursor: 'pointer',
                                    background: '#fff',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    height: 48, // Touch friendly height
                                    transition: 'all 0.2s'
                                }}
                                onClick={() => {
                                    if (!isLoading) {
                                        setDiscountModalVisible(true);
                                    }
                                }}
                            >
                                <span style={{ color: appliedDiscount ? '#1f2937' : '#9ca3af' }}>
                                    {appliedDiscount 
                                        ? `${appliedDiscount.display_name || appliedDiscount.discount_name} (${appliedDiscount.discount_type === 'Percentage' ? `${appliedDiscount.discount_amount}%` : `-${appliedDiscount.discount_amount}฿`})`
                                        : "เลือกส่วนลด (Select Discount)"}
                                </span>
                                {appliedDiscount ? (
                                    <span 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDiscountChange(undefined);
                                        }}
                                        style={{ color: '#ef4444', padding: 4 }}
                                    >
                                        ✕
                                    </span>
                                ) : (
                                    <span style={{ color: '#9ca3af' }}>▼</span>
                                )}
                            </div>
                         </Card>
                         
                         {/* Discount Selection Modal */}
                         <Modal
                            title="เลือกส่วนลด"
                            open={discountModalVisible}
                            onCancel={() => setDiscountModalVisible(false)}
                            footer={null}
                            centered
                            width={400}
                            zIndex={10001} // Ensure above everything
                         >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '60vh', overflowY: 'auto' }}>
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
                                                padding: '12px 16px',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: 8,
                                                cursor: 'pointer',
                                                background: appliedDiscount?.id === opt.value ? '#eff6ff' : '#fff',
                                                borderColor: appliedDiscount?.id === opt.value ? '#3b82f6' : '#e5e7eb',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <span style={{ fontWeight: appliedDiscount?.id === opt.value ? 500 : 400 }}>
                                                {opt.label}
                                            </span>
                                            {appliedDiscount?.id === opt.value && (
                                                <span style={{ color: '#3b82f6' }}>✓</span>
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
                                        padding: '12px 16px',
                                        marginTop: 8,
                                        textAlign: 'center',
                                        color: '#ef4444',
                                        cursor: 'pointer',
                                        border: '1px dashed #ef4444',
                                        borderRadius: 8
                                    }}
                                >
                                    ไม่ใช้ส่วนลด
                                </div>
                            </div>
                         </Modal>

                          <Card style={itemsPaymentStyles.card}>
                             <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <Text strong style={{ fontSize: 16 }}>วิธีการชำระเงิน (Payment Method)</Text>
                                {paymentMethods.length === 0 ? (
                                    <Alert
                                        message="ยังไม่มีวิธีการชำระเงิน"
                                        description="กรุณาเพิ่มวิธีการชำระเงินในเมนูตั้งค่าก่อนทำรายการ"
                                        type="warning"
                                        showIcon
                                        style={{ marginTop: 16 }}
                                    />
                                ) : (
                                    <Row gutter={[12, 12]}>
                                        {paymentMethods.map(method => {
                                            const isSelected = selectedPaymentMethod === method.id;
                                            return (
                                                <Col span={12} key={method.id}>
                                                    <div 
                                                        onClick={() => {
                                                            setSelectedPaymentMethod(method.id);
                                                            // Auto-fill amount based on payment type
                                                            if (isPromptPayMethod(method.payment_method_name, method.display_name)) {
                                                                setReceivedAmount(total);
                                                            } else if (isCashMethod(method.payment_method_name, method.display_name)) {
                                                                setReceivedAmount(0);
                                                            } else {
                                                                setReceivedAmount(total);
                                                            }
                                                        }}
                                                        style={{ 
                                                            ...itemsPaymentStyles.methodCard,
                                                            ...(isSelected ? itemsPaymentStyles.methodCardSelected : {})
                                                        }}
                                                    >   
                                                        <div style={{ fontSize: 24, marginBottom: 8, color: isSelected ? itemsColors.primary : '#595959' }}>
                                                            {isCashMethod(method.payment_method_name, method.display_name) ? <DollarOutlined /> : 
                                                             isPromptPayMethod(method.payment_method_name, method.display_name) ? <QrcodeOutlined /> : <CreditCardOutlined />}
                                                        </div>
                                                        <Text strong style={{ color: isSelected ? itemsColors.primary : undefined }}>{method.display_name}</Text>
                                                    </div>
                                                </Col>
                                            );
                                        })}
                                    </Row>
                                )}

                                {selectedPaymentMethod && (
                                    <div style={{ animation: 'fadeIn 0.5s' }}>
                                        <Divider style={{ margin: '16px 0' }} />
                                        {(() => {
                                            const method = paymentMethods.find(m => m.id === selectedPaymentMethod);
                                            const isCash = isCashMethod(method?.payment_method_name, method?.display_name);
                                            const isPromptPay = isPromptPayMethod(method?.payment_method_name, method?.display_name);

                                             if (isPromptPay) {
                                                if (!shopProfile?.promptpay_number) {
                                                     return (
                                                        <div style={{textAlign: 'center', padding: '16px 0'}}>
                                                            <div style={{color: '#ff4d4f', marginBottom: 12, fontWeight: 500}}>
                                                                กรุณาตั้งค่าเบอร์ PromptPay ในระบบก่อน (Shop Profile)
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
                                                     );
                                                }
                                                const payload = generatePayload(shopProfile.promptpay_number, { amount: total });
                                                return (
                                                    <div style={itemsPaymentStyles.qrArea}>
                                                        <Text style={{ display: 'block', marginBottom: 16, fontSize: 16 }}>สแกน QR เพื่อชำระเงิน</Text>
                                                        <div style={{ background: 'white', padding: 12, display: 'inline-block', borderRadius: 8 }}>
                                                            <QRCodeSVG value={payload} size={180} level="L" includeMargin />
                                                        </div>
                                                        <div style={{ marginTop: 16 }}>
                                                            <Title level={3} style={{ color: itemsColors.primary, margin: 0 }}>{formatCurrency(total)}</Title>
                                                        </div>
                                                        <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                                                            {shopProfile.promptpay_number}
                                                            {shopProfile.promptpay_name && <><br/>({shopProfile.promptpay_name})</>}
                                                        </Text>
                                                    </div>
                                                );
                                            }

                                            if (isCash) {
                                                return (
                                                    <div style={itemsPaymentStyles.inputArea}>
                                                        <Text style={{ display: 'block', marginBottom: 8 }}>รับเงินมา (Received)</Text>
                                                        <InputNumber
                                                            style={{ width: '100%', fontSize: 24, padding: 8, borderRadius: 8, marginBottom: 12 }} 
                                                            size="large"
                                                            min={0}
                                                            value={receivedAmount}
                                                            onChange={(val) => setReceivedAmount(val || 0)}
                                                            formatter={value => `฿ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                            parser={value => Number(value!.replace(/฿\s?|(,*)/g, ''))}
                                                            onFocus={(e) => e.target.select()}
                                                            controls={false}
                                                            inputMode="decimal"
                                                            onKeyDown={(e) => {
                                                                const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', 'Escape', '.', ',', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
                                                                if (!allowedKeys.includes(e.key) && !e.ctrlKey && !e.metaKey) {
                                                                    e.preventDefault();
                                                                }
                                                            }}
                                                        />
                                                        
                                                        {/* Quick Buttons */}
                                                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                                                            <Button onClick={() => setReceivedAmount(total)} type="primary" ghost size="small">พอดี</Button>
                                                            {quickCashAmounts.map(amt => (
                                                                <Button key={amt} onClick={() => setReceivedAmount(amt)} size="small">฿{amt}</Button>
                                                            ))}
                                                            <Button icon={<UndoOutlined />} onClick={() => setReceivedAmount(0)} danger size="small" />
                                                        </div>

                                                        <Divider style={{ margin: '12px 0' }} />
                                                        
                                                        <Row justify="space-between" align="middle" style={{ 
                                                            background: change >= 0 ? '#f6ffed' : '#fff1f0', 
                                                            padding: 12, 
                                                            borderRadius: 8, 
                                                            border: `1px solid ${change >= 0 ? '#b7eb8f' : '#ffa39e'}` 
                                                        }}>
                                                            <Text style={{ fontSize: 16 }}>เงินทอน (Change)</Text>
                                                            <Text strong style={{ fontSize: 24, color: change >= 0 ? itemsColors.success : itemsColors.cancelled }}>
                                                                {formatCurrency(Math.max(0, change))}
                                                            </Text>
                                                        </Row>
                                                    </div>
                                                );
                                            }

                                            // Credit Card / Other
                                            return (
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
                                                            onKeyDown={(e) => {
                                                                const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', 'Escape', '.', ',', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
                                                                if (!allowedKeys.includes(e.key) && !e.ctrlKey && !e.metaKey) {
                                                                    e.preventDefault();
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}

                                 <Button 
                                    type="primary" 
                                    size="large" 
                                    block 
                                    style={{ height: 56, fontSize: 18, marginTop: 8, background: itemsColors.success, border: `1px solid ${itemsColors.success}`, fontWeight: 700 }}
                                    onClick={handleConfirmPayment}
                                    disabled={
                                        !selectedPaymentMethod || 
                                        (receivedAmount < total) || 
                                        !isPaymentMethodConfigured(
                                            paymentMethods.find(m => m.id === selectedPaymentMethod)?.payment_method_name,
                                            paymentMethods.find(m => m.id === selectedPaymentMethod)?.display_name,
                                            shopProfile
                                        )
                                    }
                                >
                                    ยืนยันการชำระเงิน
                                    {receivedAmount >= total && ` (${formatCurrency(total)})`}
                                </Button>
                             </div>
                         </Card>
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
        </PageContainer>
    );
}
