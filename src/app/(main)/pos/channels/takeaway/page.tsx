"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ClockCircleOutlined,
    CopyOutlined,
    DownloadOutlined,
    LinkOutlined,
    PlusOutlined,
    QrcodeOutlined,
    ReloadOutlined,
    ShoppingOutlined,
    SyncOutlined,
} from "@ant-design/icons";
import { App, Button, Grid, Modal, Radio, Skeleton, Space, Tag, theme, Typography } from "antd";
import { useRouter } from "next/navigation";

import { AccessGuardFallback } from "../../../../../components/pos/AccessGuard";
import RequireOpenShift from "../../../../../components/pos/shared/RequireOpenShift";
import PageContainer from "../../../../../components/ui/page/PageContainer";
import PageSection from "../../../../../components/ui/page/PageSection";
import PageStack from "../../../../../components/ui/page/PageStack";
import UIEmptyState from "../../../../../components/ui/states/EmptyState";
import PageState from "../../../../../components/ui/states/PageState";
import ListPagination from "../../../../../components/ui/pagination/ListPagination";
import { useAuth } from "../../../../../contexts/AuthContext";
import { useChannelStats } from "../../../../../utils/channels/channelStats.utils";
import { OrderStatus, OrderType, SalesOrderSummary } from "../../../../../types/api/pos/salesOrder";
import { useChannelOrders } from "../../../../../utils/pos/channelOrders";
import { useListState } from "../../../../../hooks/pos/useListState";
import { useEffectivePermissions } from "../../../../../hooks/useEffectivePermissions";
import { getOrderNavigationPath } from "../../../../../utils/orders";
import UIPageHeader from "../../../../../components/ui/page/PageHeader";
import { SearchBar } from "../../../../../components/ui/page/SearchBar";
import { SearchInput } from "../../../../../components/ui/input/SearchInput";
import { ModalSelector } from "../../../../../components/ui/select/ModalSelector";
import type { CreatedSort } from "../../../../../components/ui/pagination/ListPagination";
import { DynamicQRCode, DynamicQRCodeCanvas } from "../../../../../lib/dynamic-imports";
import { takeawayQrService, type TakeawayQrInfo } from "../../../../../services/pos/takeawayQr.service";
import { getBackendErrorMessage, unwrapBackendData } from "../../../../../utils/api/backendResponse";
import { getCsrfTokenCached } from "../../../../../utils/pos/csrf";
import { buildTableQrExportCanvas, downloadCanvasAsPng } from "../../../../../utils/print-settings/tableQrExport";
import { closePrintWindow, getPrintSettings, reservePrintWindow } from "../../../../../utils/print-settings/runtime";
import { createTableQrPrintDocument } from "../../../../../utils/print-settings/tableQrPrintExport";
import { getTakeawayCustomerLabel } from "../../../../../utils/orders";

const { Text } = Typography;
const EXPORT_QR_CANVAS_SIZE = 2048;
const TAKEAWAY_EXPORT_CANVAS_ID = "takeaway-qr-export-canvas";
const TAKEAWAY_QR_UI = {
    label: "QR Code สั่งกลับ",
    exportLabel: "Export",
    copyLinkLabel: "Copy Link",
    openPageLabel: "ไปที่หน้า",
    missingLinkWarning: "ยังไม่มีลิงก์ลูกค้า",
    loadError: "ไม่สามารถโหลด Takeaway QR ได้",
    exportError: "ส่งออก Takeaway QR ไม่สำเร็จ",
    openPdfSuccess: "เปิดหน้า Takeaway QR PDF แล้ว",
    refreshLabel: "รีเฟรช QR",
};

type ExportFormat = "a4" | "receipt" | "png";

/* ── Theme helpers ── */

