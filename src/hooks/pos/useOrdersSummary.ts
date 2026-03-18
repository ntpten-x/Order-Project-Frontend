import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useContext } from 'react';

import { SocketContext } from '../../contexts/SocketContext';
import { ordersService } from '../../services/pos/orders.service';
import { SalesOrderSummary } from '../../types/api/pos/salesOrder';

interface OrdersSummaryResponse {
    data: SalesOrderSummary[];
    total: number;
    page: number;
    last_page?: number;
}

interface UseOrdersSummaryParams {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    query?: string;
    sortCreated?: "old" | "new";
    enabled?: boolean;
}

export function useOrdersSummary({
    page = 1,
    limit = 50,
    status,
    type,
    query,
    sortCreated = "old",
    enabled = true,
}: UseOrdersSummaryParams) {
    const { isConnected } = useContext(SocketContext);
    const queryKey = ['ordersSummary', page, limit, status || 'all', type || 'all', query || '', sortCreated] as const;

    const { data, error, isLoading, isFetching, refetch } = useQuery<OrdersSummaryResponse>({
        queryKey,
        queryFn: async () => {
            return ordersService.getAllSummary(undefined, page, limit, status, type, query, sortCreated);
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
        currentPage: data?.page || 1,
        lastPage: data?.last_page || 1,
        isLoading,
        isFetching,
        isError: error,
        refetch,
    };
}
