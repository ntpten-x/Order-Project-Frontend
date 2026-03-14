"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert,
    App,
    Button,
    Card,
    Col,
    Divider,
    Empty,
    Grid,
    List,
    Row,
    Space,
    Spin,
    Tag,
    Typography,
} from "antd";
import {
    CheckCircleOutlined,
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
import { useRouter, useSearchParams } from "next/navigation";

import { dashboardService } from "../../../../../services/pos/dashboard.service";
import { shopProfileService, type ShopProfile } from "../../../../../services/pos/shopProfile.service";
import { OrderStatus, OrderType, SalesOrder } from "../../../../../types/api/pos/salesOrder";
import { PaymentMethod } from "../../../../../types/api/pos/paymentMethod";
import { Payments } from "../../../../../types/api/pos/payments";
import { useSocket } from "../../../../../hooks/useSocket";
import {
    matchesRealtimeEntityPayload,
    useRealtimeRefresh,
} from "../../../../../utils/pos/realtime";
import { RealtimeEvents } from "../../../../../utils/realtimeEvents";
import { groupOrderItems } from "../../../../../utils/orderGrouping";
import { isCancelledStatus } from "../../../../../utils/orders";
import { getStatusTextStyle, sortOrderItems } from "../../../../../utils/dashboard/orderUtils";
import UIPageHeader from "../../../../../components/ui/page/PageHeader";
import PageContainer from "../../../../../components/ui/page/PageContainer";
import PageSection from "../../../../../components/ui/page/PageSection";
import PageStack from "../../../../../components/ui/page/PageStack";
import { resolveImageSource } from "../../../../../utils/image/source";
import {
    closePrintWindow,
    primePrintResources,
    printReceiptDocument,
    reservePrintWindow,
} from "../../../../../utils/print-settings/runtime";
import SmartAvatar from "../../../../../components/ui/image/SmartAvatar";
import { AccessGuardFallback } from "../../../../../components/pos/AccessGuard";
import { useAuth } from "../../../../../contexts/AuthContext";
import { useEffectivePermissions } from "../../../../../hooks/useEffectivePermissions";
import { readCache, writeCache } from "../../../../../utils/pos/cache";

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
    return `฿${Number(value || 0).toLocaleString("th-TH", {
        maximumFractionDigits: 0,
    })}`;
}

function formatDateTime(value: string): string {
    return dayjs(value).format("DD MMM YYYY HH:mm");
}

function getOrderTypeMeta(type: OrderType) {
    if (type === OrderType.DineIn) {
        return { label: "ทานที่ร้าน", color: "blue", icon: <TableOutlined /> };
    }
    if (type === OrderType.TakeAway) {
        return { label: "กลับบ้าน", color: "green", icon: <ShoppingOutlined /> };
    }
    if (type === OrderType.Delivery) {
        return { label: "เดลิเวอรี่", color: "magenta", icon: <ShopOutlined /> };
    }
    return { label: String(type), color: "default", icon: <ShopOutlined /> };
}

function getStatusMeta(status: OrderStatus) {
    if (status === OrderStatus.Paid) {
        return { label: "ชำระแล้ว", color: "green", icon: <CheckCircleOutlined /> };
    }
    if (status === OrderStatus.Completed) {
        return { label: "เสร็จสิ้น", color: "green", icon: <CheckCircleOutlined /> };
    }
    if (status === OrderStatus.Cancelled) {
        return { label: "ยกเลิก", color: "red", icon: <CloseCircleOutlined /> };
    }
    if (status === OrderStatus.WaitingForPayment) {
        return { label: "รอชำระ", color: "orange" };
    }
    if (status === OrderStatus.Cooking || status === OrderStatus.Served) {
        return { label: "กำลังดำเนินการ", color: "gold" };
    }
    return { label: String(status), color: "default" };
}

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <Card style={{ borderRadius: 20, background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)" }}>
            <Text type="secondary">{label}</Text>
            <Title level={4} style={{ margin: "8px 0 0", color }}>
                {value}
            </Title>
        </Card>
    );
}