const STATUS_THEMES = {
    active: {
        bg: "#FFFBEB",
        border: "#FDE68A",
        badgeBg: "#FDE68A",
        badgeText: "#92400E",
        dotColor: "#F59E0B",
        label: "กำลังดำเนินการ",
    },
    waitingPayment: {
        bg: "#EFF6FF",
        border: "#BFDBFE",
        badgeBg: "#DBEAFE",
        badgeText: "#1D4ED8",
        dotColor: "#3B82F6",
        label: "รอชำระเงิน",
    },
    done: {
        bg: "#ECFDF5",
        border: "#A7F3D0",
        badgeBg: "#D1FAE5",
        badgeText: "#047857",
        dotColor: "#10B981",
        label: "เสร็จสิ้น",
    },
};

const TAKEAWAY_OPEN_STATUSES = [
    OrderStatus.Pending,
    OrderStatus.Cooking,
    OrderStatus.Served,
    OrderStatus.WaitingForPayment,
] as const;

const TAKEAWAY_ACTIVE_STATUSES = [
    OrderStatus.Pending,
    OrderStatus.Cooking,
    OrderStatus.Served,
] as const;

const TAKEAWAY_VISIBLE_STATUS_SET = new Set<OrderStatus>(TAKEAWAY_OPEN_STATUSES);

type TakeawayListStatusFilter = "active" | "waiting_payment" | "all";

function getOrderTheme(status: OrderStatus) {
    if (status === OrderStatus.WaitingForPayment) return STATUS_THEMES.waitingPayment;
    if (status === OrderStatus.Paid || status === OrderStatus.Completed) return STATUS_THEMES.done;
    return STATUS_THEMES.active;
}

function getRelativeAge(raw?: string | null): { label: string; color: string } {
    if (!raw) return { label: "ไม่ทราบเวลา", color: "#94A3B8" };
    const created = new Date(raw);
    if (Number.isNaN(created.getTime())) return { label: "ไม่ทราบเวลา", color: "#94A3B8" };
    
    const diffMs = Math.max(0, Date.now() - created.getTime());
    const diffMinutes = Math.floor(diffMs / 60_000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return { label: "เมื่อสักครู่", color: "#16A34A" };
    
    let label = "";
    let color = "#16A34A"; // Green for < 10 mins

    if (diffDays > 0) {
        label = `${diffDays} วันที่แล้ว`;
        color = "#DC2626"; // Red for > 1 day
    } else if (diffHours > 0) {
        label = `${diffHours} ชั่วโมงที่แล้ว`;
        color = "#DC2626"; // Red for > 1 hour
    } else {
        label = `${diffMinutes} นาทีที่แล้ว`;
        if (diffMinutes >= 30) color = "#DC2626";
        else if (diffMinutes >= 10) color = "#D97706";
    }

    return { label, color };
}

function formatMoney(amount: number): string {
    return `฿${Number(amount || 0).toLocaleString()}`;
}

function buildCustomerUrl(customerPath?: string | null): string {
    if (!customerPath) return "";
    const envBaseUrl = process.env.NEXT_PUBLIC_CUSTOMER_ORDER_BASE_URL?.trim();
    const fallbackBaseUrl = typeof window !== "undefined" ? window.location.origin : "";

    for (const baseUrl of [envBaseUrl, fallbackBaseUrl].filter(Boolean) as string[]) {
        try {
            return new URL(customerPath, baseUrl).toString();
        } catch {}
    }

    return "";
}

function toSafeFilename(value: string): string {
    return value.replace(/[^\w\u0E00-\u0E7F-]+/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "").slice(0, 60) || "takeaway";
}

const STYLES = `
.takeaway-order-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(15, 23, 42, 0.08);
}
.takeaway-order-card:active {
    transform: translateY(-1px);
}
@media (max-width: 767px) {
    .takeaway-order-card:active {
        transform: scale(0.98);
    }
}
.takeaway-order-card {
    -webkit-user-select: none;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
}
@keyframes takeawayCardFadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
.takeaway-card-animate {
    animation: takeawayCardFadeIn 0.35s ease-out forwards;
    opacity: 0;
}
`;

/* ── Order Card ── */

function OrderCard({
    order,
    onClick,
    isMobile,
}: {
    order: SalesOrderSummary;
    onClick: () => void;
    isMobile: boolean;
}) {
    const statusTheme = getOrderTheme(order.status);
    const age = getRelativeAge(order.create_date);
    const customerLabel = getTakeawayCustomerLabel(order);

    return (
        <div
            onClick={onClick}
            className="takeaway-order-card"
            style={{
                background: "#ffffff",
                borderRadius: 18,
                border: `1.5px solid ${statusTheme.border}`,
                padding: isMobile ? "16px 14px" : "18px 20px",
                cursor: "pointer",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                display: "flex",
                flexDirection: "column",
                gap: 14,
                position: "relative",
                width: "100%",
                minWidth: 0,
                overflow: "hidden"
            }}
        >
            {/* Top: Icon + order info + status badge */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
                    <div
                        style={{
                            width: 38, height: 38, borderRadius: 12,
                            background: statusTheme.bg, border: `1px solid ${statusTheme.border}`,
                            display: "grid", placeItems: "center", flexShrink: 0,
                        }}
                    >
                        <ShoppingOutlined style={{ fontSize: 16, color: statusTheme.badgeText }} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {(!customerLabel || customerLabel === order.order_no)
                                ? (order.order_no ? `#${order.order_no.split("-")[1]?.slice(0, 3)}` : "")
                                : customerLabel}
                        </div>
                    </div>
                </div>
                <div style={{ padding: "4px 10px", borderRadius: 999, background: statusTheme.badgeBg, fontSize: 12, fontWeight: 700, color: statusTheme.badgeText, whiteSpace: "nowrap", lineHeight: 1.3, flexShrink: 0 }}>
                    {statusTheme.label}
                </div>
            </div>

            {/* Middle: items count + total */}
            <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, color: "#94A3B8", marginBottom: 2 }}>รายการสินค้า</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#1E293B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {order.items_count || 0} รายการ
                    </div>
                </div>
                <div style={{ flex: 1, textAlign: "right", minWidth: 0 }}>
                    <div style={{ fontSize: 14, color: "#94A3B8", marginBottom: 2 }}>ยอดรวม</div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: statusTheme.badgeText, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {formatMoney(Number(order.total_amount || 0))}
                    </div>
                </div>
            </div>

            {/* Bottom: time elapsed */}
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <ClockCircleOutlined style={{ fontSize: 12, color: age.color }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: age.color }}>{age.label}</span>
            </div>
        </div>
    );
}

