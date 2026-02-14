"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    App,
    Avatar,
    Button,
    Card,
    Col,
    DatePicker,
    Dropdown,
    Empty,
    Grid,
    List,
    Progress,
    Row,
    Segmented,
    Space,
    Spin,
    Table,
    Tag,
    Typography,
} from "antd";
import type { MenuProps } from "antd";
import {
    CalendarOutlined,
    CarOutlined,
    DownloadOutlined,
    EyeOutlined,
    FileExcelOutlined,
    FilePdfOutlined,
    HomeOutlined,
    ReloadOutlined,
    RiseOutlined,
    ShopOutlined,
    ShoppingOutlined,} from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/th";
import { useRouter } from "next/navigation";
import { exportSalesReportExcel, exportSalesReportPDF, type SalesReportBranding } from "../../../../utils/export.utils";
import { dashboardService } from "../../../../services/pos/dashboard.service";
import { shopProfileService, type ShopProfile } from "../../../../services/pos/shopProfile.service";
import { DashboardOverview, RecentOrderSummary, TopItem } from "../../../../types/api/pos/dashboard";
import { useGlobalLoading } from "../../../../contexts/pos/GlobalLoadingContext";
import { useSocket } from "../../../../hooks/useSocket";
import { useRealtimeRefresh } from "../../../../utils/pos/realtime";
import { RealtimeEvents } from "../../../../utils/realtimeEvents";
import { useAuth } from "../../../../contexts/AuthContext";
import { useEffectivePermissions } from "../../../../hooks/useEffectivePermissions";
import UIPageHeader from "../../../../components/ui/page/PageHeader";
import PageContainer from "../../../../components/ui/page/PageContainer";
import PageSection from "../../../../components/ui/page/PageSection";
import PageStack from "../../../../components/ui/page/PageStack";
import { AccessGuardFallback } from "../../../../components/pos/AccessGuard";
import { t } from "../../../../utils/i18n";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

dayjs.locale("th");

type PresetKey = "today" | "7d" | "15d" | "30d" | "custom";
type ExportPresetKey = "today" | "7d" | "15d" | "30d";
type ExportFormat = "pdf" | "xlsx";

const PRESET_OPTIONS: Array<{ label: string; value: PresetKey }> = [
    { label: "วันนี้", value: "today" },
    { label: "7 วันล่าสุด", value: "7d" },
    { label: "15 วันล่าสุด", value: "15d" },
    { label: "30 วันล่าสุด", value: "30d" },
    { label: "กำหนดเอง", value: "custom" },
];

const EXPORT_PRESET_OPTIONS: Array<{ label: string; value: ExportPresetKey }> = [
    { label: "วันนี้", value: "today" },
    { label: "7 วันล่าสุด", value: "7d" },
    { label: "15 วันล่าสุด", value: "15d" },
    { label: "30 วันล่าสุด", value: "30d" },
];

const STATUS_META: Record<string, { label: string; color: string }> = {
    Paid: { label: "ชำระแล้ว", color: "green" },
    Completed: { label: "เสร็จสิ้น", color: "green" },
    Cancelled: { label: "ยกเลิก", color: "red" },
    Pending: { label: "รอดำเนินการ", color: "gold" },
    Cooking: { label: "กำลังทำ", color: "blue" },
    Served: { label: "เสิร์ฟแล้ว", color: "cyan" },
    WaitingForPayment: { label: "รอชำระ", color: "orange" },
};

function resolvePresetRange(preset: PresetKey): [dayjs.Dayjs, dayjs.Dayjs] {
    const today = dayjs();
    if (preset === "today") return [today.startOf("day"), today.endOf("day")];
    if (preset === "7d") return [today.subtract(6, "day").startOf("day"), today.endOf("day")];
    if (preset === "15d") return [today.subtract(14, "day").startOf("day"), today.endOf("day")];
    if (preset === "30d") return [today.subtract(29, "day").startOf("day"), today.endOf("day")];
    return [today.startOf("day"), today.endOf("day")];
}

function getExportPresetLabel(preset: ExportPresetKey): string {
    const found = EXPORT_PRESET_OPTIONS.find((option) => option.value === preset);
    return found?.label || preset;
}

type ShopProfileExtended = ShopProfile & {
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
};

