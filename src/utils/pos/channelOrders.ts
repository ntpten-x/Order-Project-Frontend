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
    OrderStatus.WaitingForPayment,
].join(",");

type ChannelOrdersOptions = {
    orderType: OrderType;
    limit?: number;
    page?: number;
    statusFilter?: string;
    query?: string;
    createdSort?: string;
    enabled?: boolean;
};

export function useChannelOrders({
    orderType,
    limit = 100,
    page = 1,
    statusFilter = DEFAULT_ACTIVE_STATUS_FILTER,
    query = "",
    createdSort = "old",
    enabled = true,
}: ChannelOrdersOptions) {
    const queryClient = useQueryClient();

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['orders', 'channel', orderType, { page, limit, statusFilter, query, createdSort }],
        queryFn: async () => {
            if (!enabled) return { data: [], total: 0 };
            const res = await ordersService.getAllSummary(
                undefined,
                page,
                limit,
                statusFilter,
                orderType,
                query,
                createdSort
            );
            return res;
        },
        enabled: enabled,
        staleTime: 1000 * 60, // 1 minute stale time, relies on invalidation
        refetchOnWindowFocus: false,
    });

    return {
        orders: data?.data || [],
        total: data?.total || 0,
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