/* ── Auth guard ── */

export default function TakeawayPage() {
    const { user, loading: authLoading } = useAuth();
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });
    const canCreateOrder = can("orders.page", "create");

    if (authLoading || permissionLoading) {
        return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์การใช้งาน..." />;
    }
    if (!can("orders.page", "view")) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้" tone="danger" />;
    }

    return (
        <RequireOpenShift>
            <TakeawayContent canCreateOrder={canCreateOrder} />
        </RequireOpenShift>
    );
}

/* ── Main content ── */

function TakeawayContent({ canCreateOrder }: { canCreateOrder: boolean }) {
    const router = useRouter();
    const { message } = App.useApp();
    const { stats } = useChannelStats();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;
    const { token } = theme.useToken();
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [isQrLoading, setIsQrLoading] = useState(false);
    const [isQrRefreshing, setIsQrRefreshing] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportFormat, setExportFormat] = useState<ExportFormat>("a4");
    const [isExportingQr, setIsExportingQr] = useState(false);
    const [takeawayQr, setTakeawayQr] = useState<TakeawayQrInfo | null>(null);
    const [csrfToken, setCsrfToken] = useState("");

    const {
        page, setPage, pageSize, setPageSize, total, setTotal,
        searchText, setSearchText, debouncedSearch,
        createdSort, setCreatedSort, filters, updateFilter, isUrlReady,
    } = useListState({
        defaultPageSize: 10,
        defaultFilters: { status: "all" as TakeawayListStatusFilter },
    });

    const statusFilter = useMemo(() => {
        if (filters.status === "active") return TAKEAWAY_ACTIVE_STATUSES.join(",");
        if (filters.status === "waiting_payment") return OrderStatus.WaitingForPayment;
        return TAKEAWAY_OPEN_STATUSES.join(",");
    }, [filters.status]);

    const { orders, total: apiTotal, isLoading, isFetching, error, refresh } = useChannelOrders({
        orderType: OrderType.TakeAway,
        page, limit: pageSize, statusFilter,
        query: debouncedSearch, createdSort, enabled: isUrlReady,
    });

    useEffect(() => { setTotal(apiTotal); }, [apiTotal, setTotal]);
    useEffect(() => {
        getCsrfTokenCached()
            .then((token) => setCsrfToken(token))
            .catch(() => setCsrfToken(""));
    }, []);

    const visibleOrders = useMemo(
        () => orders.filter((order) => TAKEAWAY_VISIBLE_STATUS_SET.has(order.status)),
        [orders]
    );

    const handleManualRefresh = useCallback(() => {
        void refresh(false);
    }, [refresh]);

    const handleOpenCreate = () => router.push("/pos/channels/takeaway/buying");
    const customerUrl = buildCustomerUrl(takeawayQr?.customer_path);
    const takeawayLabel = useMemo(() => takeawayQr?.shop_name?.trim() || "Takeaway", [takeawayQr?.shop_name]);
    const takeawayQrHeading = useMemo(() => `${takeawayLabel} QR`, [takeawayLabel]);
    const takeawayQrSubtitle = "Scan to open takeaway order";
    const takeawayQrDocumentTitle = useMemo(() => `${TAKEAWAY_QR_UI.label} ${takeawayLabel}`, [takeawayLabel]);
    const takeawayQrRenderKey = takeawayQr?.token || customerUrl || "takeaway-qr";

    const readTakeawayQrResponse = useCallback(async (response: Response, fallback: string) => {
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
            throw new Error(getBackendErrorMessage(payload, fallback));
        }
        return unwrapBackendData(payload) as TakeawayQrInfo;
    }, []);

    const handleOpenQrModal = async () => {
        setIsQrModalOpen(true);
        if (takeawayQr) return;

        setIsQrLoading(true);
        try {
            const info = await takeawayQrService.getInfo();
            setTakeawayQr(info);
        } catch (error) {
            message.error(error instanceof Error ? error.message : TAKEAWAY_QR_UI.loadError);
        } finally {
            setIsQrLoading(false);
        }
    };

    const handleRefreshQr = async () => {
        setIsQrRefreshing(true);
        try {
            const rotateTakeawayQr = async (forceRefreshCsrf = false): Promise<TakeawayQrInfo> => {
                const nextCsrfToken = await getCsrfTokenCached(forceRefreshCsrf);
                if (nextCsrfToken && nextCsrfToken !== csrfToken) {
                    setCsrfToken(nextCsrfToken);
                }

                const response = await fetch("/api/pos/takeaway-qr/rotate", {
                    method: "POST",
                    cache: "no-store",
                    credentials: "include",
                    headers: nextCsrfToken ? { "X-CSRF-Token": nextCsrfToken } : undefined,
                });

                if (response.status === 403 && !forceRefreshCsrf) {
                    return rotateTakeawayQr(true);
                }

                return readTakeawayQrResponse(response, "Refresh takeaway QR failed");
            };

            const info = await rotateTakeawayQr();
            setTakeawayQr(info);
            message.success("รีเฟรช QR สำเร็จ");
        } catch (error) {
            message.error(error instanceof Error ? error.message : "รีเฟรช QR ไม่สำเร็จ");
        } finally {
            setIsQrRefreshing(false);
        }
    };

    const handleCopyQrLink = async () => {
        if (!customerUrl) {
            message.warning("ยังไม่มีลิงก์ลูกค้า");
            return;
        }

        try {
            await navigator.clipboard.writeText(customerUrl);
            message.success("คัดลอกลิงก์ลูกค้าแล้ว");
        } catch {
            message.error("คัดลอกลิงก์ไม่สำเร็จ");
        }
    };

    const handleOpenCustomerPage = () => {
        if (!customerUrl) {
            message.warning("ยังไม่มีลิงก์ลูกค้า");
            return;
        }

        window.open(customerUrl, "_blank", "noopener,noreferrer");
    };

    const captureCanvasImage = useCallback(async (canvasId: string) => {
        for (let attempt = 0; attempt < 40; attempt += 1) {
            const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
            if (canvas) {
                try {
                    const dataUrl = canvas.toDataURL("image/png");
                    if (dataUrl && dataUrl !== "data:,") return dataUrl;
                } catch {}
            }
            await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
        }

        throw new Error("QR image is not ready for export");
    }, []);

    const buildExportSource = useCallback(async () => {
        if (!customerUrl) throw new Error("No takeaway QR link available");

        const printSettings = await getPrintSettings();
        const qrImageDataUrl = await captureCanvasImage(TAKEAWAY_EXPORT_CANVAS_ID);

        return { printSettings, qrImageDataUrl };
    }, [captureCanvasImage, customerUrl]);

    const openQrPrintExport = useCallback(async (
        mode: Exclude<ExportFormat, "png">,
        printSettings: Awaited<ReturnType<typeof getPrintSettings>>,
        qrImageDataUrl: string,
        filenameBase: string,
        targetWindow?: Window | null
    ) => {
        const resolvedTargetWindow = targetWindow ?? reservePrintWindow(takeawayQrDocumentTitle);
        const document = await createTableQrPrintDocument({
            items: [{
                tableName: takeawayLabel,
                customerUrl,
                qrImageDataUrl,
                qrCodeExpiresAt: takeawayQr?.qr_code_expires_at,
                heading: takeawayQrHeading,
                subtitle: takeawayQrSubtitle,
            }],
            mode,
            baseSetting: printSettings.documents.table_qr,
            locale: printSettings.locale,
        });

        if (!resolvedTargetWindow) {
            throw new Error("Popup blocked. Please allow popups to print.");
        }

        document.openInWindow(resolvedTargetWindow, {
            filename: `${filenameBase}-${mode}.pdf`,
            title: takeawayQrDocumentTitle,
        });
        return "window" as const;
    }, [customerUrl, takeawayLabel, takeawayQr?.qr_code_expires_at, takeawayQrDocumentTitle, takeawayQrHeading, takeawayQrSubtitle]);

    const handleOpenExportModal = useCallback(() => {
        if (!customerUrl) {
            message.warning(TAKEAWAY_QR_UI.missingLinkWarning);
            return;
        }

        setExportFormat("a4");
        setIsExportModalOpen(true);
    }, [customerUrl, message]);

    const handleConfirmExport = useCallback(async () => {
        if (!customerUrl) {
            message.warning(TAKEAWAY_QR_UI.missingLinkWarning);
            return;
        }

        setIsExportingQr(true);
        let reservedPrintWindow: Window | null = null;
        try {
            if (exportFormat !== "png") {
                reservedPrintWindow = reservePrintWindow(takeawayQrDocumentTitle);
            }
            const { printSettings, qrImageDataUrl } = await buildExportSource();
            const filenameBase = `takeaway-qr-${toSafeFilename(takeawayLabel)}`;

            if (exportFormat === "png") {
                const exportCanvas = await buildTableQrExportCanvas({
                    tableName: takeawayLabel,
                    customerUrl,
                    qrImageDataUrl,
                    qrCodeExpiresAt: takeawayQr?.qr_code_expires_at,
                    setting: printSettings.documents.table_qr,
                    heading: takeawayQrHeading,
                    subtitle: takeawayQrSubtitle,
                });
                downloadCanvasAsPng(exportCanvas, `${filenameBase}.png`);
                message.success("ดาวน์โหลด PNG สำเร็จ");
            } else {
                const result = await openQrPrintExport(
                    exportFormat,
                    printSettings,
                    qrImageDataUrl,
                    filenameBase,
                    reservedPrintWindow
                );
                reservedPrintWindow = null;
                /* legacy takeaway export path replaced
                    await saveCanvasAsPdf({ canvas: exportCanvas, filename: `${filenameBase}.pdf`, setting });
                    message.success("ดาวน์โหลด PDF สำเร็จ");
                } else {
                    try {
                        await printTableQrDocument({
                            tableName: takeawayLabel,
                            customerUrl,
                            qrImageDataUrl,
                            qrCodeExpiresAt: takeawayQr?.qr_code_expires_at,
                            settings: printSettings,
                            targetWindow,
                            documentTitle: takeawayQrDocumentTitle,
                            heading: takeawayQrHeading,
                            subtitle: takeawayQrSubtitle,
                            qrAltText: takeawayQrAltText,
                        });
                        message.success(TAKEAWAY_QR_UI.openPdfSuccess);
                    } catch (error) {
                        closePrintWindow(targetWindow);
                        throw error;
                    }
                }
            }

            */
            message.success(
                result === "window"
                    ? exportFormat === "a4"
                        ? "เปิดหน้าพิมพ์ A4 แล้ว"
                        : "เปิดหน้าพิมพ์สำหรับเครื่องพิมพ์ใบเสร็จแล้ว"
                    : exportFormat === "a4"
                        ? "ดาวน์โหลด PDF A4 สำเร็จ"
                        : "ดาวน์โหลด PDF สำหรับเครื่องพิมพ์ใบเสร็จสำเร็จ"
            );
            }
            setIsExportModalOpen(false);
        } catch (error) {
            closePrintWindow(reservedPrintWindow);
            message.error(error instanceof Error ? error.message : TAKEAWAY_QR_UI.exportError);
        } finally {
            setIsExportingQr(false);
        }
    }, [buildExportSource, customerUrl, exportFormat, message, openQrPrintExport, takeawayLabel, takeawayQr?.qr_code_expires_at, takeawayQrDocumentTitle, takeawayQrHeading, takeawayQrSubtitle]);

    // Responsive grid columns with minmax(0, 1fr) to prevent overflow
    const gridColumns = isMobile
        ? "minmax(0, 1fr)"
        : screens.xxl
            ? "repeat(4, minmax(0, 1fr))"
            : screens.lg
                ? "repeat(3, minmax(0, 1fr))"
                : "repeat(2, minmax(0, 1fr))";

    return (
        <React.Fragment>
            <style dangerouslySetInnerHTML={{ __html: STYLES }} />
            <div style={{ width: '100%', overflowX: 'hidden', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                <UIPageHeader
                    title="สั่งกลับบ้าน"
                    icon={<ShoppingOutlined style={{ fontSize: 18, color: "#059669" }} />}
                    onBack={() => router.push("/pos")}
                    actions={
                        <Space size={8} wrap>
                            {stats?.takeaway_waiting_payment && stats.takeaway_waiting_payment > 0 ? (
                                <Tag 
                                    color="processing" 
                                    style={{ 
                                        borderRadius: 10, 
                                        padding: "2px 10px", 
                                        fontWeight: 600,
                                        background: "#DBEAFE",
                                        border: "1px solid #93C5FD",
                                        color: "#1D4ED8"
                                    }}
                                >
                                    รอชำระเงิน: {stats.takeaway_waiting_payment}
                                </Tag>
                            ) : null}
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={handleManualRefresh}
                                loading={isLoading || isFetching}
                                style={{ borderRadius: 10 }}
                            />
                            {canCreateOrder && (
                                <Space size={8} wrap>
                                    <Button
                                        icon={<QrcodeOutlined />}
                                        onClick={() => void handleOpenQrModal()}
                                        style={{ borderRadius: 12, fontWeight: 700 }}
                                    >
                                        {TAKEAWAY_QR_UI.label}
                                    </Button>
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={handleOpenCreate}
                                    style={{
                                        borderRadius: 12,
                                        fontWeight: 700,
                                        background: "linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)",
                                        border: "none"
                                    }}
                                >
                                    เพิ่มออเดอร์
                                </Button>
                                </Space>
                            )}
                        </Space>
                    }
                />

                <PageContainer style={{ flex: 1, width: '100%', maxWidth: '100%' }}>
                    <PageStack gap={20} style={{ width: '100%' }}>
                        {/* ── Search + Filters ── */}
                        <div style={{ width: '100%', maxWidth: 1200, margin: '0 auto' }}>
                            <SearchBar>
                                <SearchInput
                                    placeholder="ค้นหา"
                                    value={searchText}
                                    onChange={(val) => setSearchText(val)}
                                />
                                <Space wrap size={10} style={{ justifyContent: 'space-between', width: '100%' }}>
                                    <Space wrap size={10}>
                                        <ModalSelector<TakeawayListStatusFilter>
                                            title="เลือกสถานะออเดอร์"
                                            options={[
                                                { label: "รายการที่ยังเปิดอยู่", value: "all" },
                                                { label: "กำลังดำเนินการ", value: "active" },
                                                { label: "รอชำระเงิน", value: "waiting_payment" },
                                            ]}
                                            value={filters.status as TakeawayListStatusFilter}
                                            onChange={(v) => updateFilter("status", v)}
                                            style={{ minWidth: 140 }}
                                        />
                                        <ModalSelector<CreatedSort>
                                            title="เรียงลำดับตาม"
                                            options={[
                                                { label: "สั่งก่อน", value: "old" },
                                                { label: "สั่งล่าสุด", value: "new" },
                                            ]}
                                            value={createdSort}
                                            onChange={(v) => setCreatedSort(v)}
                                            style={{ minWidth: 140 }}
                                        />
                                    </Space>
                                </Space>
                            </SearchBar>
                        </div>

                        {/* ── Order List Section ── */}
                        <div style={{ width: '100%', maxWidth: 1200, margin: '0 auto' }}>
                            <PageSection
                                title="รายการออเดอร์"
                                style={{ width: '100%', overflow: 'hidden' }}
                                extra={
                                    <Space size={8} wrap>
                                        {isFetching && !isLoading ? <Tag color="processing">กำลังอัปเดต...</Tag> : null}
                                        <Typography.Text strong style={{ color: token.colorText }}>
                                            {total} รายการ
                                        </Typography.Text>
                                    </Space>
                                }
                            >
                                <div style={{ width: '100%', overflow: 'hidden' }}>
                                    <Space direction="vertical" size={20} style={{ width: '100%' }}>
                                        {error ? (
                                            <PageState status="error" title="โหลดออเดอร์ไม่สำเร็จ" error={error} onRetry={() => void refresh(false)} />
                                        ) : isLoading ? (
                                            <div style={{ display: "grid", gridTemplateColumns: gridColumns, gap: isMobile ? 12 : 16, width: '100%' }}>
                                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                                    <div key={i} style={{ background: "#fff", borderRadius: 18, padding: 24, border: `1px solid ${token.colorBorderSecondary}` }}>
                                                        <Skeleton active paragraph={{ rows: 3 }} />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : visibleOrders.length === 0 ? (
                                            <UIEmptyState
                                                title={debouncedSearch.trim() ? "ไม่พบออเดอร์ที่ค้นหา" : "ยังไม่มีออเดอร์สั่งกลับบ้าน"}
                                                description={debouncedSearch.trim() ? "ลองใช้คำค้นหาอื่น หรือเปลี่ยนตัวกรอง" : "เริ่มสร้างออเดอร์ใหม่โดยกดปุ่ม \"เพิ่มออเดอร์\" ด้านบน"}
                                            />
                                        ) : (
                                            <div style={{ display: "grid", gridTemplateColumns: gridColumns, gap: isMobile ? 12 : 16, width: '100%' }}>
                                                {visibleOrders.map((order, i) => (
                                                    <div key={order.id} className="takeaway-card-animate" style={{ animationDelay: `${Math.min(i * 0.04, 0.4)}s`, minWidth: 0 }}>
                                                        <OrderCard
                                                            order={order as SalesOrderSummary}
                                                            onClick={() => router.push(getOrderNavigationPath(order as SalesOrderSummary))}
                                                            isMobile={isMobile}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Pagination */}
                                        {total > 0 && (
                                            <div style={{
                                                marginTop: 8,
                                                paddingTop: 16,
                                                borderTop: `1px solid ${token.colorBorderSecondary}`,
                                                width: '100%'
                                            }}>
                                                <ListPagination
                                                    page={page}
                                                    total={total}
                                                    pageSize={pageSize}
                                                    loading={isLoading || isFetching}
                                                    onPageChange={setPage}
                                                    onPageSizeChange={setPageSize}
                                                    activeColor="#7C3AED"
                                                />
                                            </div>
                                        )}
                                    </Space>
                                </div>
                            </PageSection>
                        </div>
                    </PageStack>
                </PageContainer>

                <Modal
                    title={<div style={{ textAlign: 'center', width: '100%', paddingRight: 32 }}>{TAKEAWAY_QR_UI.label}</div>}
                    open={isQrModalOpen}
                    onCancel={() => setIsQrModalOpen(false)}
                    footer={
                        <Space wrap style={{ width: '100%', justifyContent: 'center' }}>
                            <Button icon={<SyncOutlined spin={isQrRefreshing} />} onClick={() => void handleRefreshQr()} loading={isQrRefreshing} disabled={isQrLoading}>
                                {TAKEAWAY_QR_UI.refreshLabel}
                            </Button>
                            <Button icon={<DownloadOutlined />} onClick={() => void handleOpenExportModal()} disabled={!customerUrl}>
                                {TAKEAWAY_QR_UI.exportLabel}
                            </Button>
                            <Button icon={<CopyOutlined />} onClick={() => void handleCopyQrLink()} disabled={!customerUrl}>
                                {TAKEAWAY_QR_UI.copyLinkLabel}
                            </Button>
                            <Button icon={<LinkOutlined />} onClick={handleOpenCustomerPage} disabled={!customerUrl}>
                                {TAKEAWAY_QR_UI.openPageLabel}
                            </Button>
                        </Space>
                    }
                    centered
                    destroyOnClose={false}
                >
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div
                            style={{
                                background: "#fff",
                                padding: 20,
                                borderRadius: 18,
                                border: "1px solid #E2E8F0",
                                minHeight: 300,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            {isQrLoading ? (
                                <Skeleton active paragraph={{ rows: 6 }} style={{ width: "100%" }} />
                            ) : customerUrl ? (
                                <DynamicQRCode key={takeawayQrRenderKey} value={customerUrl} size={260} />
                            ) : (
                                <Text type="secondary">ยังไม่สามารถสร้าง QR ได้</Text>
                            )}
                        </div>
                        {customerUrl ? (
                            <Text style={{ wordBreak: "break-all" }}>
                                {customerUrl}
                            </Text>
                        ) : null}
                    </div>
                </Modal>
                <Modal
                    title={TAKEAWAY_QR_UI.exportLabel}
                    open={isExportModalOpen}
                    onCancel={() => setIsExportModalOpen(false)}
                    onOk={() => {
                        void handleConfirmExport();
                    }}
                    okText="ตกลง"
                    cancelText="ยกเลิก"
                    confirmLoading={isExportingQr}
                    destroyOnClose
                >
                    <Space direction="vertical" size={14} style={{ width: "100%" }}>
                        <Text type="secondary">{takeawayLabel}</Text>
                        <Radio.Group
                            value={exportFormat}
                            onChange={(event) => setExportFormat(event.target.value as ExportFormat)}
                            style={{ width: "100%" }}
                        >
                            {false && <Space direction="vertical" size={10} style={{ width: "100%" }}>
                                <Radio value="pdf">PDF</Radio>
                                <Radio value="png">PNG</Radio>
                            </Space>}
                            <Space direction="vertical" size={10} style={{ width: "100%" }}>
                                <Radio value="a4">A4</Radio>
                                <Radio value="receipt">เครื่องพิมพ์ใบเสร็จ</Radio>
                                <Radio value="png">PNG</Radio>
                            </Space>
                        </Radio.Group>
                    </Space>
                </Modal>
                {customerUrl ? (
                    <div style={{ display: "none" }}>
                        <DynamicQRCodeCanvas
                            key={takeawayQrRenderKey}
                            id={TAKEAWAY_EXPORT_CANVAS_ID}
                            value={customerUrl}
                            size={EXPORT_QR_CANVAS_SIZE}
                            marginSize={0}
                        />
                    </div>
                ) : null}
            </div>
        </React.Fragment>
    );
}
