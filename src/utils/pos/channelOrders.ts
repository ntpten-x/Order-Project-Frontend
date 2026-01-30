import { useCallback, useEffect, useState } from "react";
import { ordersService } from "@/services/pos/orders.service";
import { OrderStatus, OrderType, SalesOrder } from "@/types/api/pos/salesOrder";
import { useSocket } from "@/hooks/useSocket";
import { useRealtimeRefresh } from "@/utils/pos/realtime";

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

const filterActiveOrders = (orders: SalesOrder[], orderType: OrderType) =>
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
    const [orders, setOrders] = useState<SalesOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchOrders = useCallback(
        async (silent = false) => {
            if (!enabled) return;
            if (!silent) setIsLoading(true);
            try {
                const res = await ordersService.getAll(
                    undefined,
                    page,
                    limit,
                    statusFilter,
                    orderType
                );
                setOrders(filterActiveOrders(res.data || [], orderType));
            } catch {
                // Silent error for background refresh
            } finally {
                if (!silent) setIsLoading(false);
            }
        },
        [enabled, limit, orderType, page]
    );

    useEffect(() => {
        if (!enabled) return;
        fetchOrders(false);
    }, [enabled, fetchOrders]);

    useRealtimeRefresh({
        socket,
        events,
        onRefresh: () => fetchOrders(true),
        intervalMs: refreshIntervalMs,
        enabled,
    });

    return {
        orders,
        isLoading,
        refresh: fetchOrders,
    };
}
