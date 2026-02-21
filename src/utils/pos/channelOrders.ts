import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ordersService } from "../../services/pos/orders.service";
import { OrderStatus, OrderType, SalesOrderSummary } from "../../types/api/pos/salesOrder";

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
};

export function useChannelOrders({
    orderType,
    limit = 100,
    page = 1,
    statusFilter = DEFAULT_ACTIVE_STATUS_FILTER,
    enabled = true,
}: ChannelOrdersOptions) {
    const queryClient = useQueryClient();

    const { data: orders = [], isLoading, refetch } = useQuery({
        queryKey: ['orders', 'channel', orderType, { page, limit, statusFilter }],
        queryFn: async () => {
            if (!enabled) return [];
            const res = await ordersService.getAllSummary(
                undefined,
                page,
                limit,
                statusFilter,
                orderType
            );
            return filterActiveOrders(res.data || [], orderType);
        },
        enabled: enabled,
        staleTime: 1000 * 60, // 1 minute stale time, relies on invalidation
    });

    return {
        orders,
        isLoading,
        refresh: async (silent?: boolean) => {
            if (silent) {
                // If silent, we might just want to invalidate to trigger a background refetch
                await queryClient.invalidateQueries({ queryKey: ['orders', 'channel', orderType] });
            } else {
                await refetch();
            }
        },
    };
}
