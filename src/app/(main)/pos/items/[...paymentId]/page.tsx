"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Typography, Row, Col, Card, Button, Spin, Empty, Divider,  Input, message, Radio, Space, InputNumber, Statistic as AntStatistic, Select, App } from "antd";
import { ArrowLeftOutlined, ShopOutlined, ShoppingOutlined, RocketOutlined, DollarOutlined, CreditCardOutlined, QrcodeOutlined, CheckCircleOutlined, UserOutlined, UndoOutlined } from "@ant-design/icons";
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
import { Tables, TableStatus } from "../../../../../types/api/pos/tables";
import { Discounts, DiscountType } from "../../../../../types/api/pos/discounts";
import { PaymentStatus } from "../../../../../types/api/pos/payments";
import { pageStyles, colors } from "../../style";
import dayjs from "dayjs";
import 'dayjs/locale/th';

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

    useEffect(() => {
        if (paymentId) {
            fetchInitialData();
        }
    }, [paymentId]);

    const fetchInitialData = async () => {
        try {
            setIsLoading(true);
            const [orderData, methodsRes, discountsRes, shopRes] = await Promise.all([
                ordersService.getById(paymentId),
                paymentMethodService.getAll(),
                discountsService.getAll(),
                shopProfileService.getProfile()
            ]);
            
            if (orderData.status !== OrderStatus.WaitingForPayment) {
                message.warning("ออเดอร์นี้ไม่ได้อยู่ในสถานะรอชำระเงิน");
                router.push('/pos/items');
                return;
            }

            setOrder(orderData);
            setPaymentMethods(methodsRes);
            setDiscounts(discountsRes);
            setShopProfile(shopRes);

            // Default received amount to total if exists
            if (orderData) {
                setReceivedAmount(Number(orderData.total_amount));
            }

        } catch (error) {
            console.error("Failed to fetch data:", error);
            messageApi.error("ไม่สามารถโหลดข้อมูลการชำระเงินได้");
        } finally {
            setIsLoading(false);
        }
    };

    // Calculation Logic
    const calculateTotals = () => {
        if (!order) return { subtotal: 0, discount: 0, total: 0, change: 0 };

        const subtotal = Number(order.total_amount); 
        
        let discountVal = 0;
        if (appliedDiscount) {
            if (appliedDiscount.discount_type === DiscountType.Percentage) {
                discountVal = subtotal * (appliedDiscount.discount_amount / 100);
            } else {
                discountVal = appliedDiscount.discount_amount;
            }
        }

        const total = Math.max(0, subtotal - discountVal);
        const change = Math.max(0, receivedAmount - total);

        return { subtotal, discount: discountVal, total, change };
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

        try {
            setIsProcessing(true);
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
        }
    };

    const { subtotal, discount, total, change } = calculateTotals();

    if (isLoading) return <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>;
    if (!order) return <Empty description="ไม่พบข้อมูลออเดอร์" />;

    return (
        <div style={pageStyles.container}>
            {contextHolder}
             <div style={{ ...pageStyles.heroParams, paddingBottom: 80 }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 10 }}>
                    <div style={pageStyles.sectionTitle}>
                         <Button type="text" icon={<ArrowLeftOutlined />} style={{ color: '#fff', marginRight: 16 }} onClick={() => router.back()}>กลับ</Button>
                         <div>
                            <Title level={3} style={{ margin: 0, color: '#fff' }}>ชำระเงิน</Title>
                            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>Payment #{order.order_no}</Text>
                        </div>
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
                                                <img src={item.product.img_url} alt={item.product?.display_name} style={{ width: 50, height: 50, borderRadius: 8, objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: 50, height: 50, background: '#f5f5f5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShopOutlined style={{ color: '#ccc' }} /></div>
                                            )}
                                            <div>
                                                <Text strong style={{ display: 'block' }}>{item.product?.display_name}</Text>
                                                <Text type="secondary">x {item.quantity}</Text>
                                                {item.notes && <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>* {item.notes}</Text>}
                                            </div>
                                         </div>
                                         <Text>฿{(item.total_price || (item.price * item.quantity)).toLocaleString()}</Text>
                                    </div>
                                ))}
                            </div>
                            
                            <div style={{ marginTop: 'auto', paddingTop: 16 }}>
                                <Row justify="space-between" style={{ marginBottom: 8 }}>
                                    <Text type="secondary">ยอดรวม (Subtotal)</Text>
                                    <Text>฿{subtotal.toLocaleString()}</Text>
                                </Row>
                                {appliedDiscount && (
                                    <Row justify="space-between" style={{ marginBottom: 8, color: colors.success }}>
                                        <Text type="success">ส่วนลด ({appliedDiscount.display_name})</Text>
                                        <Text type="success">-฿{discount.toLocaleString()}</Text>
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
                                    onChange={(value) => {
                                        if (!value) {
                                            setAppliedDiscount(null);
                                            message.info("ยกเลิกการใช้ส่วนลด");
                                        } else {
                                            const selected = discounts.find(d => d.id === value);
                                            if (selected) {
                                                setAppliedDiscount(selected);
                                                message.success(`ใช้ส่วนลด "${selected.display_name}" เรียบร้อย`);
                                            }
                                        }
                                    }}
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
        </div>
    );
}
