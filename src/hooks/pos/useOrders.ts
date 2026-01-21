import useSWR from 'swr';
import { useContext, useEffect } from 'react';
import { SocketContext } from '@/contexts/SocketContext';
import { SalesOrder } from '../../types/api/pos/salesOrder';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface UseOrdersParams {
    page?: number;
    limit?: number;
    status?: string;
}

export function useOrders({ page = 1, limit = 50, status }: UseOrdersParams) {
    const { socket } = useContext(SocketContext);

    // Construct query string
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (status) params.append('status', status);

    const { data, error, isLoading, mutate } = useSWR<{ data: SalesOrder[], total: number, page: number, last_page: number }>(
        `/api/pos/orders?${params.toString()}`,
        fetcher,
        {
            revalidateOnFocus: true,
            dedupingInterval: 2000,
            keepPreviousData: true,
        }
    );

    useEffect(() => {
        if (!socket) return;

        const handleOrderUpdate = () => {
            mutate();
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
    }, [socket, mutate]);

    return {
        orders: data?.data || [],
        total: data?.total || 0,
        currentPage: data?.page || 1,
        lastPage: data?.last_page || 1,
        isLoading,
        isError: error,
        mutate,
    };
}
