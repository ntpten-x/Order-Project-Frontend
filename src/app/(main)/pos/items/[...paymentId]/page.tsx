"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Typography, Row, Col, Card, Button, Spin, Empty, Divider, message, InputNumber, Select, Tag } from "antd";
import { ArrowLeftOutlined, ShopOutlined, DollarOutlined, CreditCardOutlined, QrcodeOutlined, UndoOutlined, EditOutlined } from "@ant-design/icons";
import { QRCodeSVG } from 'qrcode.react';
import generatePayload from 'promptpay-qr';
import { ordersService } from "../../../../../services/pos/orders.service";
import { paymentMethodService } from "../../../../../services/pos/paymentMethod.service";
import { discountsService } from "../../../../../services/pos/discounts.service";
import { paymentsService } from "../../../../../services/pos/payments.service";
import { tablesService } from "../../../../../services/pos/tables.service";
import { authService } from "../../../../../services/auth.service";
import { shopProfileService, ShopProfile } from "../../../../../services/pos/shopProfile.service";

import { SalesOrder, OrderStatus } from "../../../../../types/api/pos/salesOrder";
import { PaymentMethod } from "../../../../../types/api/pos/paymentMethod";
import { TableStatus } from "../../../../../types/api/pos/tables";
import { Discounts, DiscountType } from "../../../../../types/api/pos/discounts";
import { PaymentStatus } from "../../../../../types/api/pos/payments";
import { pageStyles, colors } from "../../style";
import dayjs from "dayjs";
import 'dayjs/locale/th';
import { getOrderChannelText, getOrderReference, getOrderStatusColor, getOrderStatusText, getEditOrderNavigationPath, getCancelOrderNavigationPath, ConfirmationConfig } from "@/utils/orders";
import ConfirmationDialog from "@/components/dialog/ConfirmationDialog";
import { useGlobalLoading } from "@/contexts/GlobalLoadingContext";

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
    const [isProcessing, setIsProcessing] = useState(false);
    const { showLoading, hideLoading } = useGlobalLoading();

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
        if (!paymentId) return;
        try {
            console.log("Fetching payment data for ID:", paymentId);
            setIsLoading(true);
            showLoading("กำลังโหลดข้อมูลการชำระเงิน...");

            // Fetch shop profile separately to avoid breaking the page if it fails
            const shopRes = await shopProfileService.getProfile().catch(err => {
                console.warn("Failed to fetch shop profile:", err);
                return null;
            });

            const [orderData, methodsRes, discountsRes] = await Promise.all([
                ordersService.getById(paymentId),
                paymentMethodService.getAll(),
                discountsService.getAll()
            ]);
            
            console.log("Order Data Received:", orderData);
            console.log("Order Items:", orderData.items);

            if (orderData.status !== OrderStatus.WaitingForPayment) {
                 router.push('/pos/channels');
                 return;
            }

            setOrder(orderData);
            setPaymentMethods(methodsRes);
            setDiscounts(discountsRes);
            setShopProfile(shopRes);
            
            // Sync initial discount
            if (orderData.discount) {
                setAppliedDiscount(orderData.discount);
            }

            // Default received amount to total if exists
            if (orderData) {
                setReceivedAmount(Number(orderData.total_amount));
            }

        } catch (error) {
            console.error("Failed to fetch data:", error);
            messageApi.error("ไม่สามารถโหลดข้อมูลการชำระเงินได้: " + (error instanceof Error ? error.message : "Unknown error"));
        } finally {
            setIsLoading(false);
            hideLoading();
        }
    }, [messageApi, paymentId, router, showLoading, hideLoading]);

    useEffect(() => {
        if (paymentId) {
            fetchInitialData();
        }
    }, [fetchInitialData, paymentId]);

    // Calculation Logic - Now relies on Order state from Backend
    const calculateTotals = () => {
        if (!order) return { subtotal: 0, discount: 0, vat: 0, total: 0, change: 0 };

        const subtotal = Number(order.sub_total || 0);
        const discountVal = Number(order.discount_amount || 0);
        const vat = Number(order.vat || 0);
        const total = Number(order.total_amount || 0);
        const change = Math.max(0, receivedAmount - total);

        return { subtotal, discount: discountVal, vat, total, change };
    };

    const handleDiscountChange = async (value: string | undefined) => {
        if (!order) return;
        
        try {
            setIsLoading(true);
            const csrfToken = await authService.getCsrfToken();
            
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

            // Reset received amount to new total to be helpful
            setReceivedAmount(updatedOrder.total_amount);

        } catch (error) {
            console.error("Failed to update discount:", error);
            messageApi.error("ไม่สามารถบันทึกส่วนลดได้");
            // Revert selection if needed, but for now just show error
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmPayment = async () => {
        if (!selectedPaymentMethod) {
            messageApi.error("กรุณาเลือกวิธีการชำระเงิน");
            return;
        }

        const totals = calculateTotals();
        
        if (receivedAmount < totals.total) {
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
                    <div style={{ fontSize: 24, fontWeight: 700, color: colors.primary }}>
                        ยอดสุทธิ ฿{totals.total.toLocaleString()}
                    </div>
                    {totals.change > 0 && (
                        <div style={{ color: colors.success, fontSize: 18, marginTop: 4 }}>
                            เงินทอน ฿{totals.change.toLocaleString()}
                        </div>
                    )}
                </div>
            ),
            okText: 'ยืนยัน',
            cancelText: 'ยกเลิก',
            onOk: async () => {
                try {
                    setIsProcessing(true);
                    showLoading("กำลังดำเนินการชำระเงิน...");
                    closeConfirm();
                    const csrfToken = await authService.getCsrfToken();
                    
                    // 1. Create Payment Record
                    const paymentData = {
                        order_id: order!.id,
                        payment_method_id: selectedPaymentMethod,
                        amount: totals.total,
                        amount_received: receivedAmount,
                        change_amount: totals.change,
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
                    router.push(`/pos/dashboard/${order!.id}`); // Go to order detail

                } catch (error) {
                    console.error("Payment failed:", error);
                    messageApi.error("การชำระเงินล้มเหลว");
                } finally {
                    setIsProcessing(false);
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
                    setIsProcessing(true);
                    showLoading("กำลังดำเนินการ...");
                    closeConfirm();
                    const csrfToken = await authService.getCsrfToken();
                    
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
                    router.push(getEditOrderNavigationPath(order.id));

                } catch (error) {
                    console.error("Revert failed:", error);
                    messageApi.error("ไม่สามารถเปลี่ยนสถานะออเดอร์ได้");
                } finally {
                    setIsProcessing(false);
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
                    setIsProcessing(true);
                    showLoading("กำลังดำเนินการยกเลิก...");
                    closeConfirm();
                    const csrfToken = await authService.getCsrfToken();

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
                    router.push(getCancelOrderNavigationPath(order.order_type));

                } catch (error) {
                    console.error("Cancel failed:", error);
                    messageApi.error("ไม่สามารถยกเลิกออเดอร์ได้");
                } finally {
                    setIsProcessing(false);
                    hideLoading();
                }
            }
        });
    };

    const { subtotal, discount, vat, total, change } = calculateTotals();

    if (isLoading && !order) return null;
    if (!order) return <Empty description="ไม่พบข้อมูลออเดอร์" />;

    return (
        <div style={pageStyles.container}>
            {contextHolder}
             <div style={{ ...pageStyles.heroParams, paddingBottom: 80 }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 10 }}>
                    <div style={{ ...pageStyles.sectionTitle, flexWrap: 'wrap', gap: '12px 16px' }}>
                         <Button type="text" icon={<ArrowLeftOutlined />} style={{ color: '#fff', padding: '4px 8px' }} onClick={() => router.back()}>กลับ</Button>
                         <div style={{ flex: 1, minWidth: 0 }}>
                            <Title level={3} style={{ margin: 0, color: '#fff', fontSize: 'clamp(18px, 5vw, 24px)' }}>ชำระเงิน</Title>
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px 12px', 
                                marginTop: 6, 
                                flexWrap: 'wrap' 
                            }}>
                                <Tag color="blue" style={{ margin: 0, borderRadius: 4, fontWeight: 600, fontSize: 13, padding: '2px 8px' }}>
                                    {order && getOrderChannelText(order.order_type)} {order && `(${getOrderReference(order)})`}
                                </Tag>
                                <Tag color={order ? getOrderStatusColor(order.status) : 'default'} style={{ margin: 0, borderRadius: 4, fontWeight: 600, fontSize: 13, padding: '2px 8px' }}>
                                    {order && getOrderStatusText(order.status)}
                                </Tag>
                                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, whiteSpace: 'nowrap' }}>
                                    เลขที่: {order.order_no}
                                </Text>
                            </div>
                        </div>
                        <Button 
                            icon={<EditOutlined />} 
                            onClick={handleEditOrder}
                            style={{ 
                                background: 'rgba(255,255,255,0.15)', 
                                border: '1px solid rgba(255,255,255,0.3)',
                                color: '#fff',
                                borderRadius: 8,
                                fontWeight: 600
                            }}
                            className="hide-on-mobile"
                        >
                            แก้ไขออเดอร์
                        </Button>
                        <Button 
                            icon={<EditOutlined />} 
                            onClick={handleEditOrder}
                            style={{ 
                                background: 'rgba(255,255,255,0.15)', 
                                border: '1px solid rgba(255,255,255,0.3)',
                                color: '#fff',
                                borderRadius: 8,
                                display: 'none'
                             }}
                            className="show-on-mobile-inline"
                            size="middle"
                        />
                        <Button 
                            danger
                            onClick={handleCancelOrder}
                            style={{ 
                                borderRadius: 8,
                                fontWeight: 600
                            }}
                            className="hide-on-mobile"
                        >
                            ยกเลิกออเดอร์
                        </Button>
                        <Button 
                            danger
                            onClick={handleCancelOrder}
                            style={{ 
                                borderRadius: 8,
                                display: 'none'
                             }}
                            className="show-on-mobile-inline"
                            size="middle"
                        >ยกเลิก</Button>
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: 1200, margin: '-40px auto 30px', padding: '0 24px', position: 'relative', zIndex: 20 }}>
                <Row gutter={24}>
                    {/* Left: Summary */}
                    <Col xs={24} lg={14}>
                        <Card style={{ borderRadius: 12, height: '100%' }} title={<Text strong>รายการสรุป (Order Summary)</Text>}>
                            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                                {order.items?.filter(item => item.status !== OrderStatus.Cancelled).map((item, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #f0f0f0' }}>
                                         <div style={{ display: 'flex', gap: 12 }}>
                                            {item.product?.img_url ? (
                                                <>
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={item.product.img_url} alt={item.product?.display_name} style={{ width: 50, height: 50, borderRadius: 8, objectFit: 'cover' }} />
                                                </>
                                            ) : (
                                                <div style={{ width: 50, height: 50, background: '#f5f5f5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShopOutlined style={{ color: '#ccc' }} /></div>
                                            )}
                                            <div>
                                                <Text strong style={{ display: 'block' }}>{item.product?.display_name}</Text>
                                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                    <Text type="secondary" style={{ fontSize: 13 }}>฿{Number(item.price).toLocaleString()}</Text>
                                                    <Text type="secondary" style={{ fontSize: 12 }}>x {item.quantity}</Text>
                                                </div>
                                                {item.notes && <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>* {item.notes}</Text>}
                                            </div>
                                         </div>
                                         <Text strong>฿{(item.total_price || (item.price * item.quantity)).toLocaleString()}</Text>
                                    </div>
                                ))}
                            </div>
                            
                            <div style={{ marginTop: 'auto', paddingTop: 16 }}>
                                <Row justify="space-between" style={{ marginBottom: 8 }}>
                                    <Text type="secondary">ยอดรวม (Subtotal)</Text>
                                    <Text>฿{subtotal.toLocaleString()}</Text>
                                </Row>
                                {discount > 0 && (
                                    <Row justify="space-between" style={{ marginBottom: 8, color: colors.success }}>
                                        <Text type="success">ส่วนลด (Discount)</Text>
                                        <Text type="success">-฿{discount.toLocaleString()}</Text>
                                    </Row>
                                )}
                                {vat > 0 && (
                                    <Row justify="space-between" style={{ marginBottom: 8 }}>
                                        <Text type="secondary">VAT (7%)</Text>
                                        <Text>฿{vat.toLocaleString()}</Text>
                                    </Row>
                                )}
                                <Divider style={{ margin: '12px 0' }} />
                                <Row justify="space-between">
                                    <Title level={4}>ยอดสุทธิ (Total)</Title>
                                    <Title level={3} style={{ color: colors.primary, margin: 0 }}>฿{total.toLocaleString()}</Title>
                                </Row>
                            </div>
                        </Card>
                    </Col>
                    
                    {/* Right: Payment Actions */}
                    <Col xs={24} lg={10}>
                         <Card style={{ borderRadius: 12, marginBottom: 24 }} title="ส่วนลด (Discount)">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <Select
                                    placeholder="เลือกส่วนลด (Select Discount)"
                                    style={{ width: '100%' }}
                                    allowClear
                                    size="large"
                                    value={appliedDiscount ? appliedDiscount.id : undefined}
                                    onChange={handleDiscountChange}
                                >
                                    {discounts.filter(d => d.is_active).map(d => (
                                        <Select.Option key={d.id} value={d.id}>
                                            {d.display_name} ({d.discount_type === DiscountType.Percentage ? `${d.discount_amount}%` : `-${d.discount_amount}฿`})
                                        </Select.Option>
                                    ))}
                                </Select>
                            </div>
                         </Card>

                          <Card style={{ borderRadius: 12 }} title="วิธีการชำระเงิน (Payment Method)">
                             <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <Row gutter={[12, 12]}>
                                    {paymentMethods.map(method => (
                                        <Col span={12} key={method.id}>
                                            <div 
                                                onClick={() => {
                                                    setSelectedPaymentMethod(method.id);
                                                    setReceivedAmount(method.payment_method_name.toLowerCase().includes('qr') || method.payment_method_name.toLowerCase().includes('prompt') ? total : 0);
                                                }}
                                                style={{ 
                                                    border: `2px solid ${selectedPaymentMethod === method.id ? colors.primary : '#f0f0f0'}`,
                                                    borderRadius: 8,
                                                    padding: 16,
                                                    textAlign: 'center',
                                                    cursor: 'pointer',
                                                    backgroundColor: selectedPaymentMethod === method.id ? '#f0f5ff' : '#fff',
                                                    transition: 'all 0.3s'
                                                }}
                                            >   
                                                <div style={{ fontSize: 24, marginBottom: 8, color: selectedPaymentMethod === method.id ? colors.primary : '#595959' }}>
                                                    {method.payment_method_name.toLowerCase().includes('cash') || method.display_name.includes('สด') ? <DollarOutlined /> : 
                                                     method.payment_method_name.toLowerCase().includes('qr') || method.payment_method_name.toLowerCase().includes('prompt') ? <QrcodeOutlined /> : <CreditCardOutlined />}
                                                </div>
                                                <Text strong style={{ color: selectedPaymentMethod === method.id ? colors.primary : undefined }}>{method.display_name}</Text>
                                            </div>
                                        </Col>
                                    ))}
                                </Row>

                                <Divider style={{ margin: '8px 0' }} />

                                {/* DYNAMIC CONTENT AREA */}
                                {selectedPaymentMethod && (
                                    <div style={{ animation: 'fadeIn 0.5s' }}>
                                        {(() => {
                                            const method = paymentMethods.find(m => m.id === selectedPaymentMethod);
                                            const isCash = method?.payment_method_name.toLowerCase().includes('cash') || method?.display_name.includes('สด');
                                            const isPromptPay = method?.payment_method_name.toLowerCase().includes('qr') || method?.payment_method_name.toLowerCase().includes('prompt');

                                            if (isPromptPay) {
                                                if (!shopProfile?.promptpay_number) {
                                                     return <div style={{textAlign: 'center', color: 'red'}}>กรุณาตั้งค่าเบอร์ PromptPay ในระบบก่อน (Shop Profile)</div>
                                                }
                                                const payload = generatePayload(shopProfile.promptpay_number, { amount: total });
                                                return (
                                                    <div style={{ textAlign: 'center', background: '#fff', padding: 24, borderRadius: 12, border: '1px dashed #1890ff' }}>
                                                        <Text style={{ display: 'block', marginBottom: 16, fontSize: 16 }}>สแกน QR เพื่อชำระเงิน (Scan to Pay)</Text>
                                                        <div style={{ background: 'white', padding: 16, display: 'inline-block', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                                            <QRCodeSVG value={payload} size={200} level="L" includeMargin />
                                                        </div>
                                                        <div style={{ marginTop: 16 }}>
                                                            <Text strong style={{ fontSize: 24, color: colors.primary }}>฿{total.toLocaleString()}</Text>
                                                        </div>
                                                        <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                                                            PromptPay: {shopProfile.promptpay_number}
                                                            {shopProfile.promptpay_name && <><br/>({shopProfile.promptpay_name})</>}
                                                        </Text>
                                                    </div>
                                                );
                                            }

                                            if (isCash) {
                                                const quickAmounts = [20, 50, 100, 500, 1000];
                                                return (
                                                    <div style={{ background: '#fafafa', padding: 16, borderRadius: 8 }}>
                                                        <Text style={{ display: 'block', marginBottom: 8 }}>รับเงินมา (Received Amount)</Text>
                                                        <InputNumber 
                                                            style={{ width: '100%', fontSize: 32, height: 60, marginBottom: 12 }} 
                                                            size="large"
                                                            min={0}
                                                            value={receivedAmount}
                                                            onChange={(val) => setReceivedAmount(val || 0)}
                                                            formatter={value => `฿ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                            onFocus={(e) => e.target.select()}
                                                            autoFocus
                                                        />
                                                        
                                                        {/* Quick Buttons */}
                                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                                                            <Button onClick={() => setReceivedAmount(total)} type="primary" ghost>พอดี ({total})</Button>
                                                            {quickAmounts.map(amt => (
                                                                <Button key={amt} onClick={() => setReceivedAmount(amt)}>฿{amt}</Button>
                                                            ))}
                                                            <Button icon={<UndoOutlined />} onClick={() => setReceivedAmount(0)} danger></Button>
                                                        </div>

                                                        <Divider style={{ margin: '12px 0' }} />
                                                        
                                                        <Row justify="space-between" align="middle" style={{ background: change >= 0 ? '#f6ffed' : '#fff1f0', padding: 12, borderRadius: 8, border: `1px solid ${change >= 0 ? '#b7eb8f' : '#ffa39e'}` }}>
                                                            <Text style={{ fontSize: 16 }}>เงินทอน (Change)</Text>
                                                            <Text strong style={{ fontSize: 28, color: change >= 0 ? colors.success : colors.error }}>
                                                                ฿{Math.max(0, change).toLocaleString()}
                                                            </Text>
                                                        </Row>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div style={{ textAlign: 'center', padding: 20 }}>
                                                    <Text type="secondary">กรุณาดำเนินการชำระเงินตามช่องทางที่เลือก</Text>
                                                    <div style={{ marginTop: 16 }}>
                                                        <InputNumber 
                                                            style={{ width: '100%', fontSize: 24 }} 
                                                            value={receivedAmount} 
                                                            onChange={val => setReceivedAmount(val || 0)} 
                                                            formatter={value => `฿ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
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
                                    style={{ height: 60, fontSize: 20, marginTop: 8 }}
                                    onClick={handleConfirmPayment}
                                    loading={isProcessing}
                                    disabled={!selectedPaymentMethod || (receivedAmount < total)}
                                >
                                    ยืนยันการชำระเงิน (Complete)
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
                loading={isProcessing}
            />
        </div>
    );
}
