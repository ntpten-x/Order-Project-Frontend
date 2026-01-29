"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Typography, Row, Col, Card, Button, Spin, Empty, Divider, message, Tag, Avatar, Space } from "antd";
import { ArrowLeftOutlined, ShopOutlined, RocketOutlined, CheckCircleOutlined, UserOutlined, EditOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { ordersService } from "@/services/pos/orders.service";
import { paymentMethodService } from "@/services/pos/paymentMethod.service";
import { paymentsService } from "@/services/pos/payments.service";
import { authService } from "@/services/auth.service";
import { SalesOrder, OrderStatus, OrderType } from "@/types/api/pos/salesOrder";
import { PaymentStatus } from "@/types/api/pos/payments";
import { paymentPageStyles, paymentColors } from "@/theme/pos/payments.theme";
import { calculatePaymentTotals } from "@/utils/payments";
import dayjs from "dayjs";
import 'dayjs/locale/th';
import { getOrderChannelText, getOrderReference, getOrderStatusColor, getOrderStatusText, getEditOrderNavigationPath, getCancelOrderNavigationPath, ConfirmationConfig, formatCurrency } from "@/utils/orders";
import ConfirmationDialog from "@/components/dialog/ConfirmationDialog";
import { useGlobalLoading } from "@/contexts/pos/GlobalLoadingContext";

const { Title, Text } = Typography;
dayjs.locale('th');

export default function POSDeliverySummaryPage() {
    const router = useRouter();
    const params = useParams();
    const [messageApi, contextHolder] = message.useMessage();
    const deliveryId = Array.isArray(params?.deliveryId) ? params.deliveryId[0] : params?.deliveryId; 

    const [order, setOrder] = useState<SalesOrder | null>(null);
    const [isLoading, setIsLoading] = useState(true);
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
        if (!deliveryId) return;
        try {
            setIsLoading(true);
            showLoading("กำลังโหลดข้อมูลออเดอร์...");

            const orderData = await ordersService.getById(deliveryId);
            
            if (orderData.status !== OrderStatus.WaitingForPayment) {
                 router.push('/pos/channels');
                 return;
            }

            setOrder(orderData);
        } catch (error) {
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

    const { subtotal, discount, vat, total } = calculatePaymentTotals(order, Number(order?.total_amount || 0));

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
                    <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
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
                    const csrfToken = await authService.getCsrfToken();
                    
                    // 1. Fetch the explicit "Delivery" payment method
                    const deliveryMethod = await paymentMethodService.getByName('Delivery');

                    // 2. Create Payment Record (to record sales data)
                    // The backend PaymentsService already handles order completion 
                    // and item status updates upon successful payment.
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
                    router.push(`/pos/dashboard/${order.id}`);

                } catch (error) {
                    messageApi.error("เกิดข้อผิดพลาดในการส่งมอบ");
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
                    const csrfToken = await authService.getCsrfToken();
                    
                    const activeItems = order.items?.filter(item => item.status !== OrderStatus.Cancelled) || [];
                    await Promise.all(
                        activeItems.map(item => 
                            ordersService.updateItemStatus(item.id, OrderStatus.Served, undefined, csrfToken)
                        )
                    );

                    await ordersService.updateStatus(order.id, OrderStatus.Pending, csrfToken);

                    messageApi.success("ย้อนกลับไปแก้ไขออเดอร์เรียบร้อย");
                    router.push(getEditOrderNavigationPath(order.id));

                } catch (error) {
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
            content: 'การดำเนินการนี้จะยกเลิกสินค้าทุกรายการ คุณแน่ใจหรือไม่?',
            okText: 'ยืนยันการยกเลิก',
            cancelText: 'ยกเลิก',
            onOk: async () => {
                try {
                    showLoading("กำลังดำเนินการยกเลิก...");
                    closeConfirm();
                    const csrfToken = await authService.getCsrfToken();

                    const activeItems = order.items?.filter(item => item.status !== OrderStatus.Cancelled) || [];
                    await Promise.all(
                        activeItems.map(item => 
                            ordersService.updateItemStatus(item.id, OrderStatus.Cancelled, undefined, csrfToken)
                        )
                    );

                    await ordersService.updateStatus(order.id, OrderStatus.Cancelled, csrfToken);

                    messageApi.success("ยกเลิกออเดอร์เรียบร้อย");
                    router.push(getCancelOrderNavigationPath(order.order_type));

                } catch (error) {
                    messageApi.error("ไม่สามารถยกเลิกออเดอร์ได้");
                } finally {
                    hideLoading();
                }
            }
        });
    };

    if (isLoading && !order) return null;
    if (!order) return <Empty description="ไม่พบข้อมูลออเดอร์" />;

    return (
        <div style={paymentPageStyles.container}>
            {contextHolder}
            
            {/* Hero Header */}
             <div style={{ ...paymentPageStyles.heroSection, background: 'linear-gradient(135deg, #eb2f96 0%, #c41d7f 100%)' }}>
                <div style={paymentPageStyles.contentWrapper}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                         <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                             <Button 
                                type="text" 
                                icon={<ArrowLeftOutlined style={{ fontSize: 20 }} />} 
                                style={{ color: '#fff', padding: 0, height: 'auto', marginTop: 4 }} 
                                onClick={() => router.back()}
                              />
                             <div>
                                <Title level={3} style={paymentPageStyles.pageTitle}>สรุปออเดอร์เดลิเวอรี่</Title>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                                    <Tag color="magenta" style={{ borderRadius: 6, border: 'none', fontWeight: 600 }}>
                                        <RocketOutlined /> {order.delivery?.delivery_name || 'Delivery'} {order.delivery_code ? `#${order.delivery_code}` : ''}
                                    </Tag>
                                    <Tag color={getOrderStatusColor(order.status)} style={{ borderRadius: 6, border: 'none' }}>
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

            <div style={{ ...paymentPageStyles.contentWrapper, marginTop: -30, paddingBottom: 40 }}>
                <Row gutter={[24, 24]}>
                    <Col xs={24} lg={14}>
                        <Card style={paymentPageStyles.card}>
                             <Title level={4} style={{ marginBottom: 20 }}>รายการอาหาร</Title>
                            <div style={{ overflowY: 'auto', paddingRight: 8, minHeight: 300, maxHeight: 600 }}>
                                {order.items?.filter(item => item.status !== OrderStatus.Cancelled).map((item, idx) => (
                                    <div key={item.id || idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${paymentColors.borderLight}` }}>
                                         <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: 0 }}>
                                            <Avatar 
                                                shape="square" 
                                                size={56} 
                                                src={item.product?.img_url} 
                                                icon={<ShopOutlined />}
                                                style={{ backgroundColor: '#f0f2f5', flexShrink: 0, borderRadius: 10 }} 
                                            />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <Text strong style={{ display: 'block', fontSize: 15 }} ellipsis>{item.product?.display_name}</Text>
                                                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                                                    <Text type="secondary" style={{ fontSize: 13 }}>{formatCurrency(item.price)}</Text>
                                                    <Tag style={{ margin: 0, fontSize: 11, borderRadius: 4 }}>x{item.quantity}</Tag>
                                                </div>
                                                {item.notes && <Text type="secondary" style={{ display: 'block', fontSize: 12, fontStyle: 'italic', marginTop: 4 }}>* {item.notes}</Text>}
                                            </div>
                                         </div>
                                         <Text strong style={{ fontSize: 15 }}>{formatCurrency(Number(item.total_price))}</Text>
                                    </div>
                                ))}
                            </div>
                            
                            <div style={{ ...paymentPageStyles.summaryBox, background: '#f8fafc', borderRadius: 16, padding: 20 }}>
                                <Row justify="space-between" style={{ marginBottom: 8 }}>
                                    <Text type="secondary">ยอดรวม (Subtotal)</Text>
                                    <Text>{formatCurrency(subtotal)}</Text>
                                </Row>
                                {discount > 0 && (
                                    <Row justify="space-between" style={{ marginBottom: 8, color: paymentColors.success }}>
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
                                    <Title level={4} style={{ margin: 0 }}>ยอดรวมสุทธิ</Title>
                                    <Title level={3} style={{ color: '#eb2f96', margin: 0 }}>{formatCurrency(total)}</Title>
                                </Row>
                            </div>
                        </Card>
                    </Col>
                    
                    <Col xs={24} lg={10}>
                         <Card style={{ ...paymentPageStyles.card, textAlign: 'center', padding: '24px 0' }}>
                            <div style={{ marginBottom: 32 }}>
                                <div style={{ 
                                    width: 80, 
                                    height: 80, 
                                    borderRadius: '50%', 
                                    background: '#fff0f6', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    margin: '0 auto 16px' 
                                }}>
                                    <RocketOutlined style={{ fontSize: 40, color: '#eb2f96' }} />
                                </div>
                                <Title level={4}>พร้อมสำหรับการจัดส่ง</Title>
                                <Text type="secondary">ตรวจสอบความถูกต้องของรายการอาหารและเครื่องดื่ม ก่อนส่งมอบให้ไรเดอร์</Text>
                            </div>

                            <Card 
                                style={{ background: '#f9fafb', borderRadius: 16, border: '1px dashed #d1d5db', marginBottom: 32 }}
                                bodyStyle={{ padding: 16 }}
                            >
                                <Space direction="vertical" style={{ width: '100%' }} size={12}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Text type="secondary">ผู้ให้บริการ</Text>
                                        <Text strong>{order.delivery?.delivery_name || '-'}</Text>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Text type="secondary">รหัสออเดอร์ไรเดอร์</Text>
                                        <Text strong>{order.delivery_code || '-'}</Text>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Text type="secondary">เลขที่ออเดอร์ POS</Text>
                                        <Text strong>{order.order_no}</Text>
                                    </div>
                                </Space>
                            </Card>

                            <Button 
                                type="primary" 
                                size="large" 
                                block 
                                icon={<CheckCircleOutlined />}
                                style={{ 
                                    height: 64, 
                                    fontSize: 18, 
                                    borderRadius: 16, 
                                    background: '#eb2f96', 
                                    borderColor: '#eb2f96', 
                                    fontWeight: 700,
                                    boxShadow: '0 8px 16px rgba(235, 47, 150, 0.25)' 
                                }}
                                onClick={handleHandoverToRider}
                            >
                                ส่งมอบสินค้าให้ไรเดอร์
                            </Button>

                            <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
                                <Text type="secondary" style={{ fontSize: 13 }}>
                                    เมื่อกดแล้ว ระบบจะบันทึกยอดขายและปิดออเดอร์นี้
                                </Text>
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
    );
}
