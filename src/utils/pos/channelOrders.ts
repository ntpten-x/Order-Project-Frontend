import { useCallback, useEffect, useState } from "react";
import { ordersService } from "@/services/pos/orders.service";
import { OrderStatus, OrderType, SalesOrderSummary } from "@/types/api/pos/salesOrder";
import { useSocket } from "@/hooks/useSocket";
import { useRealtimeRefresh } from "@/utils/pos/realtime";
import { isEqual } from "lodash";

const EXCLUDED_STATUSES = new Set<OrderStatus>([
    OrderStatus.Paid,
    OrderStatus.Completed,
    OrderStatus.Cancelled,
]);

const DEFAULT_ACTIVE_STATUS_FILTER = [
    OrderStatus.Pending,
    OrderStatus.Cooking,
    OrderStatus.Served,
    OrderStatus.WaitingForPayment,
].join(",");

const DEFAULT_EVENTS = [
    "orders:create",
    "orders:update",
    "orders:delete",
    "payments:create",
    "payments:update",
];

const filterActiveOrders = (orders: SalesOrderSummary[], orderType: OrderType) =>
    orders.filter(
        (order) =>
            order.order_type === orderType &&
            !EXCLUDED_STATUSES.has(order.status)
    );

type ChannelOrdersOptions = {
    orderType: OrderType;
    limit?: number;
    page?: number;
    statusFilter?: string;
    enabled?: boolean;
    refreshIntervalMs?: number;
    events?: string[];
};

export function useChannelOrders({
    orderType,
    limit = 100,
    page = 1,
    statusFilter = DEFAULT_ACTIVE_STATUS_FILTER,
    enabled = true,
    refreshIntervalMs = 15000,
    events = DEFAULT_EVENTS,
}: ChannelOrdersOptions) {
    const { socket } = useSocket();
    const [orders, setOrders] = useState<SalesOrderSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchOrders = useCallback(
        async (silent = false) => {
            if (!enabled) return;
            if (!silent) setIsLoading(true);
            try {
                const res = await ordersService.getAllSummary(
                    undefined,
                    page,
                    limit,
                    statusFilter,
                    orderType
                );
                const activeOrders = filterActiveOrders(res.data || [], orderType);
                setOrders(prev => {
                    if (isEqual(prev, activeOrders)) return prev;
                    return activeOrders;
                });
            } catch {
                // Silent error for background refresh
            } finally {
                if (!silent) setIsLoading(false);
            }
        },
        [enabled, limit, orderType, page, statusFilter]
    );

    useEffect(() => {
        if (!enabled) return;
        fetchOrders(false);
    }, [enabled, fetchOrders, statusFilter]);

    useRealtimeRefresh({
        socket,
        events,
        onRefresh: () => fetchOrders(true),
        intervalMs: refreshIntervalMs,
        enabled,
        debounceMs: 800,
    });

    return {
        orders,
        isLoading,
        refresh: fetchOrders,
    };
}
