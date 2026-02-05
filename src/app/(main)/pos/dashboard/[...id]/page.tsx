"use client";

import React, { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { Typography, Button, Spin, message, Image, Modal } from "antd";
import { ArrowLeftOutlined, UserOutlined, ShopOutlined, ClockCircleOutlined, TableOutlined, CarOutlined, ShoppingOutlined, PrinterOutlined, TagOutlined, CheckCircleOutlined, CloseCircleOutlined, CreditCardOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { ordersService } from "../../../../../services/pos/orders.service";
import { shopProfileService, ShopProfile } from "../../../../../services/pos/shopProfile.service";
import { SalesOrder, OrderStatus, OrderType } from "../../../../../types/api/pos/salesOrder";
import { Payments } from "../../../../../types/api/pos/payments";
import { PaymentMethod } from "../../../../../types/api/pos/paymentMethod";
import { dashboardColors } from "../../../../../theme/pos/dashboard/style";
import dayjs from "dayjs";
import 'dayjs/locale/th';
import ReceiptTemplate from "../../../../../components/pos/shared/ReceiptTemplate";
import { sortOrderItems, getStatusTextStyle } from "../../../../../utils/dashboard/orderUtils";
import { groupOrderItems } from "../../../../../utils/orderGrouping";
import { ItemStatus } from "../../../../../types/api/pos/salesOrderItem";
import { useSocket } from "../../../../../hooks/useSocket";
import { useRealtimeRefresh } from "../../../../../utils/pos/realtime";
import { RealtimeEvents } from "../../../../../utils/realtimeEvents";
import PageContainer from "@/components/ui/page/PageContainer";

const { Title, Text } = Typography;
dayjs.locale('th');

interface Props {
    params: {
        id: string[];
    };
}

type ShopProfileExtended = ShopProfile & {
    tax_id?: string;
    logo_url?: string;
};

type PaymentWithMethod = Payments & {
    payment_method?: PaymentMethod | null;
};

// Thai months array
const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

const formatThaiDate = (dateStr: string) => {
    const d = dayjs(dateStr);
    return `${d.date()} ${thaiMonths[d.month()]} ${d.format('HH:mm')}`;
};

export default function DashboardOrderDetailPage({ params }: Props) {
    const router = useRouter();
    const orderId = params.id[0];
    const { socket } = useSocket();
    
    const [order, setOrder] = useState<SalesOrder | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [shopProfile, setShopProfile] = useState<ShopProfileExtended | null>(null);
    const [isPrintModalVisible, setIsPrintModalVisible] = useState(false);
    const receiptRef = useRef<HTMLDivElement>(null);

    const fetchOrderDetail = useCallback(async () => {
        if (!orderId) return;
        setIsLoading(true);
        try {
            const data = await ordersService.getById(orderId);
            setOrder(data);
        } catch (error) {
            console.error("Fetch order detail error:", error);
            message.error("ไม่พบข้อมูลออเดอร์");
        } finally {
            setIsLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        fetchOrderDetail();
    }, [fetchOrderDetail]);

    useRealtimeRefresh({
        socket,
        events: [
            RealtimeEvents.orders.update,
            RealtimeEvents.orders.delete,
            RealtimeEvents.payments.create,
            RealtimeEvents.payments.update,
        ],
        onRefresh: () => fetchOrderDetail(),
        intervalMs: 20000,
    });

    const fetchShopProfile = useCallback(async () => {
        try {
            const data = await shopProfileService.getProfile();
            setShopProfile(data);
        } catch (error) {
            console.warn("Could not fetch shop profile", error);
        }
    }, []);

    useEffect(() => {
        fetchShopProfile();
    }, [fetchShopProfile]);

    useRealtimeRefresh({
        socket,
        events: [RealtimeEvents.shopProfile.update],
        onRefresh: () => fetchShopProfile(),
        debounceMs: 800,
    });

    const handlePrint = () => {
        setIsPrintModalVisible(true);
        setTimeout(() => {
            if (receiptRef.current) {
                const printContents = receiptRef.current.innerHTML;
                const printWindow = window.open('', '', 'width=400,height=600');
                if (printWindow) {
                    printWindow.document.write(`
                        <html>
                            <head>
                                <title>ใบเสร็จ #${order?.order_no}</title>
                                <style>
                                    body { font-family: 'Courier New', Courier, monospace; padding: 0; margin: 0; }
                                    @media print {
                                        body { -webkit-print-color-adjust: exact; }
                                    }
                                </style>
                            </head>
                            <body>${printContents}</body>
                        </html>
                    `);
                    printWindow.document.close();
                    printWindow.focus();
                    printWindow.print();
                    printWindow.close();
                }
            }
            setIsPrintModalVisible(false);
        }, 500);
    };

    const items = useMemo(() => {
        const grouped = groupOrderItems(order?.items || []);
        return sortOrderItems(grouped);
    }, [order?.items]);

    if (isLoading) {
        return (
            <PageContainer maxWidth={99999} style={{ padding: 0 }}>
                <div style={{ 
                    minHeight: '100vh', 
                    background: '#F8FAFC',
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center' 
                }}>
                    <Spin size="large" />
                </div>
            </PageContainer>
        );
    }

    if (!order) {
        return (
            <PageContainer maxWidth={99999} style={{ padding: 0 }}>
                <div style={{ minHeight: '100vh', background: '#F8FAFC', padding: 24 }}>
                    <div style={{ textAlign: 'center', paddingTop: 60 }}>
                        <ShopOutlined style={{ fontSize: 48, color: '#CBD5E1', marginBottom: 16 }} />
                        <Title level={4} style={{ color: '#64748B' }}>ไม่พบข้อมูลออเดอร์</Title>
                        <Button type="primary" onClick={() => router.back()}>ย้อนกลับ</Button>
                    </div>
                </div>
            </PageContainer>
        );
    }

    const payments = (order.payments || []) as PaymentWithMethod[];
    
    // Derived Data
    const employeeName = order.created_by?.name || order.created_by?.username || 'ไม่ทราบ';
    const tableName = order.table?.table_name || '-';
    const discountInfo = order.discount;

    // Order Type Helper
    const getOrderTypeInfo = (type: OrderType) => {
        switch (type) {
            case OrderType.DineIn: return { icon: <TableOutlined />, label: 'ทานที่ร้าน', color: '#fff', bg: '#3B82F6' };
            case OrderType.TakeAway: return { icon: <ShoppingOutlined />, label: 'กลับบ้าน', color: '#fff', bg: '#22C55E' };
            case OrderType.Delivery: return { icon: <CarOutlined />, label: 'เดลิเวอรี่', color: '#fff', bg: '#EC4899' };
            default: return { icon: <ShopOutlined />, label: type, color: '#fff', bg: '#6B7280' };
        }
    };

    // Status Helper
    const getStatusInfo = (status: OrderStatus) => {
        switch (status) {
            case OrderStatus.Paid: return { bg: '#DCFCE7', color: '#16A34A', label: 'ชำระเงินแล้ว', icon: <CheckCircleOutlined /> };
            case OrderStatus.Cancelled: return { bg: '#FEE2E2', color: '#DC2626', label: 'ยกเลิก', icon: <CloseCircleOutlined /> };
            default: return { bg: '#F3F4F6', color: '#6B7280', label: status, icon: null };
        }
    };

    const orderTypeInfo = getOrderTypeInfo(order.order_type);
    const statusInfo = getStatusInfo(order.status);

    return (
        <PageContainer maxWidth={99999} style={{ padding: 0 }}>
        <div style={{ 
            minHeight: '100vh', 
            background: '#F8FAFC',
            paddingBottom: 100
        }}>
            {/* Compact Header */}
            <div style={{
                background: dashboardColors.headerGradient,
                padding: '16px',
                position: 'sticky',
                top: 0,
                zIndex: 100,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Button 
                            type="text" 
                            icon={<ArrowLeftOutlined style={{ fontSize: 18, color: '#fff' }} />} 
                            onClick={() => router.back()}
                            style={{ 
                                background: 'rgba(255,255,255,0.15)', 
                                border: 'none',
                                width: 40,
                                height: 40,
                                borderRadius: 12
                            }}
                        />
                        <div>
                            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 700, display: 'block' }}>
                                #{order.order_no}
                            </Text>
                            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
                                📅 {formatThaiDate(order.create_date)}
                            </Text>
                        </div>
                    </div>
                    <Button 
                        icon={<PrinterOutlined />}
                        onClick={handlePrint}
                        style={{ 
                            background: '#fff',
                            color: dashboardColors.primary,
                            border: 'none',
                            borderRadius: 10,
                            fontWeight: 600,
                            height: 36
                        }}
                    >
                        พิมพ์
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div style={{ padding: '16px', maxWidth: 600, margin: '0 auto' }}>
                
                {/* Status & Total Card */}
                <div style={{
                    background: 'white',
                    borderRadius: 16,
                    padding: '20px',
                    marginBottom: 16,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <span style={{
                            padding: '6px 14px',
                            borderRadius: 8,
                            background: statusInfo.bg,
                            color: statusInfo.color,
                            fontWeight: 700,
                            fontSize: 13,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6
                        }}>
                            {statusInfo.icon}
                            {statusInfo.label}
                        </span>
                        <Text style={{ 
                            fontSize: 26, 
                            fontWeight: 800, 
                            color: dashboardColors.salesColor 
                        }}>
                            ฿{Number(order.total_amount).toLocaleString()}
                        </Text>
                    </div>
                    
                    {/* Info Grid */}
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(2, 1fr)', 
                        gap: 12 
                    }}>
                        {/* Order Type */}
                        <div style={{
                            background: '#F8FAFC',
                            borderRadius: 12,
                            padding: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10
                        }}>
                            <span style={{
                                width: 36,
                                height: 36,
                                borderRadius: 10,
                                background: orderTypeInfo.bg,
                                color: orderTypeInfo.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 16
                            }}>
                                {orderTypeInfo.icon}
                            </span>
                            <div>
                                <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>ประเภท</Text>
                                <Text strong style={{ fontSize: 13 }}>{orderTypeInfo.label}</Text>
                            </div>
                        </div>

                        {/* Table */}
                        <div style={{
                            background: '#F8FAFC',
                            borderRadius: 12,
                            padding: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10
                        }}>
                            <span style={{
                                width: 36,
                                height: 36,
                                borderRadius: 10,
                                background: '#EEF2FF',
                                color: '#6366F1',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 16
                            }}>
                                <TableOutlined />
                            </span>
                            <div>
                                <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>โต๊ะ</Text>
                                <Text strong style={{ fontSize: 13 }}>{tableName}</Text>
                            </div>
                        </div>

                        {/* Employee */}
                        <div style={{
                            background: '#F8FAFC',
                            borderRadius: 12,
                            padding: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10
                        }}>
                            <span style={{
                                width: 36,
                                height: 36,
                                borderRadius: 10,
                                background: '#FEF3C7',
                                color: '#D97706',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 16
                            }}>
                                <UserOutlined />
                            </span>
                            <div>
                                <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>พนักงาน</Text>
                                <Text strong style={{ fontSize: 13 }}>{employeeName}</Text>
                            </div>
                        </div>

                        {/* Discount */}
                        <div style={{
                            background: '#F8FAFC',
                            borderRadius: 12,
                            padding: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10
                        }}>
                            <span style={{
                                width: 36,
                                height: 36,
                                borderRadius: 10,
                                background: discountInfo ? '#FEE2E2' : '#F3F4F6',
                                color: discountInfo ? '#DC2626' : '#9CA3AF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 16
                            }}>
                                <TagOutlined />
                            </span>
                            <div>
                                <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>ส่วนลด</Text>
                                {discountInfo ? (
                                    <Text strong style={{ fontSize: 13, color: '#DC2626' }}>
                                        -฿{Number(order.discount_amount).toLocaleString()}
                                    </Text>
                                ) : (
                                    <Text type="secondary" style={{ fontSize: 13 }}>ไม่มี</Text>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Items Section */}
                <div style={{
                    background: 'white',
                    borderRadius: 16,
                    overflow: 'hidden',
                    marginBottom: 16,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}>
                    <div style={{
                        padding: '16px',
                        borderBottom: '1px solid #F1F5F9',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                    }}>
                        <ShopOutlined style={{ color: dashboardColors.primary, fontSize: 18 }} />
                        <Text strong style={{ fontSize: 15 }}>รายการสินค้า ({items.length})</Text>
                    </div>

                    <div style={{ padding: '8px 0' }}>
                        {items.map((item, index) => {
                            const textStyle = getStatusTextStyle(item.status);
                            const isCancelled = item.status === ItemStatus.Cancelled;

                            return (
                                <div 
                                    key={item.id}
                                    style={{
                                        padding: '12px 16px',
                                        borderBottom: index < items.length - 1 ? '1px solid #F8FAFC' : 'none',
                                        display: 'flex',
                                        gap: 12,
                                        opacity: isCancelled ? 0.5 : 1
                                    }}
                                >
                                    {/* Product Image */}
                                    <div style={{
                                        width: 56,
                                        height: 56,
                                        borderRadius: 10,
                                        overflow: 'hidden',
                                        flexShrink: 0,
                                        background: '#F8FAFC',
                                        border: '1px solid #E5E7EB'
                                    }}>
                                        {item.product?.img_url ? (
                                            <Image 
                                                src={item.product.img_url} 
                                                width={56} 
                                                height={56} 
                                                style={{ objectFit: 'cover' }} 
                                                preview={false} 
                                                alt={item.product?.product_name || 'product'} 
                                            />
                                        ) : (
                                            <div style={{
                                                width: '100%',
                                                height: '100%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                <ShopOutlined style={{ color: '#CBD5E1', fontSize: 20 }} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Product Info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                            <Text strong style={{ fontSize: 14, ...textStyle }}>
                                                {item.product?.display_name || item.product?.product_name || 'สินค้า'}
                                            </Text>
                                            <Text strong style={{ fontSize: 14, color: dashboardColors.salesColor, flexShrink: 0, ...textStyle }}>
                                                ฿{Number(item.total_price).toLocaleString()}
                                            </Text>
                                        </div>
                                        
                                        <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                x{item.quantity} • ฿{Number(item.price).toLocaleString()}/ชิ้น
                                            </Text>
                                            {isCancelled && (
                                                <span style={{
                                                    fontSize: 10,
                                                    padding: '2px 6px',
                                                    borderRadius: 4,
                                                    background: '#FEE2E2',
                                                    color: '#DC2626',
                                                    fontWeight: 600
                                                }}>
                                                    ยกเลิก
                                                </span>
                                            )}
                                        </div>

                                        {/* Toppings */}
                                        {item.details && item.details.length > 0 && (
                                            <div style={{ marginTop: 6 }}>
                                                {item.details.map((detail, dIdx) => (
                                                    <Text key={dIdx} style={{ fontSize: 11, display: 'block', color: '#16A34A', fontWeight: 500 }}>
                                                        + {detail.detail_name} {detail.extra_price > 0 && <span style={{ color: '#16A34A' }}>(+฿{Number(detail.extra_price).toLocaleString()})</span>}
                                                    </Text>
                                                ))}
                                            </div>
                                        )}

                                        {/* Notes */}
                                        {item.notes && (
                                            <div style={{ 
                                                marginTop: 6, 
                                                background: '#FEF3C7', 
                                                padding: '4px 8px', 
                                                borderRadius: 6,
                                                display: 'inline-block'
                                            }}>
                                                <Text style={{ fontSize: 11, color: '#B45309' }}>📝 {item.notes}</Text>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Summary */}
                    <div style={{ 
                        background: '#F8FAFC', 
                        padding: '12px 16px',
                        borderTop: '1px solid #F1F5F9'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <Text type="secondary" style={{ fontSize: 13 }}>รวมรายการ</Text>
                            <Text style={{ fontSize: 13 }}>฿{Number(order.sub_total).toLocaleString()}</Text>
                        </div>
                        {order.discount_amount > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                <Text type="secondary" style={{ fontSize: 13 }}>ส่วนลด</Text>
                                <Text style={{ fontSize: 13, color: '#DC2626' }}>-฿{Number(order.discount_amount).toLocaleString()}</Text>
                            </div>
                        )}
                        {order.vat > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                <Text type="secondary" style={{ fontSize: 13 }}>VAT 7%</Text>
                                <Text style={{ fontSize: 13 }}>฿{Number(order.vat).toLocaleString()}</Text>
                            </div>
                        )}
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            paddingTop: 8,
                            borderTop: '1px dashed #E2E8F0'
                        }}>
                            <Text strong style={{ fontSize: 15 }}>ยอดสุทธิ</Text>
                            <Text strong style={{ fontSize: 18, color: dashboardColors.salesColor }}>
                                ฿{Number(order.total_amount).toLocaleString()}
                            </Text>
                        </div>
                    </div>
                </div>

                {/* Payments Section */}
                <div style={{
                    background: 'white',
                    borderRadius: 16,
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}>
                    <div style={{
                        padding: '16px',
                        borderBottom: '1px solid #F1F5F9',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                    }}>
                        <CreditCardOutlined style={{ color: '#22C55E', fontSize: 18 }} />
                        <Text strong style={{ fontSize: 15 }}>การชำระเงิน ({payments.length})</Text>
                    </div>

                    {payments.length > 0 ? (
                        <div style={{ padding: '8px 0' }}>
                            {payments.map((payment, index) => (
                                <div 
                                    key={payment.id}
                                    style={{
                                        padding: '14px 16px',
                                        borderBottom: index < payments.length - 1 ? '1px solid #F8FAFC' : 'none'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: '50%',
                                                background: payment.status === 'Success' ? '#22C55E' : '#EF4444'
                                            }} />
                                            <Text strong style={{ fontSize: 14 }}>
                                                {payment.payment_method?.display_name || payment.payment_method?.payment_method_name || 'ไม่ระบุ'}
                                            </Text>
                                        </div>
                                        <Text strong style={{ fontSize: 15, color: dashboardColors.salesColor }}>
                                            ฿{Number(payment.amount).toLocaleString()}
                                        </Text>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            <ClockCircleOutlined style={{ marginRight: 4 }} />
                                            {formatThaiDate(payment.payment_date)}
                                        </Text>
                                        {payment.amount_received > 0 && (
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                รับมา ฿{Number(payment.amount_received).toLocaleString()}
                                                {payment.change_amount > 0 && ` • ทอน ฿${Number(payment.change_amount).toLocaleString()}`}
                                            </Text>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ padding: '30px 16px', textAlign: 'center' }}>
                            <CreditCardOutlined style={{ fontSize: 32, color: '#CBD5E1', marginBottom: 8 }} />
                            <Text type="secondary" style={{ display: 'block' }}>ไม่มีข้อมูลการชำระเงิน</Text>
                        </div>
                    )}
                </div>
            </div>

            {/* Print Receipt Modal */}
            <Modal
                open={isPrintModalVisible}
                footer={null}
                closable={false}
                width={380}
                centered
            >
                <div style={{ textAlign: 'center', padding: 20 }}>
                    <Spin size="large" />
                    <div style={{ marginTop: 16 }}>กำลังเตรียมพิมพ์...</div>
                </div>
            </Modal>

            {/* Hidden Receipt Template for Printing */}
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                <ReceiptTemplate 
                    ref={receiptRef}
                    order={order}
                    shopName={shopProfile?.shop_name}
                    shopAddress={shopProfile?.address}
                    shopPhone={shopProfile?.phone}
                    shopTaxId={shopProfile?.tax_id}
                    shopLogo={shopProfile?.logo_url}
                />
            </div>
        </div>
        </PageContainer>
    );
}