function MetaRow({
    icon,
    label,
    value,
    valueColor,
    compact = false,
}: {
    icon?: React.ReactNode;
    label: string;
    value: string;
    valueColor?: string;
    compact?: boolean;
}) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, paddingLeft: compact ? 22 : 0 }}>
            <Space size={6}>
                {icon}
                <Text type="secondary" style={{ fontSize: compact ? 13 : undefined }}>
                    {label}
                </Text>
            </Space>
            <Text strong style={{ color: valueColor, fontSize: compact ? 13 : undefined }}>
                {value}
            </Text>
        </div>
    );
}

export default function DashboardOrderDetailPage({ params }: Props) {
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;
    const router = useRouter();
    const searchParams = useSearchParams();
    const { message: messageApi } = App.useApp();
    const { socket, isConnected } = useSocket();
    const { user, loading: authLoading } = useAuth();
    const { can, loading: permissionLoading } = useEffectivePermissions({
        enabled: Boolean(user?.id),
    });
    const canViewDashboard = can("reports.sales.page", "view");
    const orderId = params.id[0];
    const backPath = searchParams.get("from") === "dashboard" ? "/pos/dashboard" : "/pos/channels";
    const branchId = user?.branch_id || user?.branch?.id || "default";
    const orderCacheKey = `pos:dashboard:order:${branchId}:${orderId}`;
    const shopProfileCacheKey = `pos:dashboard:shop-profile:${branchId}`;

    const [order, setOrder] = useState<SalesOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const [shopProfile, setShopProfile] = useState<ShopProfileExtended | null>(null);

    const fetchOrderDetail = useCallback(
        async (silent = false) => {
            if (!orderId) return;
            if (!silent) setLoading(true);

            try {
                const data = await dashboardService.getOrderDetail(orderId);
                setOrder(data);
                writeCache(orderCacheKey, data);
            } catch (error) {
                console.error("Fetch dashboard order detail error", error);
                if (!silent) {
                    messageApi.error("ไม่พบข้อมูลออเดอร์สำหรับรายงาน");
                    setOrder(null);
                }
            } finally {
                setLoading(false);
            }
        },
        [messageApi, orderCacheKey, orderId],
    );

    const fetchShopProfile = useCallback(async () => {
        try {
            const cached = readCache<ShopProfileExtended>(shopProfileCacheKey, 5 * 60_000);
            if (cached) setShopProfile(cached);
            const data = await shopProfileService.getProfile();
            setShopProfile(data);
            writeCache(shopProfileCacheKey, data);
        } catch (error) {
            console.warn("Could not fetch shop profile", error);
        }
    }, [shopProfileCacheKey]);

    useEffect(() => {
        if (!canViewDashboard) return;

        const cached = readCache<SalesOrder>(orderCacheKey, 60_000);
        if (cached) {
            setOrder(cached);
            setLoading(false);
            void fetchOrderDetail(true);
            return;
        }

        void fetchOrderDetail(false);
    }, [canViewDashboard, fetchOrderDetail, orderCacheKey]);

    useEffect(() => {
        if (canViewDashboard) {
            void fetchShopProfile();
        }
    }, [canViewDashboard, fetchShopProfile]);

    useEffect(() => {
        primePrintResources();
    }, []);

    useRealtimeRefresh({
        socket,
        enabled: canViewDashboard,
        events: [
            RealtimeEvents.orders.update,
            RealtimeEvents.orders.delete,
            RealtimeEvents.payments.create,
            RealtimeEvents.payments.update,
            RealtimeEvents.payments.delete,
        ],
        shouldRefresh: (payload) =>
            matchesRealtimeEntityPayload(
                payload as Parameters<typeof matchesRealtimeEntityPayload>[0],
                orderId,
            ),
        debounceMs: 700,
        intervalMs: isConnected ? undefined : 20000,
        onRefresh: () => {
            void fetchOrderDetail(true);
        },
    });

    useRealtimeRefresh({
        socket,
        enabled: canViewDashboard,
        events: [RealtimeEvents.shopProfile.update],
        debounceMs: 700,
        onRefresh: () => {
            void fetchShopProfile();
        },
    });

    const items = useMemo(() => sortOrderItems(groupOrderItems(order?.items || [])), [order?.items]);
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
        if (!order) return;

        const reservedPrintWindow = reservePrintWindow(`Receipt #${order.order_no || ""}`.trim());
        void printReceiptDocument({
            order,
            shopProfile: {
                ...(shopProfile as any),
                branch_name: user?.branch?.branch_name,
                branch_phone: user?.branch?.phone,
            },
            targetWindow: reservedPrintWindow,
        }).catch((error) => {
            closePrintWindow(reservedPrintWindow);
            console.error("Receipt print failed", error);
            messageApi.error("เปิดหน้าพิมพ์ใบเสร็จไม่สำเร็จ");
        });
    };

    if (authLoading || permissionLoading) {
        return (
            <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8FAFC" }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!user || !canViewDashboard) {
        return (
            <AccessGuardFallback
                message="คุณไม่มีสิทธิ์เข้าถึงรายละเอียดออเดอร์จากรายงาน"
                tone="danger"
            />
        );
    }

    if (loading) {
        return (
            <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8FAFC" }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!order) {
        return (
            <PageContainer>
                <PageSection>
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ไม่พบข้อมูลออเดอร์">
                        <Button type="primary" onClick={() => router.push(backPath)}>
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
                title={
                    <div style={{ fontSize: isMobile ? "15px" : "inherit", fontWeight: 600, whiteSpace: "nowrap", maxWidth: isMobile ? "calc(100vw - 120px)" : "100%" }}>
                        ออเดอร์ #{order.order_no}
                    </div>
                }
                subtitle={`อัปเดตล่าสุด ${formatDateTime(order.update_date || order.create_date)}`}
                onBack={() => router.push(backPath)}
                actions={
                    <Space wrap>
                        <Tag color={statusMeta?.color} style={{ margin: 0 }} icon={statusMeta?.icon}>
                            {statusMeta?.label}
                        </Tag>
                        <Button icon={<PrinterOutlined />} onClick={handlePrint}>
                            {!isMobile ? "พิมพ์ใบเสร็จ" : ""}
                        </Button>
                    </Space>
                }
            />

            <PageContainer maxWidth={1260}>
                <PageStack gap={14}>
                    <PageSection>
                        <Row gutter={[12, 12]}>
                            <Col xs={24} md={8}>
                                <MetricCard label="ยอดสุทธิ" value={formatCurrency(netTotal)} color="#0f766e" />
                            </Col>
                            <Col xs={24} md={8}>
                                <MetricCard label="จำนวนรายการ" value={String(items.length)} color="#1d4ed8" />
                            </Col>
                            <Col xs={24} md={8}>
                                <MetricCard label="จำนวนการชำระเงิน" value={String(payments.length)} color="#7c3aed" />
                            </Col>
                        </Row>
                    </PageSection>

                    <Row gutter={[14, 14]}>
                        <Col xs={24} lg={16}>
                            <PageSection title={`รายการสินค้า (${items.length})`}>
                                <List
                                    dataSource={items}
                                    locale={{ emptyText: "ไม่มีรายการสินค้า" }}
                                    renderItem={(item) => {
                                        const cancelled = isCancelledStatus(item.status);
                                        const textStyle = getStatusTextStyle(item.status);
                                        return (
                                            <List.Item style={{ opacity: cancelled ? 0.64 : 1 }}>
                                                <div style={{ width: "100%", display: "flex", gap: 12 }}>
                                                    <SmartAvatar
                                                        shape="square"
                                                        size={58}
                                                        src={resolveImageSource(item.product?.img_url)}
                                                        alt={item.product?.display_name || "product"}
                                                        icon={<ShopOutlined />}
                                                        imageStyle={{ objectFit: "cover" }}
                                                    />
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                                                            <Text strong style={textStyle} ellipsis={{ tooltip: true }}>
                                                                {item.product?.display_name || "สินค้า"}
                                                            </Text>
                                                            <Text strong style={{ color: "#0f766e", ...textStyle }}>
                                                                {formatCurrency(Number(item.total_price || 0))}
                                                            </Text>
                                                        </div>
                                                        <Space size={8} wrap>
                                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                                x{Number(item.quantity || 0).toLocaleString("th-TH")} • {formatCurrency(Number(item.price || 0))}/ชิ้น
                                                            </Text>
                                                            {cancelled ? <Tag color="red">ยกเลิก</Tag> : null}
                                                        </Space>
                                                        {item.details?.length ? (
                                                            <div style={{ marginTop: 6 }}>
                                                                {item.details.map((detail) => (
                                                                    <Text key={`${item.id}-${detail.id || detail.detail_name}`} style={{ display: "block", fontSize: 12, color: "#065f46" }}>
                                                                        + {detail.detail_name} {Number(detail.extra_price || 0) > 0 ? `(${formatCurrency(Number(detail.extra_price || 0))})` : ""}
                                                                    </Text>
                                                                ))}
                                                            </div>
                                                        ) : null}
                                                        {item.notes ? <Alert type="warning" showIcon message={item.notes} style={{ marginTop: 8, padding: "4px 8px" }} /> : null}
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
                                    <Card size="small" style={{ borderRadius: 20, background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)" }}>
                                        <div style={{ display: "grid", gap: 12 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <Text type="secondary">ยอดสุทธิ</Text>
                                                <Title level={4} style={{ margin: 0, color: "#0f766e" }}>{formatCurrency(netTotal)}</Title>
                                            </div>
                                            <Space wrap>
                                                <Tag color={orderTypeMeta?.color} icon={orderTypeMeta?.icon}>{orderTypeMeta?.label}</Tag>
                                                <Tag icon={<ClockCircleOutlined />}>{formatDateTime(order.create_date)}</Tag>
                                            </Space>
                                            <Divider style={{ margin: "4px 0" }} />
                                            <Space direction="vertical" size={8} style={{ width: "100%" }}>
                                                <MetaRow icon={<UserOutlined />} label="พนักงาน" value={employeeName} />
                                                <MetaRow icon={<TableOutlined />} label="โต๊ะ" value={tableName} />
                                                <MetaRow icon={<TagOutlined />} label="ส่วนลด" value={discountAmount > 0 ? `-${formatCurrency(discountAmount)}` : "-"} valueColor={discountAmount > 0 ? "#b91c1c" : undefined} />
                                            </Space>
                                        </div>
                                    </Card>
                                </PageSection>

                                <PageSection title={`การชำระเงิน (${payments.length})`}>
                                    <Card size="small" style={{ borderRadius: 20 }}>
                                        {payments.length === 0 ? (
                                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ไม่มีข้อมูลการชำระเงิน" />
                                        ) : (
                                            <List
                                                dataSource={payments}
                                                renderItem={(payment) => {
                                                    const received = Number(payment.amount_received) > 0 ? Number(payment.amount_received) : Number(payment.amount || 0);
                                                    const change = Number(payment.change_amount || 0);
                                                    return (
                                                        <List.Item>
                                                            <div style={{ width: "100%", display: "grid", gap: 4 }}>
                                                                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                                                                    <Space size={6}>
                                                                        <CreditCardOutlined />
                                                                        <Text strong>{payment.payment_method?.display_name || payment.payment_method?.payment_method_name || "ไม่ระบุ"}</Text>
                                                                    </Space>
                                                                    <Text strong style={{ color: "#0f766e" }}>{formatCurrency(Number(payment.amount || 0))}</Text>
                                                                </div>
                                                                <MetaRow label="รับเงินมา" value={formatCurrency(received)} compact />
                                                                <MetaRow label="เงินทอน" value={change > 0 ? formatCurrency(change) : "พอดี"} compact valueColor={change > 0 ? undefined : "#0f766e"} />
                                                                <Text type="secondary" style={{ fontSize: 12, marginTop: 4 }}>{formatDateTime(payment.payment_date)}</Text>
                                                            </div>
                                                        </List.Item>
                                                    );
                                                }}
                                            />
                                        )}
                                    </Card>
                                </PageSection>

                                <PageSection title="สรุปราคา">
                                    <Card size="small" style={{ borderRadius: 20 }}>
                                        <div style={{ display: "grid", gap: 8 }}>
                                            <MetaRow label="รวมรายการ" value={formatCurrency(subTotal)} />
                                            {discountAmount > 0 ? <MetaRow label="ส่วนลด" value={`-${formatCurrency(discountAmount)}`} valueColor="#b91c1c" /> : null}
                                            {vatAmount > 0 ? <MetaRow label="VAT" value={formatCurrency(vatAmount)} /> : null}
                                            <Divider style={{ margin: "4px 0" }} />
                                            <MetaRow label="ยอดสุทธิ" value={formatCurrency(netTotal)} valueColor="#0f766e" />
                                        </div>
                                    </Card>
                                </PageSection>
                            </PageStack>
                        </Col>
                    </Row>
                </PageStack>
            </PageContainer>
        </>
    );
}
