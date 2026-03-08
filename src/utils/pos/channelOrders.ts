import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";

import { ordersService } from "../../services/pos/orders.service";
import { OrderStatus, OrderType } from "../../types/api/pos/salesOrder";
import { SocketContext } from "../../contexts/SocketContext";


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

type ChannelOrdersResponse = {
    data: {
        id: string;
        order_no: string;
        order_type: OrderType;
        status: OrderStatus;
        create_date: string;
        total_amount: number;
        delivery_code?: string | null;
        customer_name?: string | null;
        table_id?: string | null;
        delivery_id?: string | null;
        table?: { table_name?: string | null } | null;
        delivery?: { delivery_name?: string | null } | null;
        items_count?: number;
    }[];
    total: number;
    page: number;
    last_page?: number;
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
    const { isConnected } = useContext(SocketContext);
    const queryKey = ['orders', 'channel', orderType, { page, limit, statusFilter, query, createdSort }] as const;

    const { data, error, isLoading, isFetching, refetch } = useQuery<ChannelOrdersResponse>({
        queryKey,
        queryFn: async () => {
            if (!enabled) return { data: [], total: 0, page, last_page: 1 };
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
        enabled,
        placeholderData: keepPreviousData,
        staleTime: isConnected ? 45_000 : 7_500,
        refetchOnWindowFocus: false,
        refetchInterval: isConnected ? false : 15_000,
        refetchIntervalInBackground: false,
    });

    return {
        orders: data?.data || [],
        total: data?.total || 0,
        currentPage: data?.page || page,
        lastPage: data?.last_page || 1,
        isLoading,
        isFetching,
        error,
        refresh: async (silent?: boolean) => {
            if (silent) {
                await queryClient.invalidateQueries({ queryKey });
            } else {
                await refetch();
            }
        },
    };
}
