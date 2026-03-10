"use client";

import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import SmartImage from "../../../../components/ui/image/SmartImage";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    App,
    Badge,
    Button,
    Empty,
    Input,
    Popover,
    Slider,
    Spin,
    Switch,
    Tag,
    Typography,
} from "antd";
import {
    CarOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    DownOutlined,
    FireOutlined,
    NotificationOutlined,
    ReloadOutlined,
    SearchOutlined,
    ShopOutlined,
    ShoppingOutlined,
    SoundOutlined,
    UnorderedListOutlined,
    UpOutlined,
    WifiOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/th";
import RequireOpenShift from "../../../../components/pos/shared/RequireOpenShift";
import { AccessGuardFallback } from "../../../../components/pos/AccessGuard";
import { useAuth } from "../../../../contexts/AuthContext";
import { useEffectivePermissions } from "../../../../hooks/useEffectivePermissions";
import { SERVING_BOARD_QUERY_KEY } from "../../../../hooks/pos/useServingBoardIndicator";
import { useSocket } from "../../../../hooks/useSocket";
import { useServingBoardSound, ServingBoardTone } from "../../../../hooks/pos/useServingBoardSound";
import { ordersService } from "../../../../services/pos/orders.service";
import { servingBoardService } from "../../../../services/pos/servingBoard.service";
import { ServingBoardGroup, ServingBoardItem, ServingStatus } from "../../../../types/api/pos/servingBoard";
import { OrderType } from "../../../../types/api/pos/salesOrder";
import { getCsrfTokenCached } from "../../../../utils/pos/csrf";
import { ORDER_REALTIME_EVENTS } from "../../../../utils/pos/orderRealtimeEvents";
import { useRealtimeRefresh } from "../../../../utils/pos/realtime";
import {
    areNotificationKeysCoolingDown,
    dedupeStrings,
    ENTITY_NOTICE_COOLDOWN_MS,
    FALLBACK_NOTICE_COOLDOWN_MS,
    getGroupNotificationKeys,
    getPayloadNotificationKeys,
    markNotificationKeys as markNotificationCooldownKeys,
} from "../../../../utils/pos/servingBoardNotifications";
import { RealtimeEvents } from "../../../../utils/realtimeEvents";
import { servingBoardStyles } from "./style";

dayjs.extend(relativeTime);
dayjs.locale("th");

const { Title, Text } = Typography;

type StatusCategory = "pending" | "received";
type ColumnTone = "pending" | "served";
type ColumnCard = ServingBoardGroup & { visibleItems: ServingBoardItem[] };
type BrowserNotificationPermissionState = NotificationPermission | "unsupported";
type NotificationPayload = {
    groups?: ServingBoardGroup[];
    keys?: string[];
};
const TAKEAWAY_NAME_MAX_LENGTH = 12;

function normalized(value: string): string {
    return value.trim().toLowerCase();
}

function isFresh(batchCreatedAt: string): boolean {
    return dayjs().diff(dayjs(batchCreatedAt), "minute") < 3;
}

function resolveServingStatus(status?: ServingBoardItem["serving_status"] | null): ServingStatus {
    return status === ServingStatus.Served ? ServingStatus.Served : ServingStatus.PendingServe;
}

function matchesSearch(group: ServingBoardGroup, search: string): boolean {
    if (!search) return true;

    const target = normalized(search);
    const haystacks = [
        group.source_title,
        group.source_subtitle || "",
        group.customer_name || "",
        group.order_no,
        ...group.items.map((item) => item.display_name),
        ...group.items.map((item) => item.notes || ""),
    ];

    return haystacks.some((value) => normalized(value).includes(target));
}

function toColumnCard(group: ServingBoardGroup, status: ServingStatus): ColumnCard | null {
    const visibleItems = group.items.filter((item) => resolveServingStatus(item.serving_status) === status);
    if (visibleItems.length === 0) return null;
    return { ...group, visibleItems };
}

function getStatusCategoryOptions() {
    return [
        { label: "รอดำเนินการ", value: "pending" as const },
        { label: "ได้รับแล้ว", value: "received" as const },
    ];
}

function getOrderTypeMeta(orderType: ServingBoardGroup["order_type"]) {
    switch (orderType) {
        case "DineIn":
            return {
                label: "Dine in",
                className: "dinein",
                sourceLabel: "โต๊ะ",
                icon: <ShopOutlined />,
            };
        case "TakeAway":
            return {
                label: "Take away",
                className: "takeaway",
                sourceLabel: "คิวรับกลับ",
                icon: <ShoppingOutlined />,
            };
        case "Delivery":
            return {
                label: "Delivery",
                className: "delivery",
                sourceLabel: "คิวเดลิเวอรี่",
                icon: <CarOutlined />,
            };
        default:
            return {
                label: orderType,
                className: "",
                sourceLabel: "คิว",
                icon: <UnorderedListOutlined />,
            };
    }
}

function getCardThemeClass(orderType: ServingBoardGroup["order_type"]): string {
    switch (orderType) {
        case "DineIn":
            return "theme-dinein";
        case "TakeAway":
            return "theme-takeaway";
        case "Delivery":
            return "theme-delivery";
        default:
            return "";
    }
}

function getUrgencyConfig(batchCreatedAt: string) {
    const minutes = dayjs().diff(dayjs(batchCreatedAt), "minute");
    if (minutes < 5) return { color: "#10b981", label: "ใหม่", level: 1 };
    if (minutes < 12) return { color: "#f59e0b", label: "เร่งเสิร์ฟ", level: 2 };
    return { color: "#ef4444", label: dayjs(batchCreatedAt).fromNow(true), level: 3 };
}

function truncateTakeawayName(value: string, maxLength: number = TAKEAWAY_NAME_MAX_LENGTH): string {
    const trimmed = value.trim();
    const characters = Array.from(trimmed);
    if (characters.length <= maxLength) return trimmed;
    return `${characters.slice(0, maxLength).join("").trimEnd()}...`;
}

function getTakeawayNameFromSourceTitle(sourceTitle: string): string {
    const match = sourceTitle.match(/^take\s*away\s*#(.+)$/i);
    return match?.[1]?.trim() || "";
}

function getTakeawayReference(card: ColumnCard): string {
    const takeawayName = String(card.customer_name ?? "").trim() || getTakeawayNameFromSourceTitle(card.source_title);
    if (takeawayName) {
        return `#${truncateTakeawayName(takeawayName)}`;
    }

    const shortOrderNo = card.order_no ? card.order_no.slice(4, 7) : "";
    return shortOrderNo ? `#${shortOrderNo}` : "";
}

function getTakeawayDisplaySourceTitle(card: ColumnCard): string {
    const fallbackTitle = getDisplaySourceTitle(card);
    if (card.order_type !== "TakeAway") return fallbackTitle;

    const takeawayReference = getTakeawayReference(card);
    if (!takeawayReference) return fallbackTitle;
    if (/#\S+$/.test(fallbackTitle)) {
        return fallbackTitle.replace(/#\S+$/, takeawayReference);
    }

    return `${fallbackTitle} ${takeawayReference}`.trim();
}

function enrichTakeawayCustomerNames(groups: ServingBoardGroup[], takeawayCustomerNames: Record<string, string>): ServingBoardGroup[] {
    return groups.map((group) => {
        if (group.order_type !== OrderType.TakeAway) return group;
        if (String(group.customer_name ?? "").trim()) return group;

        const fallbackCustomerName = takeawayCustomerNames[group.order_id]?.trim();
        if (!fallbackCustomerName) return group;

        return {
            ...group,
            customer_name: fallbackCustomerName,
        };
    });
}

function getDisplaySourceTitle(card: ColumnCard): string {
    if (card.order_type === "TakeAway") {
        const shortOrderNo = card.order_no ? card.order_no.slice(4, 7) : "";
        return shortOrderNo ? `สั่งกลับ #${shortOrderNo}` : "สั่งกลับ";
    }

    if (card.order_type !== "DineIn") return card.source_title;
    const cleaned = card.source_title.replace(/^dine\s*[- ]?\s*in\s*/i, "").trim();
    return cleaned || card.source_title;
}

function getDeliveryProviderLabel(sourceTitle: string): string {
    return sourceTitle.replace(/^delivery\s*/i, "").trim() || sourceTitle;
}

function sortCards(cards: ColumnCard[]): ColumnCard[] {
    return [...cards].sort((left, right) => {
        return dayjs(left.batch_created_at).valueOf() - dayjs(right.batch_created_at).valueOf();
    });
}

function recalculateServingBoardGroup(group: ServingBoardGroup): ServingBoardGroup {
    const pendingCount = group.items.reduce(
        (sum, item) => sum + (resolveServingStatus(item.serving_status) === ServingStatus.PendingServe ? 1 : 0),
        0
    );

    return {
        ...group,
        pending_count: pendingCount,
        served_count: Math.max(group.items.length - pendingCount, 0),
        total_items: group.items.length,
    };
}

function patchServingBoardItemStatus(
    groups: ServingBoardGroup[] | undefined,
    itemId: string,
    status: ServingStatus
): ServingBoardGroup[] | undefined {
    if (!Array.isArray(groups)) return groups;

    let changed = false;
    const nextGroups = groups.map((group) => {
        let groupChanged = false;
        const nextItems = group.items.map((item) => {
            if (item.id !== itemId) return item;
            groupChanged = true;
            changed = true;
            return {
                ...item,
                serving_status: status,
            };
        });

        if (!groupChanged) return group;
        return recalculateServingBoardGroup({
            ...group,
            items: nextItems,
        });
    });

    return changed ? nextGroups : groups;
}

function patchServingBoardGroupStatus(
    groups: ServingBoardGroup[] | undefined,
    groupId: string,
    status: ServingStatus
): ServingBoardGroup[] | undefined {
    if (!Array.isArray(groups)) return groups;

    let changed = false;
    const nextGroups = groups.map((group) => {
        if (group.id !== groupId) return group;
        changed = true;
        return recalculateServingBoardGroup({
            ...group,
            items: group.items.map((item) => ({
                ...item,
                serving_status: status,
            })),
        });
    });

    return changed ? nextGroups : groups;
}


/* ─── Item Action Button ─── */
function ItemActionButton({
    item,
    disabled,
    loading,
    onClick,
}: {
    item: ServingBoardItem;
    disabled: boolean;
    loading: boolean;
    onClick: () => void;
}) {
    const isServed = resolveServingStatus(item.serving_status) === ServingStatus.Served;

    return (
        <Button
            type={isServed ? "default" : "primary"}
            danger={isServed}
            disabled={disabled}
            loading={loading}
            onClick={onClick}
            className={`sb-item-action-btn ${isServed ? "undo" : "serve"}`}
            icon={isServed ? <ReloadOutlined /> : <CheckCircleOutlined />}
        >
            {isServed ? "ย้ายกลับ" : "ได้รับแล้ว"}
        </Button>
    );
}

/* ─── Column Component ─── */
function Column({
    title,
    tone,
    cards,
    itemLoadingIds,
    groupLoadingIds,
    onUpdateItem,
    onUpdateGroup,
    emptyText,
}: {
    title: string;
    hint?: string;
    tone: ColumnTone;
    cards: ColumnCard[];
    itemLoadingIds: Set<string>;
    groupLoadingIds: Set<string>;
    onUpdateItem: (itemId: string, status: ServingStatus) => void;
    onUpdateGroup: (groupId: string, status: ServingStatus) => void;
    emptyText: string;
}) {
    const totalVisibleItems = cards.reduce((sum, card) => sum + card.visibleItems.length, 0);

    return (
        <section className="sb-column-shell" data-testid={`serving-column-${tone}`}>
            <div className="sb-column-header">
                <div className="sb-column-title-wrap">
                    <div className={`sb-column-icon ${tone}`}>
                        {tone === "pending" ? <FireOutlined /> : <CheckCircleOutlined />}
                    </div>
                    <div className="sb-column-title-group">
                        <Title level={3} className="sb-column-title">
                            {title}
                        </Title>
                        <div className="sb-column-count">
                            <strong>{totalVisibleItems} รายการ</strong>
                        </div>
                    </div>
                </div>
            </div>

            {cards.length === 0 ? (
                <div className="sb-empty-card">
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span style={{ color: "#64748b" }}>{emptyText}</span>} />
                </div>
            ) : (
                <div className="sb-card-grid">
                    {cards.map((card) => {
                        const urgency = getUrgencyConfig(card.batch_created_at);
                        const orderTypeMeta = getOrderTypeMeta(card.order_type);
                        const themeClass = getCardThemeClass(card.order_type);
                        const displaySourceTitle = getTakeawayDisplaySourceTitle(card);
                        const displaySubtitle = card.order_type === "Delivery" ? card.source_subtitle : null;
                        const deliveryProviderLabel = card.order_type === "Delivery" ? getDeliveryProviderLabel(card.source_title) : "";
                        const progress = Math.max(8, Math.round((card.served_count / Math.max(card.total_items, 1)) * 100));
                        const canServeAll = card.pending_count > 0;
                        const canUndoAll = card.served_count > 0;
                        const isUrgent = tone === "pending" && urgency.level === 3;

                        return (
                            <article
                                key={`${tone}-${card.id}`}
                                className={`sb-order-card ${themeClass} ${isUrgent ? "urgent" : ""}`}
                                data-testid={`serving-card-${card.id}`}
                                data-order-id={card.order_id}
                                data-order-no={card.order_no}
                                data-order-type={card.order_type}
                            >
                                {/* Card Header */}
                                <div className="sb-order-header">
                                    <div className="sb-order-header-top">
                                        <div className="sb-order-id-wrap">
                                            <div className={`sb-order-source-wrap ${card.order_type === "DineIn" ? "dinein" : ""}`}>
                                                {card.order_type === "Delivery" ? (
                                                    <div className="sb-order-delivery-line">
                                                        <span className="sb-order-source-emphasis">{displaySubtitle || displaySourceTitle}</span>
                                                        <span className="sb-order-delivery-provider">{deliveryProviderLabel}</span>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span className={`sb-order-source-emphasis ${card.order_type === "DineIn" ? "dinein" : ""}`}>{displaySourceTitle}</span>
                                                        {displaySubtitle ? (
                                                            <span className="sb-order-subtitle-inline">
                                                                รหัส {displaySubtitle}
                                                            </span>
                                                        ) : null}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="sb-order-header-meta">
                                        <Tag className={`sb-order-type-tag ${orderTypeMeta.className}`} icon={orderTypeMeta.icon}>
                                            {orderTypeMeta.label}
                                        </Tag>
                                        <div className="sb-order-meta-right">
                                            {isFresh(card.batch_created_at) ? <span className="sb-order-fresh">NEW</span> : null}
                                            <span className="sb-order-urgency" style={{ color: urgency.color }}>
                                                {urgency.label}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="sb-progress-track">
                                        <div className="sb-progress-fill" style={{ width: `${progress}%`, background: tone === "pending" ? urgency.color : "#10b981" }} />
                                    </div>
                                </div>

                                {/* Items List */}
                                <div className="sb-items-list">
                                    {card.visibleItems.map((item) => {
                                        const isServed = resolveServingStatus(item.serving_status) === ServingStatus.Served;
                                        const targetStatus = isServed ? ServingStatus.PendingServe : ServingStatus.Served;

                                        return (
                                            <div
                                                key={item.id}
                                                className={`sb-item-row ${isServed ? "served" : "pending"}`}
                                                data-testid={`serving-item-${item.id}`}
                                            >
                                                <div className="sb-item-image">
                                                    {item.product_image_url ? (
                                                        <SmartImage
                                                            src={item.product_image_url}
                                                            alt={item.display_name}
                                                            width={44}
                                                            height={44}
                                                            style={{ objectFit: "cover", borderRadius: "8px" }}
                                                        />
                                                    ) : (
                                                        <span className="sb-item-image-placeholder">
                                                            {item.display_name.charAt(0)}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="sb-item-info">
                                                    <div className="sb-item-name">{item.display_name}</div>
                                                    <div className="sb-item-quantity-text">x{item.quantity}</div>
                                                    {item.details && item.details.length > 0 && (
                                                        <div className="sb-item-details" style={{ fontSize: '12px', color: '#10b981', marginTop: '2px' }}>
                                                            {item.details.map((detail, idx) => (
                                                                <div key={idx} className="sb-item-detail-row">
                                                                    <span>+ {detail.detail_name}</span>
                                                                    {detail.extra_price > 0 && (
                                                                        <span style={{ marginLeft: '4px', opacity: 0.8 }}>(+{detail.extra_price}฿)</span>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {item.notes ? <div className="sb-item-note">{item.notes}</div> : null}
                                                </div>
                                                <div className="sb-item-action">
                                                    <ItemActionButton
                                                        item={item}
                                                        loading={itemLoadingIds.has(item.id)}
                                                        disabled={groupLoadingIds.has(card.id)}
                                                        onClick={() => onUpdateItem(item.id, targetStatus)}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Card Footer */}
                                <div className="sb-order-footer">
                                    {tone === "pending" ? (
                                        <Button
                                            type="primary"
                                            icon={<CheckCircleOutlined />}
                                            loading={groupLoadingIds.has(card.id)}
                                            disabled={!canServeAll}
                                            onClick={() => onUpdateGroup(card.id, ServingStatus.Served)}
                                            className="sb-serve-all-btn"
                                        >
                                            ได้รับทั้งหมด
                                        </Button>
                                    ) : null}
                                    {tone === "served" ? (
                                        <Button
                                            danger
                                            icon={<ClockCircleOutlined />}
                                            loading={groupLoadingIds.has(card.id)}
                                            disabled={!canUndoAll}
                                            onClick={() => onUpdateGroup(card.id, ServingStatus.PendingServe)}
                                            className="sb-reset-btn"
                                        >
                                            ย้ายกลับทั้งหมด
                                        </Button>
                                    ) : null}
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

/* ─── Main Page Content ─── */
function ServingBoardPageContent() {
    const { message } = App.useApp();
    const queryClient = useQueryClient();
    const { socket, isConnected } = useSocket();
    const {
        notifyMode,
        playNotificationSound,
        playTestSound,
        setNotifyMode,
        setTone,
        setVolume,
        soundBlocked,
        soundEnabled,
        soundTone,
        soundVolume,
        toastEnabled,
        toggleSound,
        toggleToast,
    } = useServingBoardSound();

    const [search, setSearch] = useState("");
    const deferredSearch = useDeferredValue(search);
    const [statusCategory, setStatusCategory] = useState<StatusCategory>("pending");
    const [statsExpanded, setStatsExpanded] = useState(false);
    const [itemLoadingIds, setItemLoadingIds] = useState<Set<string>>(new Set());
    const [groupLoadingIds, setGroupLoadingIds] = useState<Set<string>>(new Set());
    const [isDocumentVisible, setIsDocumentVisible] = useState(true);
    const [browserNotificationPermission, setBrowserNotificationPermission] = useState<BrowserNotificationPermissionState>("default");
    const hasShownSoundBlockedRef = useRef(false);
    const seenGroupIdsRef = useRef<Set<string>>(new Set());
    const hasInitializedBoardRef = useRef(false);
    const lastNoticeAtRef = useRef(0);
    const notificationCooldownRef = useRef<Map<string, number>>(new Map());
    const pageTitleRef = useRef("Serving Board");
    const hiddenNoticeCountRef = useRef(0);

    const { data = [], isLoading, isFetching, refetch, error } = useQuery<ServingBoardGroup[]>({
        queryKey: SERVING_BOARD_QUERY_KEY,
        queryFn: () => servingBoardService.getBoard(),
        staleTime: isConnected ? 45_000 : 7_500,
        refetchInterval: isConnected ? false : 15_000,
        refetchIntervalInBackground: false,
        refetchOnWindowFocus: false,
    });

    const takeawayOrderIdsMissingCustomerName = useMemo(
        () =>
            Array.from(
                new Set(
                    data
                        .filter(
                            (group) =>
                                group.order_type === OrderType.TakeAway &&
                                !String(group.customer_name ?? "").trim() &&
                                Boolean(group.order_id)
                        )
                        .map((group) => group.order_id)
                )
            ).sort(),
        [data]
    );

    const { data: takeawayCustomerNames = {} } = useQuery<Record<string, string>>({
        queryKey: ["serving-board", "takeaway-customer-names", takeawayOrderIdsMissingCustomerName],
        enabled: takeawayOrderIdsMissingCustomerName.length > 0,
        staleTime: isConnected ? 45_000 : 7_500,
        refetchOnWindowFocus: false,
        queryFn: async () => {
            const entries = await Promise.all(
                takeawayOrderIdsMissingCustomerName.map(async (orderId) => {
                    try {
                        const order = await ordersService.getById(orderId);
                        return [orderId, String(order.customer_name ?? "").trim()] as const;
                    } catch {
                        return [orderId, ""] as const;
                    }
                })
            );

            return entries.reduce<Record<string, string>>((acc, [orderId, customerName]) => {
                if (customerName) {
                    acc[orderId] = customerName;
                }
                return acc;
            }, {});
        },
    });

    const displayData = useMemo(
        () => enrichTakeawayCustomerNames(data, takeawayCustomerNames),
        [data, takeawayCustomerNames]
    );
    const isUpdatingServingStatus = itemLoadingIds.size > 0 || groupLoadingIds.size > 0;

    useRealtimeRefresh({
        socket,
        events: [...ORDER_REALTIME_EVENTS, RealtimeEvents.servingBoard.update],
        onRefresh: () => {
            void refetch();
        },
        debounceMs: 500,
        enabled: true,
    });

    useEffect(() => {
        if (typeof document === "undefined") return;

        pageTitleRef.current = document.title || "Serving Board";
        setIsDocumentVisible(document.visibilityState === "visible");

        const handleVisibilityChange = () => {
            const visible = document.visibilityState === "visible";
            setIsDocumentVisible(visible);
            if (visible) {
                hiddenNoticeCountRef.current = 0;
                document.title = pageTitleRef.current;
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, []);

    useEffect(() => {
        if (typeof window === "undefined" || !("Notification" in window)) {
            setBrowserNotificationPermission("unsupported");
            return;
        }

        const syncPermission = () => {
            setBrowserNotificationPermission(window.Notification.permission);
        };

        syncPermission();
        window.addEventListener("focus", syncPermission);
        return () => {
            window.removeEventListener("focus", syncPermission);
        };
    }, []);

    const areKeysCoolingDown = useCallback((keys: string[], now: number) => {
        return areNotificationKeysCoolingDown(
            notificationCooldownRef.current,
            keys,
            now,
            lastNoticeAtRef.current,
            FALLBACK_NOTICE_COOLDOWN_MS,
            ENTITY_NOTICE_COOLDOWN_MS,
        );
    }, []);

    const markNotificationKeys = useCallback((keys: string[], now: number) => {
        if (!keys.length) {
            lastNoticeAtRef.current = now;
            return;
        }

        markNotificationCooldownKeys(notificationCooldownRef.current, keys, now);
    }, []);

    const buildNotificationContent = useCallback((groups: ServingBoardGroup[], hidden: boolean) => {
        const firstGroup = groups[0];
        const toastContent =
            groups.length === 0
                ? "มีรายการใหม่เข้ามาในคิวเสิร์ฟ"
                : groups.length === 1
                  ? `มีรายการใหม่เข้ามา: ${firstGroup.source_title}`
                  : `มีรายการใหม่เข้ามา ${groups.length} รอบ`;

        const notificationBody =
            groups.length === 0
                ? hidden
                    ? "มีรายการใหม่เข้ามาใน Serving Board เปิดแท็บเพื่อตรวจสอบ"
                    : toastContent
                : groups.length === 1
                  ? hidden
                      ? `มีรายการใหม่จาก ${firstGroup.source_title} เปิดแท็บเพื่อตรวจสอบ`
                      : toastContent
                  : hidden
                    ? `มีรายการใหม่ ${groups.length} รอบใน Serving Board เปิดแท็บเพื่อตรวจสอบ`
                    : toastContent;

        return { toastContent, notificationBody };
    }, []);

    const showBackgroundNotification = useCallback((body: string, keys: string[]) => {
        if (
            typeof window === "undefined" ||
            !("Notification" in window) ||
            window.Notification.permission !== "granted"
        ) {
            return false;
        }

        const notification = new window.Notification("Serving Board", {
            body,
            tag: keys[0] || "serving-board",
            renotify: true,
        } as NotificationOptions & { renotify?: boolean });

        notification.onclick = () => {
            window.focus();
            notification.close();
        };

        window.setTimeout(() => {
            notification.close();
        }, 8000);

        return true;
    }, []);

    const handleTestSound = useCallback(async () => {
        const result = await playTestSound();
        if (result === "blocked") {
            message.warning("เบราว์เซอร์ยังบล็อกเสียงแจ้งเตือนอยู่");
        } else if (result === "unsupported") {
            message.warning("เบราว์เซอร์นี้ไม่รองรับการเล่นเสียงแจ้งเตือน");
        }
    }, [message, playTestSound]);

    const handleEnableBrowserNotification = useCallback(async () => {
        if (typeof window === "undefined" || !("Notification" in window)) {
            message.warning("เบราว์เซอร์นี้ไม่รองรับ Browser Notification");
            return;
        }

        const permission = await window.Notification.requestPermission();
        setBrowserNotificationPermission(permission);
        if (permission === "granted") {
            message.success("เปิด Browser Notification แล้ว");
        } else if (permission === "denied") {
            message.warning("Browser Notification ถูกปฏิเสธ กรุณาอนุญาตจากการตั้งค่าเบราว์เซอร์");
        }
    }, [message]);

    const notifyIncomingBatches = useCallback(
        async ({ groups = [], keys = [] }: NotificationPayload) => {
            const now = Date.now();
            const hidden = !isDocumentVisible;

            const eligibleGroups = groups.filter((group) => {
                const groupKeys = getGroupNotificationKeys(group);
                return !areKeysCoolingDown(groupKeys, now);
            });
            const notificationGroups = eligibleGroups.length > 0 ? eligibleGroups : groups;
            const notificationKeys = notificationGroups.length > 0
                ? dedupeStrings(notificationGroups.flatMap((group) => getGroupNotificationKeys(group)))
                : dedupeStrings(keys);

            if (notificationGroups.length === 0 && areKeysCoolingDown(notificationKeys, now)) {
                return;
            }
            if (notificationGroups.length > 0 && eligibleGroups.length === 0) {
                return;
            }

            markNotificationKeys(notificationKeys, now);

            if (soundEnabled) {
                await playNotificationSound();
            }

            if (!toastEnabled) {
                return;
            }

            if (hidden) {
                hiddenNoticeCountRef.current += Math.max(1, notificationGroups.length || 1);
                if (typeof document !== "undefined") {
                    document.title = `(${hiddenNoticeCountRef.current}) ${pageTitleRef.current}`;
                }
            }

            const { toastContent, notificationBody } = buildNotificationContent(notificationGroups, hidden);

            if (hidden) {
                const shown = showBackgroundNotification(notificationBody, notificationKeys);
                if (shown) {
                    return;
                }
            }

            message.open({
                type: "info",
                icon: <NotificationOutlined style={{ color: "#10b981" }} />,
                content: toastContent,
                duration: hidden ? 6 : 3,
            });
        },
        [areKeysCoolingDown, buildNotificationContent, isDocumentVisible, markNotificationKeys, message, playNotificationSound, showBackgroundNotification, soundEnabled, toastEnabled]
    );

    useEffect(() => {
        if (!soundBlocked || hasShownSoundBlockedRef.current) return;
        hasShownSoundBlockedRef.current = true;
        message.warning("เบราว์เซอร์ยังบล็อกเสียงแจ้งเตือนอยู่ กดปุ่มเสียง 1 ครั้งเพื่อเปิดการแจ้งเตือน");
    }, [message, soundBlocked]);

    useEffect(() => {
        if (!soundBlocked) {
            hasShownSoundBlockedRef.current = false;
        }
    }, [soundBlocked]);

    useEffect(() => {
        if (!hasInitializedBoardRef.current) {
            seenGroupIdsRef.current = new Set(data.map((group) => group.id));
            hasInitializedBoardRef.current = true;
            return;
        }

        const nextSeenIds = new Set(seenGroupIdsRef.current);
        const newGroups = data.filter((group) => !nextSeenIds.has(group.id));
        data.forEach((group) => nextSeenIds.add(group.id));
        seenGroupIdsRef.current = nextSeenIds;

        if (notifyMode === "new-batches" && newGroups.length > 0) {
            void notifyIncomingBatches({ groups: newGroups });
        }
    }, [data, notifyIncomingBatches, notifyMode]);

    useEffect(() => {
        if (!socket || notifyMode !== "event-stream") return;

        let lastNoticeAt = 0;
        const notify = (payload?: unknown) => {
            const now = Date.now();
            if (now - lastNoticeAt < FALLBACK_NOTICE_COOLDOWN_MS) return;
            lastNoticeAt = now;
            void notifyIncomingBatches({ keys: getPayloadNotificationKeys(payload) });
        };

        socket.on(RealtimeEvents.orders.create, notify);
        socket.on(RealtimeEvents.salesOrderItem.create, notify);

        return () => {
            socket.off(RealtimeEvents.orders.create, notify);
            socket.off(RealtimeEvents.salesOrderItem.create, notify);
        };
    }, [notifyIncomingBatches, notifyMode, socket]);

    const filteredGroups = useMemo(() => {
        return displayData.filter((group) => matchesSearch(group, deferredSearch));
    }, [deferredSearch, displayData]);

    const pendingCards = useMemo(
        () =>
            sortCards(
                filteredGroups
                    .map((group) => toColumnCard(group, ServingStatus.PendingServe))
                    .filter((group): group is ColumnCard => Boolean(group))
            ),
        [filteredGroups]
    );

    const servedCards = useMemo(
        () =>
            sortCards(
                filteredGroups
                    .map((group) => toColumnCard(group, ServingStatus.Served))
                    .filter((group): group is ColumnCard => Boolean(group))
            ),
        [filteredGroups]
    );

    const stats = useMemo(
        () => ({
            totalBatches: filteredGroups.length,
            pendingItems: filteredGroups.reduce((sum, group) => sum + group.pending_count, 0),
            servedItems: filteredGroups.reduce((sum, group) => sum + group.served_count, 0),
            totalItems: filteredGroups.reduce((sum, group) => sum + group.total_items, 0),
        }),
        [filteredGroups]
    );

    const handleUpdateItem = async (itemId: string, status: ServingStatus) => {
        const previousGroups = queryClient.getQueryData<ServingBoardGroup[]>(SERVING_BOARD_QUERY_KEY);
        setItemLoadingIds((prev) => new Set(prev).add(itemId));
        queryClient.setQueryData<ServingBoardGroup[]>(
            SERVING_BOARD_QUERY_KEY,
            (oldData) => patchServingBoardItemStatus(oldData, itemId, status) ?? oldData
        );

        try {
            const csrfToken = await getCsrfTokenCached();
            await servingBoardService.updateItemStatus(itemId, status, undefined, csrfToken);
            void refetch();
        } catch (err) {
            queryClient.setQueryData(SERVING_BOARD_QUERY_KEY, previousGroups);
            message.error(err instanceof Error ? err.message : "ไม่สามารถอัปเดตสถานะรายการได้");
        } finally {
            setItemLoadingIds((prev) => {
                const next = new Set(prev);
                next.delete(itemId);
                return next;
            });
        }
    };

    const handleUpdateGroup = async (groupId: string, status: ServingStatus) => {
        const previousGroups = queryClient.getQueryData<ServingBoardGroup[]>(SERVING_BOARD_QUERY_KEY);
        setGroupLoadingIds((prev) => new Set(prev).add(groupId));
        queryClient.setQueryData<ServingBoardGroup[]>(
            SERVING_BOARD_QUERY_KEY,
            (oldData) => patchServingBoardGroupStatus(oldData, groupId, status) ?? oldData
        );

        try {
            const csrfToken = await getCsrfTokenCached();
            await servingBoardService.updateGroupStatus(groupId, status, undefined, csrfToken);
            void refetch();
        } catch (err) {
            queryClient.setQueryData(SERVING_BOARD_QUERY_KEY, previousGroups);
            message.error(err instanceof Error ? err.message : "ไม่สามารถอัปเดตสถานะทั้งกลุ่มได้");
        } finally {
            setGroupLoadingIds((prev) => {
                const next = new Set(prev);
                next.delete(groupId);
                return next;
            });
        }
    };

    /* ── Sound Settings Popover ── */
    const soundSettingsContent = (
        <div className="sb-sound-popover">
            <div className="sb-sound-section">
                <div className="sb-sound-label">
                    <span>เปิดเสียงแจ้งเตือน</span>
                    <Switch checked={soundEnabled} onChange={() => { void toggleSound(); }} />
                </div>
                <div className="sb-sound-label" style={{ marginTop: 10 }}>
                    <span>เปิดข้อความแจ้งเตือน</span>
                    <Switch checked={toastEnabled} onChange={toggleToast} />
                </div>
                <Text className="sb-sound-hint">
                    เมื่อแท็บอยู่เบื้องหลัง ระบบจะใช้ Browser Notification หากเบราว์เซอร์อนุญาต
                </Text>
            </div>
            <div className="sb-sound-section">
                <div className="sb-sound-label">
                    <span>โทนเสียง</span>
                    <Text style={{ color: "#94a3b8" }}>
                        {soundTone === "chime" ? "Chime" : soundTone === "service-bell" ? "Bell" : "Alert"}
                    </Text>
                </div>
                <div className="sb-inline-chips">
                    {(["chime", "service-bell", "alert"] as ServingBoardTone[]).map((tone) => (
                        <Button key={tone} type={soundTone === tone ? "primary" : "default"} onClick={() => setTone(tone)} className="sb-mini-chip">
                            {tone === "chime" ? "Chime" : tone === "service-bell" ? "Bell" : "Alert"}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="sb-sound-section">
                <div className="sb-sound-label">
                    <span>ระดับเสียง</span>
                    <Text style={{ color: "#94a3b8" }}>{soundVolume}%</Text>
                </div>
                <Slider
                    min={0}
                    max={100}
                    step={5}
                    value={soundVolume}
                    onChange={(value) => setVolume(Array.isArray(value) ? value[0] : value)}
                />
                <Button size="small" icon={<SoundOutlined />} onClick={() => void handleTestSound()} disabled={!soundEnabled} style={{ marginTop: 10 }}>
                    ทดสอบเสียง
                </Button>
            </div>

            <div className="sb-sound-section">
                <div className="sb-sound-label">
                    <span>Browser Notification</span>
                    <Text style={{ color: "#94a3b8" }}>
                        {browserNotificationPermission === "granted"
                            ? "อนุญาตแล้ว"
                            : browserNotificationPermission === "denied"
                              ? "ถูกปฏิเสธ"
                              : browserNotificationPermission === "unsupported"
                                ? "ไม่รองรับ"
                                : "ยังไม่อนุญาต"}
                    </Text>
                </div>
                {browserNotificationPermission !== "granted" && browserNotificationPermission !== "unsupported" ? (
                    <Button size="small" onClick={() => void handleEnableBrowserNotification()}>
                        เปิดแจ้งเตือนเบราว์เซอร์
                    </Button>
                ) : null}
            </div>

            <div className="sb-sound-section">
                <div className="sb-sound-label">
                    <span>แจ้งเฉพาะรอบใหม่</span>
                    <Switch checked={notifyMode === "new-batches"} onChange={(checked) => setNotifyMode(checked ? "new-batches" : "event-stream")} />
                </div>
                <Text className="sb-sound-hint">
                    {notifyMode === "new-batches"
                        ? "แจ้งเตือนเมื่อมีรอบใหม่ที่ยังไม่เคยแสดงบนหน้านี้"
                        : "แจ้งเตือนทุกครั้งเมื่อมี event สร้างออเดอร์หรือเพิ่มรายการ"}
                </Text>
            </div>
        </div>
    );

    const statusCategories = getStatusCategoryOptions();
    const summaryCards = [
        { label: "รวมทั้งหมด", value: stats.totalBatches, color: "#818cf8" },
        { label: "รอดำเนินการ", value: stats.pendingItems, color: "#f59e0b" },
        { label: "ได้รับแล้ว", value: stats.servedItems, color: "#10b981" },
    ];

    return (
        <div className="sb-page" data-testid="serving-board-page">
            <style jsx global>{servingBoardStyles}</style>

            {/* ═══ Sticky Header ═══ */}
            <div className="sb-hero">
                {/* Top Row: Title + Actions */}
                <div className="sb-hero-top">
                    <div className="sb-title-section">
                        <div className="sb-fire-icon">
                            <FireOutlined style={{ fontSize: 20, color: "#fff" }} />
                        </div>
                        <div className="sb-title-line">
                            <Title className="sb-title">Serving Board</Title>
                            <Tag className={`sb-live-tag ${isConnected ? "online" : "offline"}`} icon={<WifiOutlined />}>
                                {isConnected ? "LIVE" : "OFFLINE"}
                            </Tag>
                        </div>
                        {isUpdatingServingStatus ? (
                            <Tag color="processing" style={{ marginTop: 12, width: "fit-content", borderRadius: 999 }}>
                                กำลังอัปเดตสถานะรายการ...
                            </Tag>
                        ) : null}
                    </div>

                    <div className="sb-action-btns">
                        <Button
                            type="text"
                            icon={<SoundOutlined style={{ fontSize: 16 }} />}
                            onClick={() => {
                                void toggleSound();
                            }}
                            data-testid="serving-sound-toggle"
                            className="sb-action-btn"
                            style={{
                                color: soundEnabled ? "#10b981" : undefined,
                                background: soundEnabled ? "rgba(16, 185, 129, 0.12)" : undefined,
                                borderColor: soundEnabled ? "rgba(16, 185, 129, 0.2)" : undefined,
                            }}
                        />
                        <Popover trigger="click" placement="bottomRight" content={soundSettingsContent}>
                            <Button className="sb-action-btn sb-action-btn-settings">เสียง</Button>
                        </Popover>
                        <Button
                            icon={<ReloadOutlined style={{ fontSize: 16 }} />}
                            onClick={() => void refetch()}
                            loading={isFetching}
                            className="sb-action-btn sb-action-btn-refresh"
                        />
                    </div>
                </div>

                {/* Stats Toggle */}
                <div className="sb-stats-toggle" onClick={() => setStatsExpanded((prev) => !prev)}>
                    <div className="sb-stats-toggle-left">
                        <Badge count={stats.totalItems} style={{ backgroundColor: "#6366f1" }} />
                        <Text className="sb-stats-toggle-text">ภาพรวม</Text>
                    </div>
                    <Button type="text" size="small" icon={statsExpanded ? <UpOutlined /> : <DownOutlined />} className="sb-toggle-btn" />
                </div>

                {statsExpanded ? (
                    <div className="sb-stats-row">
                        {summaryCards.map((stat) => (
                            <div key={stat.label} className="sb-stat-card">
                                <span className="sb-stat-value" style={{ color: stat.color }}>
                                    {stat.value}
                                </span>
                                <span className="sb-stat-label">{stat.label}</span>
                            </div>
                        ))}
                    </div>
                ) : null}

                {/* Filter Tabs */}
                <div className="sb-filter-row">
                    {statusCategories.map((category) => {
                        const active = statusCategory === category.value;

                        return (
                            <Button
                                key={category.value}
                                type="text"
                                onClick={() => setStatusCategory(category.value)}
                                className={`sb-filter-btn sb-filter-btn-${category.value} ${active ? "active" : ""}`}
                                data-status-category={category.value}
                            >
                                {category.value === "pending" ? (
                                    <FireOutlined className="sb-filter-btn-icon" />
                                ) : (
                                    <CheckCircleOutlined className="sb-filter-btn-icon" />
                                )}
                                {category.label}
                            </Button>
                        );
                    })}
                </div>

                {/* Search */}
                <div className="sb-hero-search">
                    <Input
                        allowClear
                        size="large"
                        prefix={<SearchOutlined className="sb-search-icon" />}
                        placeholder="ค้นหา"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        className="sb-search-glass-input"
                    />
                </div>
            </div>

            {/* ═══ Main Content ═══ */}
            <div className="sb-content">
                {error ? (
                    <div className="sb-empty-state">
                        <Text style={{ color: "#fca5a5", fontSize: 15 }}>โหลดข้อมูลบอร์ดเสิร์ฟไม่สำเร็จ</Text>
                        <Button onClick={() => void refetch()} type="primary" style={{ marginTop: 16 }}>
                            ลองใหม่
                        </Button>
                    </div>
                ) : isLoading ? (
                    <div className="sb-loading-state">
                        <Spin size="large" />
                    </div>
                ) : (
                    <div className="sb-columns">
                        {statusCategory === "pending" ? (
                            <Column
                                title="รอดำเนินการ"
                                tone="pending"
                                cards={pendingCards}
                                itemLoadingIds={itemLoadingIds}
                                groupLoadingIds={groupLoadingIds}
                                onUpdateItem={handleUpdateItem}
                                onUpdateGroup={handleUpdateGroup}
                                emptyText="ไม่มีรายการรอดำเนินการ"
                            />
                        ) : (
                            <Column
                                title="ได้รับแล้ว"
                                tone="served"
                                cards={servedCards}
                                itemLoadingIds={itemLoadingIds}
                                groupLoadingIds={groupLoadingIds}
                                onUpdateItem={handleUpdateItem}
                                onUpdateGroup={handleUpdateGroup}
                                emptyText="ยังไม่มีรายการที่ได้รับแล้ว"
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ServingBoardPage() {
    const { user, loading: authLoading } = useAuth();
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });

    if (authLoading || permissionLoading) {
        return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์การใช้งาน..." />;
    }

    if (!can("orders.page", "view")) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้" tone="danger" />;
    }

    return (
        <RequireOpenShift>
            <ServingBoardPageContent />
        </RequireOpenShift>
    );
}
