import useSWR from 'swr';
import { useContext, useEffect } from 'react';
import { SocketContext } from '@/contexts/SocketContext';
import { Products } from '../../types/api/pos/products';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useProducts(page: number = 1, limit: number = 20, categoryId?: string) {
    const { socket } = useContext(SocketContext);

    const { data, error, isLoading, mutate } = useSWR<{ data: Products[], total: number, page: number, last_page: number }>(
        `/api/pos/products?page=${page}&limit=${limit}&category_id=${categoryId || ''}`,
        fetcher,
        {
            revalidateOnFocus: true,
            dedupingInterval: 2000,
            keepPreviousData: true,
        }
    );

    useEffect(() => {
        if (!socket) return;

        const handleProductUpdate = () => {
            mutate();
        };

        // Listen for product events
        socket.on("products:create", handleProductUpdate);
        socket.on("products:update", handleProductUpdate);
        socket.on("products:delete", handleProductUpdate);

        // Listen for stock updates if applicable (optional, depending on backend events)
        socket.on("stock:update", handleProductUpdate);

        return () => {
            socket.off("products:create", handleProductUpdate);
            socket.off("products:update", handleProductUpdate);
            socket.off("products:delete", handleProductUpdate);
            socket.off("stock:update", handleProductUpdate);
        };
    }, [socket, mutate]);

    return {
        products: data?.data || [],
        total: data?.total || 0,
        currentPage: data?.page || 1,
        lastPage: data?.last_page || 1,
        isLoading,
        isError: error,
        mutate,
    };
}