function formatCurrency(value: number): string {
    return `฿${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function formatThaiDate(date: string): string {
    return dayjs(date).format("DD MMM YYYY");
}

function formatThaiDateTime(date: string): string {
    return dayjs(date).format("DD MMM YYYY HH:mm");
}

function getOrderTypeTag(type: string) {
    if (type === "DineIn") return <Tag color="blue">{t("dashboard.channel.dineIn")}</Tag>;
    if (type === "TakeAway") return <Tag color="green">{t("dashboard.channel.takeAway")}</Tag>;
    if (type === "Delivery") return <Tag color="magenta">{t("dashboard.channel.delivery")}</Tag>;
    return <Tag>{type || "-"}</Tag>;
}

function TopItemsList({ items, compact }: { items: TopItem[]; compact: boolean }) {
    if (!items.length) {
        return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("dashboard.topProducts.empty")} />;
    }

    return (
        <List
            dataSource={items}
            split={false}
            renderItem={(item, index) => {
                const maxQty = Math.max(items[0]?.total_quantity || 0, 1);
                const percent = Math.min((Number(item.total_quantity || 0) / maxQty) * 100, 100);
                return (
                    <List.Item style={{ padding: compact ? "10px 0" : "12px 0" }}>
                        <div style={{ display: "flex", width: "100%", gap: 10, alignItems: "center" }}>
                            <Tag color={index === 0 ? "gold" : "default"} style={{ margin: 0, minWidth: 28, textAlign: "center" }}>
                                {index + 1}
                            </Tag>
                            <Avatar shape="square" src={item.img_url} icon={<ShoppingOutlined />} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <Text strong ellipsis={{ tooltip: item.product_name }} style={{ display: "block" }}>
                                    {item.product_name}
                                </Text>
                                <Progress percent={Number(percent.toFixed(0))} size="small" showInfo={false} />
                            </div>
                            <div style={{ textAlign: "right" }}>
                                <Text strong>{Number(item.total_quantity || 0).toLocaleString()}</Text>
                                <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                                    {formatCurrency(Number(item.total_revenue || 0))}
                                </Text>
                            </div>
                        </div>
                    </List.Item>
                );
            }}
        />
    );
}

function RecentOrdersList({ orders }: { orders: RecentOrderSummary[] }) {
    const router = useRouter();

    if (!orders.length) {
        return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("dashboard.recentOrders.empty")} />;
    }

    return (
        <List
            dataSource={orders}
            renderItem={(order) => {
                const status = STATUS_META[order.status] || { label: order.status, color: "default" };
                return (
                    <List.Item
                        style={{ cursor: "pointer" }}
                        onClick={() => router.push(`/pos/dashboard/${order.id}`)}
                    >
                        <div style={{ width: "100%", display: "grid", gap: 6 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                                <Space size={6} wrap>
                                    <Text strong>#{order.order_no}</Text>
                                    {getOrderTypeTag(order.order_type)}
                                    <Tag color={status.color}>{status.label}</Tag>
                                </Space>
                                <Text strong style={{ color: "#0f766e" }}>{formatCurrency(order.total_amount)}</Text>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    {formatThaiDateTime(order.create_date)}
                                </Text>
                                <Space size={8}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>x{order.items_count}</Text>
                                    <Button type="link" size="small" icon={<EyeOutlined />} style={{ paddingInline: 0 }}>
                                        {t("dashboard.viewDetails")}
                                    </Button>
                                </Space>
                            </div>
                        </div>
                    </List.Item>
                );
            }}
        />
    );
}

export default function DashboardPage() {    const screens = useBreakpoint();
    const isMobile = !screens.md;
    const { showLoading, hideLoading } = useGlobalLoading();
    const { socket } = useSocket();
    const { message: messageApi } = App.useApp();
    const { user, loading: authLoading } = useAuth();
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });
    const canViewDashboard = can("reports.sales.page", "view");

    const [preset, setPreset] = useState<PresetKey>("7d");
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>(resolvePresetRange("7d"));
    const [overview, setOverview] = useState<DashboardOverview | null>(null);
    const [shopProfile, setShopProfile] = useState<ShopProfileExtended | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const startDate = dateRange[0].format("YYYY-MM-DD");
    const endDate = dateRange[1].format("YYYY-MM-DD");

    useEffect(() => {
        if (preset === "custom") return;
        setDateRange(resolvePresetRange(preset));
    }, [preset]);

    const fetchOverview = useCallback(
        async (silent = false) => {
            if (silent) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            try {
                const data = await dashboardService.getOverview(startDate, endDate, 7, 8);
                setOverview(data);
            } catch (error) {
                console.error("Failed to fetch dashboard overview", error);
                if (!silent) {
                    messageApi.error("ไม่สามารถโหลดข้อมูลสรุปการขายได้");
                }
            } finally {
                if (silent) {
                    setRefreshing(false);
                } else {
                    setLoading(false);
                }
            }
        },
        [startDate, endDate, messageApi]
    );

    useEffect(() => {
        if (!canViewDashboard) return;
        void fetchOverview(false);
    }, [canViewDashboard, fetchOverview]);

    const fetchShopProfile = useCallback(async () => {
        try {
            const data = await shopProfileService.getProfile();
            setShopProfile(data as ShopProfileExtended);
        } catch (error) {
            console.warn("Failed to fetch shop profile for export branding", error);
        }
    }, []);

    useEffect(() => {
        void fetchShopProfile();
    }, [fetchShopProfile]);

    useRealtimeRefresh({
        socket,
        events: [
            RealtimeEvents.orders.create,
            RealtimeEvents.orders.update,
            RealtimeEvents.orders.delete,
            RealtimeEvents.payments.create,
            RealtimeEvents.payments.update,
        ],
        onRefresh: () => fetchOverview(true),
        intervalMs: 20000,
        debounceMs: 900,
    });

    const handleExport = useCallback(
        async (format: ExportFormat, exportPreset: ExportPresetKey) => {
            try {
                showLoading("กำลังเตรียมไฟล์สรุปผลการขาย...");
                const [rangeStart, rangeEnd] = resolvePresetRange(exportPreset);
                const exportStart = rangeStart.format("YYYY-MM-DD");
                const exportEnd = rangeEnd.format("YYYY-MM-DD");
                const exportLabel = getExportPresetLabel(exportPreset);

                const shouldReuseCurrentOverview = exportStart === startDate && exportEnd === endDate && Boolean(overview);
                const exportOverview = shouldReuseCurrentOverview
                    ? overview
                    : await dashboardService.getOverview(exportStart, exportEnd, 10, 20);

                if (!exportOverview) {
                    throw new Error("ไม่พบข้อมูลสรุปสำหรับการส่งออก");
                }

                const payload = {
                    summary: exportOverview.summary,
                    daily_sales: exportOverview.daily_sales,
                    top_items: exportOverview.top_items,
                    recent_orders: exportOverview.recent_orders,
                };
                const branding: SalesReportBranding = {
                    shopName: shopProfile?.shop_name || "ร้านค้า POS",
                    branchName: user?.branch?.branch_name,
                    logoUrl: shopProfile?.logo_url,
                    primaryColor: shopProfile?.primary_color || "#0f766e",
                    secondaryColor: shopProfile?.secondary_color || "#1d4ed8",
                };

                if (format === "pdf") {
                    await exportSalesReportPDF(payload, [exportStart, exportEnd], exportLabel, branding);
                } else {
                    exportSalesReportExcel(payload, [exportStart, exportEnd], exportLabel, branding);
                }

                messageApi.success(`ส่งออก${format.toUpperCase()} สำเร็จ (${exportLabel})`);
            } catch (error) {
                console.error("Export sales summary failed", error);
                messageApi.error("ส่งออกไฟล์สรุปผลการขายไม่สำเร็จ");
            } finally {
                hideLoading();
            }
        },
        [showLoading, hideLoading, startDate, endDate, overview, messageApi, shopProfile, user?.branch?.branch_name]
    );

    const exportMenuItems = useMemo<MenuProps["items"]>(
        () => [
            {
                key: "pdf",
                icon: <FilePdfOutlined />,
                label: "ดาวน์โหลด PDF",
                children: EXPORT_PRESET_OPTIONS.map((option) => ({
                    key: `pdf-${option.value}`,
                    label: option.label,
                    onClick: () => {
                        void handleExport("pdf", option.value);
                    },
                })),
            },
            {
                key: "xlsx",
                icon: <FileExcelOutlined />,
                label: "ดาวน์โหลด Excel (XLSX)",
                children: EXPORT_PRESET_OPTIONS.map((option) => ({
                    key: `xlsx-${option.value}`,
                    label: option.label,
                    onClick: () => {
                        void handleExport("xlsx", option.value);
                    },
                })),
            },
        ],
        [handleExport]
    );

    const summary = overview?.summary;
    const dailyRows = useMemo(() => overview?.daily_sales ?? [], [overview]);
    const topItems = overview?.top_items || [];
    const recentOrders = overview?.recent_orders || [];

    const totalChannelSales = useMemo(() => {
        if (!summary) return 0;
        return Number(summary.dine_in_sales || 0) + Number(summary.takeaway_sales || 0) + Number(summary.delivery_sales || 0);
    }, [summary]);

    const channelCards = useMemo(() => {
        if (!summary) return [];
        return [
            {
                key: "dinein",
                label: t("dashboard.channel.dineIn"),
                icon: <ShopOutlined style={{ color: "#2563EB" }} />,
                value: Number(summary.dine_in_sales || 0),
                color: "#2563EB",
            },
            {
                key: "takeaway",
                label: t("dashboard.channel.takeAway"),
                icon: <HomeOutlined style={{ color: "#059669" }} />,
                value: Number(summary.takeaway_sales || 0),
                color: "#059669",
            },
            {
                key: "delivery",
                label: t("dashboard.channel.delivery"),
                icon: <CarOutlined style={{ color: "#DB2777" }} />,
                value: Number(summary.delivery_sales || 0),
                color: "#DB2777",
            },
        ];
    }, [summary]);

    const dailyTableData = useMemo(
        () =>
            dailyRows.map((row) => ({
                key: row.date,
                date: row.date,
                orders: Number(row.total_orders || 0),
                sales: Number(row.total_sales || 0),
                avg: Number(row.total_orders || 0) > 0 ? Number(row.total_sales || 0) / Number(row.total_orders || 1) : 0,
            })),
        [dailyRows]
    );

    if (authLoading || permissionLoading) {
        return (
            <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!user || !canViewDashboard) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้าสรุปการขาย" tone="danger" />;
    }

    return (
        <div style={{ minHeight: "100vh", background: "#F8FAFC", paddingBottom: 100 }}>
            <UIPageHeader
                title={t("dashboard.title")}
                subtitle={t("dashboard.subtitle")}
                icon={<RiseOutlined />}
                actions={
                    <Space size={8} wrap>
                        <Button icon={<ReloadOutlined />} loading={refreshing} onClick={() => void fetchOverview(true)}>
                            {!isMobile ? t("dashboard.reload") : ""}
                        </Button>
                        <Dropdown
                            menu={{
                                items: exportMenuItems,
                            }}
                            trigger={["click"]}
                            disabled={!overview || loading}
                        >
                            <Button type="primary" icon={<DownloadOutlined />}>
                                {!isMobile ? "ดาวน์โหลดสรุปผลการขาย" : ""}
                            </Button>
                        </Dropdown>
                    </Space>
                }
            />

            <PageContainer maxWidth={1400}>
                <PageStack gap={12}>
                    <PageSection title="ช่วงเวลา">
                        <Row gutter={[12, 12]} align="middle">
                            <Col xs={24} lg={10}>
                                <Segmented options={PRESET_OPTIONS} value={preset} onChange={(value) => setPreset(value as PresetKey)} block />
                            </Col>
                            <Col xs={24} lg={14}>
                                <RangePicker
                                    value={dateRange}
                                    onChange={(dates) => {
                                        if (!dates?.[0] || !dates?.[1]) return;
                                        setPreset("custom");
                                        setDateRange([dates[0], dates[1]]);
                                    }}
                                    allowClear={false}
                                    style={{ width: "100%" }}
                                    suffixIcon={<CalendarOutlined />}
                                />
                            </Col>
                            <Col xs={24}>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    ปุ่มดาวน์โหลดสามารถเลือกสรุปได้ตามช่วง: วันนี้, 7 วันล่าสุด, 15 วันล่าสุด, 30 วันล่าสุด
                                </Text>
                            </Col>
                        </Row>
                    </PageSection>

                    {loading ? (
                        <PageSection>
                            <div style={{ display: "flex", justifyContent: "center", padding: "56px 0" }}>
                                <Spin size="large" tip={t("dashboard.loading")} />
                            </div>
                        </PageSection>
                    ) : !overview ? (
                        <PageSection>
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("page.error")} />
                        </PageSection>
                    ) : (
                        <>
                            <Row gutter={[12, 12]}>
                                <Col xs={24} sm={12} lg={6}>
                                    <Card>
                                        <Text type="secondary">{t("dashboard.totalSales")}</Text>
                                        <Title level={4} style={{ margin: "6px 0 0", color: "#0f766e" }}>{formatCurrency(Number(summary?.total_sales || 0))}</Title>
                                    </Card>
                                </Col>
                                <Col xs={24} sm={12} lg={6}>
                                    <Card>
                                        <Text type="secondary">จำนวนออเดอร์</Text>
                                        <Title level={4} style={{ margin: "6px 0 0" }}>{Number(summary?.total_orders || 0).toLocaleString()}</Title>
                                    </Card>
                                </Col>
                                <Col xs={24} sm={12} lg={6}>
                                    <Card>
                                        <Text type="secondary">ยอดเฉลี่ยต่อบิล</Text>
                                        <Title level={4} style={{ margin: "6px 0 0" }}>{formatCurrency(Number(summary?.average_order_value || 0))}</Title>
                                    </Card>
                                </Col>
                                <Col xs={24} sm={12} lg={6}>
                                    <Card>
                                        <Text type="secondary">{t("dashboard.discount", { amount: "" }).replace(" ฿", "")}</Text>
                                        <Title level={4} style={{ margin: "6px 0 0", color: "#b91c1c" }}>{formatCurrency(Number(summary?.total_discount || 0))}</Title>
                                    </Card>
                                </Col>
                            </Row>

                            <Row gutter={[12, 12]}>
                                <Col xs={24} lg={12}>
                                    <PageSection title="ยอดขายตามช่องทาง">
                                        <div style={{ display: "grid", gap: 10 }}>
                                            {channelCards.map((channel) => {
                                                const percent = totalChannelSales > 0 ? (channel.value / totalChannelSales) * 100 : 0;
                                                return (
                                                    <Card key={channel.key} size="small">
                                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                                                            <Space>
                                                                {channel.icon}
                                                                <Text strong>{channel.label}</Text>
                                                            </Space>
                                                            <Text strong>{formatCurrency(channel.value)}</Text>
                                                        </div>
                                                        <Progress
                                                            percent={Number(percent.toFixed(1))}
                                                            strokeColor={channel.color}
                                                            size="small"
                                                            style={{ marginTop: 8 }}
                                                        />
                                                    </Card>
                                                );
                                            })}
                                            <Card size="small">
                                                <Row gutter={8}>
                                                    <Col span={12}>
                                                        <Text type="secondary">เงินสด</Text>
                                                        <Title level={5} style={{ margin: "4px 0 0" }}>{formatCurrency(Number(summary?.cash_sales || 0))}</Title>
                                                    </Col>
                                                    <Col span={12}>
                                                        <Text type="secondary">QR/PromptPay</Text>
                                                        <Title level={5} style={{ margin: "4px 0 0" }}>{formatCurrency(Number(summary?.qr_sales || 0))}</Title>
                                                    </Col>
                                                </Row>
                                            </Card>
                                        </div>
                                    </PageSection>
                                </Col>

                                <Col xs={24} lg={12}>
                                    <PageSection title={t("dashboard.topProducts")}>
                                        <TopItemsList items={topItems} compact={isMobile} />
                                    </PageSection>
                                </Col>
                            </Row>

                            <Row gutter={[12, 12]}>
                                <Col xs={24} lg={12}>
                                    <PageSection title={t("dashboard.recentOrders")}>
                                        <RecentOrdersList orders={recentOrders} />
                                    </PageSection>
                                </Col>
                                <Col xs={24} lg={12}>
                                    <PageSection title={t("dashboard.dailySales")}>
                                        <Table
                                            size="small"
                                            pagination={false}
                                            scroll={{ x: 460 }}
                                            dataSource={dailyTableData}
                                            columns={[
                                                {
                                                    title: t("dashboard.dailySales.date"),
                                                    dataIndex: "date",
                                                    key: "date",
                                                    render: (value: string) => formatThaiDate(value),
                                                },
                                                {
                                                    title: t("dashboard.dailySales.orders"),
                                                    dataIndex: "orders",
                                                    key: "orders",
                                                    align: "center",
                                                    render: (value: number) => value.toLocaleString(),
                                                },
                                                {
                                                    title: t("dashboard.dailySales.sales"),
                                                    dataIndex: "sales",
                                                    key: "sales",
                                                    align: "right",
                                                    render: (value: number) => formatCurrency(value),
                                                },
                                                {
                                                    title: "เฉลี่ย/บิล",
                                                    dataIndex: "avg",
                                                    key: "avg",
                                                    align: "right",
                                                    render: (value: number) => formatCurrency(value),
                                                },
                                            ]}
                                        />
                                    </PageSection>
                                </Col>
                            </Row>
                        </>
                    )}
                </PageStack>
            </PageContainer>
        </div>
    );
}

