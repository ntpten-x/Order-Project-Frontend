import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useContext } from 'react';
import { SalesOrder } from '../../types/api/pos/salesOrder';
import { ordersService } from '../../services/pos/orders.service';
import { SocketContext } from '../../contexts/SocketContext';

interface OrdersResponse {
    data: SalesOrder[];
    total: number;
    page: number;
    last_page: number;
}

interface UseOrdersParams {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    query?: string;
    sortCreated?: "old" | "new";
}

export function useOrders({ page = 1, limit = 50, status, type, query, sortCreated = "old" }: UseOrdersParams) {
    const { isConnected } = useContext(SocketContext);
    // Construct query string for key
    const queryKey = ['orders', page, limit, status || 'all', type || 'all', query || '', sortCreated];

    const { data, error, isLoading, isFetching, refetch } = useQuery<OrdersResponse>({
        queryKey,
        queryFn: async () => {
            return await ordersService.getAll(undefined, page, limit, status, type, query, sortCreated);
        },
        placeholderData: keepPreviousData,
        // Socket events invalidate this query globally; keep fallback stale window for disconnected clients.
        staleTime: isConnected ? 30_000 : 7_500,
    });

    // Socket logic moved to global useOrderSocketEvents hook
    // to prevent code duplication and multiple listeners
    // The query cache 'orders' is invalidated centrally there.

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
