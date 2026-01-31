"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Typography, Card, Table, Tag, Button, Spin, Row, Col, message, Image, Avatar, Timeline, Statistic, Modal } from "antd";
import { ArrowLeftOutlined, UserOutlined, ShopOutlined, ClockCircleOutlined, DollarCircleOutlined, TableOutlined, CarOutlined, ShoppingOutlined, PrinterOutlined, TagOutlined, CheckCircleOutlined, CloseCircleOutlined, CreditCardOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { ordersService } from "../../../../../services/pos/orders.service";
import { shopProfileService, ShopProfile } from "../../../../../services/pos/shopProfile.service";
import { SalesOrder, OrderStatus, OrderType } from "../../../../../types/api/pos/salesOrder";
import { SalesOrderItem } from "../../../../../types/api/pos/salesOrderItem";
import { Payments } from "../../../../../types/api/pos/payments";
import { PaymentMethod } from "../../../../../types/api/pos/paymentMethod";
import { posPageStyles, posColors } from "../../../../../theme/pos";
import dayjs from "dayjs";
import 'dayjs/locale/th';
import ReceiptTemplate from "../../../../../components/pos/shared/ReceiptTemplate";
import { sortOrderItems, getItemRowStyle, getStatusTextStyle } from "../../../../../utils/dashboard/orderUtils";
import { ItemStatus } from "../../../../../types/api/pos/salesOrderItem";
import { useSocket } from "../../../../../hooks/useSocket";
import { useRealtimeRefresh } from "../../../../../utils/pos/realtime";

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
        events: ["orders:update", "orders:delete", "payments:create", "payments:update"],
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

    if (isLoading) {
        return (
            <div style={{ ...posPageStyles.container, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!order) {
        return (
             <div style={posPageStyles.container}>
                <div style={{ padding: 24, textAlign: 'center' }}>
                    <Title level={4}>ไม่พบข้อมูลออเดอร์</Title>
                    <Button onClick={() => router.back()}>ย้อนกลับ</Button>
                </div>
            </div>
        );
    }

    const items = sortOrderItems(order.items || []);
    const payments = (order.payments || []) as PaymentWithMethod[];
    const shouldVirtualizeItems = items.length > 12;
    
    // Derived Data
    const employeeName = order.created_by?.display_name || order.created_by?.username || 'ไม่ทราบ';
    const tableName = order.table?.table_name || '-';
    const discountInfo = order.discount;

    // Order Type Helper
    const getOrderTypeInfo = (type: OrderType) => {
        switch (type) {
            case OrderType.DineIn: return { icon: <TableOutlined />, label: 'ทานที่ร้าน', color: '#1890ff' };
            case OrderType.TakeAway: return { icon: <ShoppingOutlined />, label: 'สั่งกลับบ้าน', color: '#52c41a' };
            case OrderType.Delivery: return { icon: <CarOutlined />, label: 'เดลิเวอรี่', color: '#fa8c16' };
            default: return { icon: <ShopOutlined />, label: type, color: '#666' };
        }
    };

    // Status Helper
    const getStatusInfo = (status: OrderStatus) => {
        switch (status) {
            case OrderStatus.Paid: return { color: 'green', label: 'ชำระเงินแล้ว', icon: <CheckCircleOutlined /> };
            case OrderStatus.Cancelled: return { color: 'red', label: 'ยกเลิก', icon: <CloseCircleOutlined /> };
            default: return { color: 'default', label: status, icon: null };
        }
    };

    const orderTypeInfo = getOrderTypeInfo(order.order_type);
    const statusInfo = getStatusInfo(order.status);

    const itemColumns = [
        {
            title: 'รูป',
            dataIndex: 'product',
            key: 'image',
            width: 80,
            render: (product?: SalesOrderItem["product"]) => (
                <div style={{ width: 60, height: 60, borderRadius: 8, overflow: 'hidden', border: '1px solid #f0f0f0' }}>
                     {product?.img_url ? (
                        <Image src={product.img_url} width="100%" height="100%" style={{ objectFit: 'cover' }} preview={false} alt="product" />
                     ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
                            <ShopOutlined style={{ fontSize: 24, color: '#ccc' }} />
                        </div>
                     )}
                </div>
            )
        },
        {
            title: 'สินค้า',
            dataIndex: 'product',
            key: 'name',
            render: (product: SalesOrderItem["product"], record: SalesOrderItem) => (
                <div>
                    <Text strong style={{ fontSize: 16 }}>{product?.display_name || product?.product_name || 'สินค้า'}</Text>
                    
                    {/* Toppings Display */}
                    {record.details && record.details.length > 0 && (
                        <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {record.details.map((detail, dIdx) => (
                                <Text key={dIdx} type="secondary" style={{ fontSize: 13, display: 'block', color: '#8c8c8c' }}>
                                    + {detail.detail_name} {detail.extra_price > 0 && `(฿${Number(detail.extra_price).toLocaleString()})`}
                                </Text>
                            ))}
                        </div>
                    )}

                    {record.status === ItemStatus.Cancelled && (
                        <div style={{ marginTop: 6 }}>
                            <Tag color="red" style={{ margin: 0 }}>ยกเลิกแล้ว</Tag>
                        </div>
                    )}
                    {record.notes && (
                        <div style={{ marginTop: 6, background: '#fff7e6', padding: '2px 8px', borderRadius: 4, border: '1px dashed #fa8c16', display: 'inline-block' }}>
                            <Text type="warning" style={{ fontSize: 12 }}>หมายเหตุ: {record.notes}</Text>
                        </div>
                    )}
                </div>
            )
        },
        { title: 'จำนวน', dataIndex: 'quantity', key: 'quantity', align: 'center' as const, width: 80 },
        { 
            title: 'ราคา/หน่วย', 
            dataIndex: 'price', 
            key: 'price', 
            align: 'right' as const, 
            width: 120, 
            render: (price: number, record: SalesOrderItem) => (
                <Text style={getStatusTextStyle(record.status)}>฿{Number(price).toLocaleString()}</Text>
            )
        },
        { 
            title: 'รวม', 
            dataIndex: 'total_price', 
            key: 'total', 
            align: 'right' as const, 
            width: 120, 
            render: (total: number, record: SalesOrderItem) => (
                <Text strong style={getStatusTextStyle(record.status)}>฿{Number(total).toLocaleString()}</Text>
            )
        },
    ];


    return (
        <div style={posPageStyles.container}>
            {/* Hero Header */}
            <div style={{ ...posPageStyles.heroParams, paddingBottom: 60 }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <Button 
                                type="text" 
                                icon={<ArrowLeftOutlined style={{ fontSize: 20, color: '#fff' }} />} 
                                onClick={() => router.back()}
                                style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)' }}
                            />
                            <div>
                                <Title level={3} style={{ margin: 0, color: '#fff' }}>
                                    ออเดอร์ #{order.order_no}
                                </Title>
                                <Text style={{ color: 'rgba(255,255,255,0.85)' }}>
                                    {dayjs(order.create_date).format('DD MMMM YYYY, HH:mm น.')}
                                </Text>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Tag 
                                icon={statusInfo.icon} 
                                color={statusInfo.color} 
                                style={{ fontSize: 14, padding: '4px 12px' }}
                            >
                                {statusInfo.label}
                            </Tag>
                            <Button 
                                type="primary"
                                icon={<PrinterOutlined />}
                                onClick={handlePrint}
                                style={{ background: '#52c41a', borderColor: '#52c41a' }}
                            >
                                พิมพ์ใบเสร็จ
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div style={{ maxWidth: 1200, margin: '-40px auto 30px', padding: '0 24px', position: 'relative', zIndex: 20 }}>
                {/* Summary Cards */}
                <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
                    <Col xs={24} sm={12} md={8} style={{ flex: 1 }}>
                        <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', height: '100%' }}>
                            <Statistic 
                                title="โต๊ะ" 
                                value={tableName}
                                prefix={<TableOutlined style={{ color: '#1890ff' }} />} 
                                valueStyle={{ fontWeight: 'bold', fontSize: 24 }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={8} style={{ flex: 1 }}>
                        <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', height: '100%' }}>
                            <Statistic 
                                title="ประเภท" 
                                valueRender={() => (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                        {orderTypeInfo.icon}
                                        <span style={{ color: orderTypeInfo.color, fontWeight: 'bold' }}>{orderTypeInfo.label}</span>
                                    </div>
                                )}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={8} style={{ flex: 1 }}>
                        <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', height: '100%' }}>
                            <Statistic 
                                title="ผู้สร้างออเดอร์"
                                valueRender={() => (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                        <Avatar size="small" icon={<UserOutlined />} style={{ background: posColors.primary }} />
                                        <span style={{ fontWeight: 500, fontSize: 18 }}>{employeeName}</span>
                                    </div>
                                )}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={8} style={{ flex: 1 }}>
                        <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', height: '100%' }}>
                            <Statistic 
                                title="ส่วนลด"
                                valueRender={() => (
                                    discountInfo ? (
                                        <div style={{ marginTop: 4 }}>
                                            <Tag icon={<TagOutlined />} color="volcano" style={{ fontSize: 14, padding: '2px 8px' }}>
                                                {discountInfo.display_name || discountInfo.discount_name}
                                            </Tag>
                                            <div style={{ marginTop: 4 }}>
                                                <Text type="danger" strong style={{ fontSize: 18 }}>-฿{Number(order.discount_amount).toLocaleString()}</Text>
                                            </div>
                                        </div>
                                    ) : (
                                        <Text type="secondary" style={{ fontSize: 18 }}>ไม่มีส่วนลด</Text>
                                    )
                                )}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={8} style={{ flex: 1 }}>
                        <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', height: '100%' }}>
                            <Statistic 
                                title="ยอดสุทธิ" 
                                value={order.total_amount} 
                                precision={2}
                                prefix={<DollarCircleOutlined style={{ color: posColors.primary }} />} 
                                suffix="฿"
                                valueStyle={{ color: posColors.primary, fontWeight: 'bold', fontSize: 24 }}
                            />
                        </Card>
                    </Col>
                </Row>

                {/* Items & Payments */}
                <Row gutter={[24, 24]}>
                    <Col xs={24} lg={16}>
                        <Card 
                            title={<><ShopOutlined style={{ marginRight: 8, color: posColors.primary }} />รายการสินค้า ({items.length} รายการ)</>} 
                            bordered={false} 
                            style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                        >
                            <Table 
                                dataSource={items} 
                                columns={itemColumns} 
                                rowKey="id"
                                virtual={shouldVirtualizeItems}
                                scroll={shouldVirtualizeItems ? { y: 420 } : undefined}
                                pagination={false}
                                onRow={(record) => ({
                                    style: getItemRowStyle(record.status)
                                })}
                                summary={() => (
                                    <Table.Summary fixed>
                                        <Table.Summary.Row>
                                            <Table.Summary.Cell index={0} colSpan={3}></Table.Summary.Cell>
                                            <Table.Summary.Cell index={1} align="right"><Text type="secondary">รวมรายการ</Text></Table.Summary.Cell>
                                            <Table.Summary.Cell index={2} align="right"><Text strong>฿{Number(order.sub_total).toLocaleString()}</Text></Table.Summary.Cell>
                                        </Table.Summary.Row>
                                        {order.discount_amount > 0 && (
                                            <Table.Summary.Row>
                                                <Table.Summary.Cell index={0} colSpan={3}></Table.Summary.Cell>
                                                <Table.Summary.Cell index={1} align="right"><Text type="secondary">ส่วนลด</Text></Table.Summary.Cell>
                                                <Table.Summary.Cell index={2} align="right"><Text type="danger">-฿{Number(order.discount_amount).toLocaleString()}</Text></Table.Summary.Cell>
                                            </Table.Summary.Row>
                                        )}
                                        {order.vat > 0 && (
                                            <Table.Summary.Row>
                                                <Table.Summary.Cell index={0} colSpan={3}></Table.Summary.Cell>
                                                <Table.Summary.Cell index={1} align="right"><Text type="secondary">VAT 7%</Text></Table.Summary.Cell>
                                                <Table.Summary.Cell index={2} align="right"><Text>฿{Number(order.vat).toLocaleString()}</Text></Table.Summary.Cell>
                                            </Table.Summary.Row>
                                        )}
                                        <Table.Summary.Row style={{ background: '#fafafa' }}>
                                            <Table.Summary.Cell index={0} colSpan={3}></Table.Summary.Cell>
                                            <Table.Summary.Cell index={1} align="right"><Text strong style={{ fontSize: 16 }}>ยอดสุทธิ</Text></Table.Summary.Cell>
                                            <Table.Summary.Cell index={2} align="right"><Text strong style={{ fontSize: 18, color: posColors.primary }}>฿{Number(order.total_amount).toLocaleString()}</Text></Table.Summary.Cell>
                                        </Table.Summary.Row>
                                    </Table.Summary>
                                )}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} lg={8}>
                        <Card 
                            title={<><CreditCardOutlined style={{ marginRight: 8, color: '#52c41a' }} />การชำระเงิน ({payments.length} รายการ)</>}
                            bordered={false} 
                            style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', height: '100%' }}
                        >
                            {payments.length > 0 ? (
                                <Timeline
                                    items={payments.map((payment) => ({
                                        color: payment.status === 'Success' ? 'green' : 'red',
                                        children: (
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Text strong>{payment.payment_method?.display_name || payment.payment_method?.payment_method_name || 'ไม่ระบุ'}</Text>
                                                    <Text strong style={{ color: posColors.primary }}>฿{Number(payment.amount).toLocaleString()}</Text>
                                                </div>
                                                <div>
                                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                                        <ClockCircleOutlined style={{ marginRight: 4 }} />
                                                        {dayjs(payment.payment_date).format('DD/MM/YYYY HH:mm')}
                                                    </Text>
                                                </div>
                                                {payment.amount_received > 0 && (
                                                    <div style={{ fontSize: 12, marginTop: 4 }}>
                                                        <Text type="secondary">รับมา ฿{Number(payment.amount_received).toLocaleString()}</Text>
                                                        {payment.change_amount > 0 && <Text type="secondary"> | ทอน ฿{Number(payment.change_amount).toLocaleString()}</Text>}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    }))}
                                />
                            ) : (
                                <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
                                    ไม่มีข้อมูลการชำระเงิน
                                </div>
                            )}
                        </Card>
                    </Col>
                </Row>
            </div>

            {/* Print Receipt Modal (Hidden, for printing) */}
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
    );
}
