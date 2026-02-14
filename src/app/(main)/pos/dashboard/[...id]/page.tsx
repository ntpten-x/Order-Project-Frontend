"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Alert,
    App,
    Avatar,
    Button,
    Card,
    Col,
    Divider,
    Empty,    List,
    Modal,
    Row,
    Space,
    Spin,
    Tag,
    Typography,
} from "antd";
import {    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    CreditCardOutlined,
    PrinterOutlined,
    ShoppingOutlined,
    ShopOutlined,
    TableOutlined,
    TagOutlined,
    UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/th";
import { useRouter } from "next/navigation";
import { ordersService } from "../../../../../services/pos/orders.service";
import { shopProfileService, ShopProfile } from "../../../../../services/pos/shopProfile.service";
import { OrderStatus, OrderType, SalesOrder } from "../../../../../types/api/pos/salesOrder";
import { PaymentMethod } from "../../../../../types/api/pos/paymentMethod";
import { Payments } from "../../../../../types/api/pos/payments";
import { useSocket } from "../../../../../hooks/useSocket";
import { useRealtimeRefresh } from "../../../../../utils/pos/realtime";
import { RealtimeEvents } from "../../../../../utils/realtimeEvents";
import { groupOrderItems } from "../../../../../utils/orderGrouping";
import { isCancelledStatus } from "../../../../../utils/orders";
import { getStatusTextStyle, sortOrderItems } from "../../../../../utils/dashboard/orderUtils";
import ReceiptTemplate from "../../../../../components/pos/shared/ReceiptTemplate";
import UIPageHeader from "../../../../../components/ui/page/PageHeader";
import PageContainer from "../../../../../components/ui/page/PageContainer";
import PageSection from "../../../../../components/ui/page/PageSection";
import PageStack from "../../../../../components/ui/page/PageStack";
import { resolveImageSource } from "../../../../../utils/image/source";

const { Title, Text } = Typography;

dayjs.locale("th");

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

function formatCurrency(value: number): string {
    return `฿${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function formatDateTime(value: string): string {
    return dayjs(value).format("DD MMM YYYY HH:mm");
}

function getOrderTypeMeta(type: OrderType): { label: string; color: string; icon: React.ReactNode } {
    if (type === OrderType.DineIn) return { label: "ทานที่ร้าน", color: "blue", icon: <TableOutlined /> };
    if (type === OrderType.TakeAway) return { label: "กลับบ้าน", color: "green", icon: <ShoppingOutlined /> };
    if (type === OrderType.Delivery) return { label: "เดลิเวอรี่", color: "magenta", icon: <ShopOutlined /> };
    return { label: String(type), color: "default", icon: <ShopOutlined /> };
}

function getStatusMeta(status: OrderStatus): { label: string; color: string; icon?: React.ReactNode } {
    if (status === OrderStatus.Paid) return { label: "ชำระแล้ว", color: "green", icon: <CheckCircleOutlined /> };
    if (status === OrderStatus.Completed) return { label: "เสร็จสิ้น", color: "green", icon: <CheckCircleOutlined /> };
    if (status === OrderStatus.Cancelled) return { label: "ยกเลิก", color: "red", icon: <CloseCircleOutlined /> };
    if (status === OrderStatus.WaitingForPayment) return { label: "รอชำระ", color: "orange" };
    if (status === OrderStatus.Cooking) return { label: "กำลังทำ", color: "blue" };
    if (status === OrderStatus.Served) return { label: "เสิร์ฟแล้ว", color: "cyan" };
    return { label: String(status), color: "default" };
}

export default function DashboardOrderDetailPage({ params }: Props) {
    const router = useRouter();
    const { message: messageApi } = App.useApp();
    const { socket } = useSocket();
    const orderId = params.id[0];

    const [order, setOrder] = useState<SalesOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const [shopProfile, setShopProfile] = useState<ShopProfileExtended | null>(null);
    const [printModalOpen, setPrintModalOpen] = useState(false);

    const receiptRef = useRef<HTMLDivElement>(null);

    const fetchOrderDetail = useCallback(async () => {
        if (!orderId) return;
        setLoading(true);
        try {
            const data = await ordersService.getById(orderId);
            setOrder(data);
        } catch (error) {
            console.error("Fetch order detail error", error);
            messageApi.error("ไม่พบข้อมูลออเดอร์");
            setOrder(null);
        } finally {
            setLoading(false);
        }
    }, [orderId, messageApi]);

    const fetchShopProfile = useCallback(async () => {
        try {
            const data = await shopProfileService.getProfile();
            setShopProfile(data);
        } catch (error) {
            console.warn("Could not fetch shop profile", error);
        }
    }, []);

    useEffect(() => {
        void fetchOrderDetail();
    }, [fetchOrderDetail]);

    useEffect(() => {
        void fetchShopProfile();
    }, [fetchShopProfile]);

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

    useRealtimeRefresh({
        socket,
        events: [RealtimeEvents.shopProfile.update],
        onRefresh: () => fetchShopProfile(),
        debounceMs: 800,
    });

    const items = useMemo(() => {
        const grouped = groupOrderItems(order?.items || []);
        return sortOrderItems(grouped);
    }, [order?.items]);

    const payments = useMemo(() => (order?.payments || []) as PaymentWithMethod[], [order?.payments]);

    const subTotal = Number(order?.sub_total || 0);
    const discountAmount = Number(order?.discount_amount || 0);
    const vatAmount = Number(order?.vat || 0);
    const netTotal = Number(order?.total_amount || 0);

    const employeeName = order?.created_by?.name || order?.created_by?.username || "-";
    const tableName = order?.table?.table_name || "-";

    const orderTypeMeta = order ? getOrderTypeMeta(order.order_type) : null;
    const statusMeta = order ? getStatusMeta(order.status) : null;

    const handlePrint = () => {
        setPrintModalOpen(true);
        setTimeout(() => {
            if (receiptRef.current) {
                const printContents = receiptRef.current.outerHTML;
                const printWindow = window.open("", "", "width=400,height=700");
                if (printWindow) {
                    printWindow.document.write(`
                        <html>
                            <head>
                                <title>พิมพ์ใบเสร็จ #${order?.order_no || ""}</title>
                                <style>
                                    @page { size: 80mm auto; margin: 4mm; }
                                    body {
                                        font-family: "Noto Sans Thai", Tahoma, sans-serif;
                                        margin: 0;
                                        background: #fff;
                                        display: flex;
                                        justify-content: center;
                                    }
                                </style>
                            </head>
                            <body>
                                ${printContents}
                            </body>
                        </html>
                    `);
                    printWindow.document.close();
                    printWindow.focus();
                    printWindow.print();
                    printWindow.close();
                }
            }
            setPrintModalOpen(false);
        }, 450);
    };

    if (loading) {
        return (
            <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!order) {
        return (
            <PageContainer>
                <PageSection>
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="ไม่พบข้อมูลออเดอร์"
                    >
                        <Button type="primary" onClick={() => router.back()}>
                            ย้อนกลับ
                        </Button>
                    </Empty>
                </PageSection>
            </PageContainer>
        );
    }

    return (
        <>
            <UIPageHeader
                title={`ออเดอร์ #${order.order_no}`}
                subtitle={formatDateTime(order.create_date)}
                onBack={() => router.back()}
                actions={
                    <Space>
                        <Tag color={statusMeta?.color} style={{ margin: 0 }} icon={statusMeta?.icon}>
                            {statusMeta?.label}
                        </Tag>
                        <Button icon={<PrinterOutlined />} onClick={handlePrint}>
                            พิมพ์ใบเสร็จ
                        </Button>
                    </Space>
                }
            />

            <PageContainer maxWidth={1200}>
                <PageStack gap={12}>
                    <Row gutter={[12, 12]}>
                        <Col xs={24} lg={16}>
                            <PageSection title={`รายการสินค้า (${items.length})`}>
                                <List
                                    dataSource={items}
                                    locale={{ emptyText: "ไม่มีรายการสินค้า" }}
                                    renderItem={(item) => {
                                        const cancelled = isCancelledStatus(item.status);
                                        const textStyle = getStatusTextStyle(item.status);
                                        return (
                                            <List.Item style={{ opacity: cancelled ? 0.6 : 1 }}>
                                                <div style={{ width: "100%", display: "flex", gap: 12 }}>
                                                    <Avatar
                                                        shape="square"
                                                        size={56}
                                                        src={resolveImageSource(item.product?.img_url) || undefined}
                                                        icon={<ShopOutlined />}
                                                    />
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                                                            <Text strong style={textStyle} ellipsis={{ tooltip: true }}>
                                                                {item.product?.display_name || item.product?.product_name || "สินค้า"}
                                                            </Text>
                                                            <Text strong style={{ color: "#0f766e", ...textStyle }}>{formatCurrency(Number(item.total_price || 0))}</Text>
                                                        </div>
                                                        <Space size={8} wrap>
                                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                                x{Number(item.quantity || 0).toLocaleString()} • {formatCurrency(Number(item.price || 0))}/ชิ้น
                                                            </Text>
                                                            {cancelled ? <Tag color="red">ยกเลิก</Tag> : null}
                                                        </Space>
                                                        {item.details && item.details.length > 0 ? (
                                                            <div style={{ marginTop: 6 }}>
                                                                {item.details.map((detail) => (
                                                                    <Text key={`${item.id}-${detail.id || detail.detail_name}`} style={{ display: "block", fontSize: 12, color: "#065f46" }}>
                                                                        + {detail.detail_name} {Number(detail.extra_price || 0) > 0 ? `(${formatCurrency(Number(detail.extra_price || 0))})` : ""}
                                                                    </Text>
                                                                ))}
                                                            </div>
                                                        ) : null}
                                                        {item.notes ? (
                                                            <Alert
                                                                type="warning"
                                                                showIcon
                                                                message={item.notes}
                                                                style={{ marginTop: 8, padding: "4px 8px" }}
                                                            />
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </List.Item>
                                        );
                                    }}
                                />
                            </PageSection>
                        </Col>

                        <Col xs={24} lg={8}>
                            <PageStack gap={12}>
                                <PageSection title="ข้อมูลออเดอร์">
                                    <Card size="small">
                                        <div style={{ display: "grid", gap: 10 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <Text type="secondary">ยอดสุทธิ</Text>
                                                <Title level={4} style={{ margin: 0, color: "#0f766e" }}>{formatCurrency(netTotal)}</Title>
                                            </div>
                                            <Space wrap>
                                                <Tag color={orderTypeMeta?.color} icon={orderTypeMeta?.icon}>{orderTypeMeta?.label}</Tag>
                                                <Tag icon={<ClockCircleOutlined />}>{formatDateTime(order.create_date)}</Tag>
                                            </Space>
                                            <Divider style={{ margin: "4px 0" }} />
                                            <Space direction="vertical" size={6} style={{ width: "100%" }}>
                                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                    <Space size={6}><UserOutlined /><Text type="secondary">พนักงาน</Text></Space>
                                                    <Text strong>{employeeName}</Text>
                                                </div>
                                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                    <Space size={6}><TableOutlined /><Text type="secondary">โต๊ะ</Text></Space>
                                                    <Text strong>{tableName}</Text>
                                                </div>
                                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                    <Space size={6}><TagOutlined /><Text type="secondary">ส่วนลด</Text></Space>
                                                    <Text strong style={{ color: discountAmount > 0 ? "#b91c1c" : undefined }}>
                                                        {discountAmount > 0 ? `-${formatCurrency(discountAmount)}` : "-"}
                                                    </Text>
                                                </div>
                                            </Space>
                                        </div>
                                    </Card>
                                </PageSection>

                                <PageSection title={`การชำระเงิน (${payments.length})`}>
                                    <Card size="small">
                                        {payments.length === 0 ? (
                                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ไม่มีข้อมูลการชำระเงิน" />
                                        ) : (
                                            <List
                                                dataSource={payments}
                                                renderItem={(payment) => (
                                                    <List.Item>
                                                        <div style={{ width: "100%", display: "grid", gap: 4 }}>
                                                            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                                                                <Space size={6}>
                                                                    <CreditCardOutlined />
                                                                    <Text strong>
                                                                        {payment.payment_method?.display_name || payment.payment_method?.payment_method_name || "ไม่ระบุ"}
                                                                    </Text>
                                                                </Space>
                                                                <Text strong style={{ color: "#0f766e" }}>{formatCurrency(Number(payment.amount || 0))}</Text>
                                                            </div>
                                                            <Text type="secondary" style={{ fontSize: 12 }}>{formatDateTime(payment.payment_date)}</Text>
                                                        </div>
                                                    </List.Item>
                                                )}
                                            />
                                        )}
                                    </Card>
                                </PageSection>

                                <PageSection title="สรุปราคา">
                                    <Card size="small">
                                        <div style={{ display: "grid", gap: 8 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                <Text type="secondary">รวมรายการ</Text>
                                                <Text>{formatCurrency(subTotal)}</Text>
                                            </div>
                                            {discountAmount > 0 ? (
                                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                    <Text type="secondary">ส่วนลด</Text>
                                                    <Text style={{ color: "#b91c1c" }}>-{formatCurrency(discountAmount)}</Text>
                                                </div>
                                            ) : null}
                                            {vatAmount > 0 ? (
                                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                    <Text type="secondary">VAT</Text>
                                                    <Text>{formatCurrency(vatAmount)}</Text>
                                                </div>
                                            ) : null}
                                            <Divider style={{ margin: "4px 0" }} />
                                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                <Text strong>ยอดสุทธิ</Text>
                                                <Text strong style={{ color: "#0f766e" }}>{formatCurrency(netTotal)}</Text>
                                            </div>
                                        </div>
                                    </Card>
                                </PageSection>
                            </PageStack>
                        </Col>
                    </Row>
                </PageStack>
            </PageContainer>

            <Modal open={printModalOpen} footer={null} closable={false} centered width={360}>
                <div style={{ textAlign: "center", padding: 16 }}>
                    <Spin size="large" />
                    <div style={{ marginTop: 12 }}>กำลังเตรียมพิมพ์...</div>
                </div>
            </Modal>

            <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
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
        </>
    );
}

