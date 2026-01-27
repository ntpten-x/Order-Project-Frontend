import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useContext, useEffect } from 'react';
import { SocketContext } from '@/contexts/SocketContext';
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
    const { socket } = useContext(SocketContext);
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

    useEffect(() => {
        if (!socket) return;

        const handleOrderUpdate = () => {
            // Invalidate all orders to be safe
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        };

        // Listen for order events
        socket.on("orders:create", handleOrderUpdate);
        socket.on("orders:update", handleOrderUpdate);
        socket.on("orders:delete", handleOrderUpdate);

        return () => {
            socket.off("orders:create", handleOrderUpdate);
            socket.off("orders:update", handleOrderUpdate);
            socket.off("orders:delete", handleOrderUpdate);
        };
    }, [socket, queryClient]);

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
