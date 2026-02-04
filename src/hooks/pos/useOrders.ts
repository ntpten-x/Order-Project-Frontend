import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { SalesOrder } from '../../types/api/pos/salesOrder';
import { ordersService } from '../../services/pos/orders.service';

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
}

export function useOrders({ page = 1, limit = 50, status }: UseOrdersParams) {
    const queryClient = useQueryClient();

    // Construct query string for key
    const queryKey = ['orders', page, limit, status || 'all'];

    const { data, error, isLoading, refetch } = useQuery<OrdersResponse>({
        queryKey,
        queryFn: async () => {
            return await ordersService.getAll(undefined, page, limit, status);
        },
        placeholderData: keepPreviousData,
        staleTime: 2000,
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
        isError: error,
        mutate: refetch,
    };
}
