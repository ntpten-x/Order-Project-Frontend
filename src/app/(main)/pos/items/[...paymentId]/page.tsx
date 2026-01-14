"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Typography, Row, Col, Card, Button, Spin, Empty, Divider,  Input, message, Radio, Space, InputNumber, Statistic as AntStatistic, Select, App } from "antd";
import { ArrowLeftOutlined, ShopOutlined, ShoppingOutlined, RocketOutlined, DollarOutlined, CreditCardOutlined, QrcodeOutlined, CheckCircleOutlined, UserOutlined } from "@ant-design/icons";
import { ordersService } from "../../../../../services/pos/orders.service";
import { paymentMethodService } from "../../../../../services/pos/paymentMethod.service";
import { discountsService } from "../../../../../services/pos/discounts.service";
import { paymentsService } from "../../../../../services/pos/payments.service";
import { posHistoryService } from "../../../../../services/pos/posHistory.service";
import { tablesService } from "../../../../../services/pos/tables.service";
import { authService } from "../../../../../services/auth.service";

import { Orders, OrderStatus } from "../../../../../types/api/pos/orders";
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

    const [order, setOrder] = useState<Orders | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [discounts, setDiscounts] = useState<Discounts[]>([]);
    
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
            const [orderData, methodsRes, discountsRes] = await Promise.all([
                ordersService.getById(paymentId),
                paymentMethodService.getAll(),
                discountsService.getAll()
            ]);
            
            if (orderData.status !== OrderStatus.WaitingForPayment) {
                message.warning("ออเดอร์นี้ไม่ได้อยู่ในสถานะรอชำระเงิน");
                router.push('/pos/items');
                return;
            }

            setOrder(orderData);
            setPaymentMethods(methodsRes);
            setDiscounts(discountsRes);

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

            // 3. Create History Record
            const methodObj = paymentMethods.find(m => m.id === selectedPaymentMethod);
            const extendedPaymentData = {
                ...paymentData,
                payment_method_name: methodObj?.display_name || methodObj?.payment_method_name || 'Unknown',
                payment_method: methodObj
            };

            const historyData = {
                order_id: order!.id,
                order_no: order!.order_no,
                order_type: order!.order_type,
                table_id: order!.table_id,
                delivery_id: order!.delivery_id,
                created_by_id: order!.created_by_id,
                sub_total: totals.subtotal,
                discount_amount: totals.discount,
                vat: order!.vat,
                total_amount: totals.total,
                received_amount: receivedAmount,
                change_amount: totals.change,
                status: OrderStatus.Paid,
                create_date: order!.create_date,
                items_snapshot: order!.items, 
                payments_snapshot: [extendedPaymentData],
                additional_data: { 
                    note: "Payment Completed",
                    table_name: order!.table?.table_name || 'N/A',
                    employee_name: (order!.created_by as any)?.username || 'Unknown',
                    payment_method_name: methodObj?.display_name || methodObj?.payment_method_name,
                    discount_name: appliedDiscount?.discount_name,
                    discount_display_name: appliedDiscount?.display_name
                }
            };
            await posHistoryService.create(historyData, undefined, csrfToken);

            // 4. Update Table Status if DineIn
            if (order!.table_id) {
                 await tablesService.update(order!.table_id, { status: TableStatus.Available }, undefined, csrfToken);
            }

            messageApi.success("ชำระเงินเรียบร้อย");
            router.push('/pos/history'); // Go to history

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
                                                onClick={() => setSelectedPaymentMethod(method.id)}
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
                                                {/* Simple Icon Logic matching names could be refined */}
                                                <div style={{ fontSize: 24, marginBottom: 8, color: selectedPaymentMethod === method.id ? colors.primary : '#595959' }}>
                                                    {method.payment_method_name.toLowerCase().includes('cash') || method.display_name.includes('สด') ? <DollarOutlined /> : 
                                                     method.payment_method_name.toLowerCase().includes('qr') ? <QrcodeOutlined /> : <CreditCardOutlined />}
                                                </div>
                                                <Text strong style={{ color: selectedPaymentMethod === method.id ? colors.primary : undefined }}>{method.display_name}</Text>
                                            </div>
                                        </Col>
                                    ))}
                                </Row>

                                <div style={{ background: '#fafafa', padding: 16, borderRadius: 8 }}>
                                    <Text style={{ display: 'block', marginBottom: 8 }}>รับเงินมา (Received Amount)</Text>
                                    <InputNumber 
                                        style={{ width: '100%', fontSize: 24, height: 50 }} 
                                        size="large"
                                        min={0}
                                        value={receivedAmount}
                                        onChange={(val) => setReceivedAmount(val || 0)}
                                        formatter={value => `฿ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    />
                                    
                                     <Row justify="space-between" style={{ marginTop: 16 }}>
                                        <Text type="secondary" style={{ fontSize: 16 }}>เงินทอน (Change)</Text>
                                        <Text strong style={{ fontSize: 20, color: change > 0 ? colors.success : undefined }}>฿{change.toLocaleString()}</Text>
                                    </Row>
                                </div>

                                <Button 
                                    type="primary" 
                                    size="large" 
                                    block 
                                    style={{ height: 50, fontSize: 18, marginTop: 8 }}
                                    onClick={handleConfirmPayment}
                                    loading={isProcessing}
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
