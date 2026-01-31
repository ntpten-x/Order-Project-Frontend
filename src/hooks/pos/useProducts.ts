import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useContext, useEffect } from 'react';
import { SocketContext } from '../../contexts/SocketContext';
import { Products } from '../../types/api/pos/products';
import { productsService } from '../../services/pos/products.service';

// Define the response type matches the API
interface ProductsResponse {
    data: Products[];
    total: number;
    page: number;
    last_page: number;
}



export function useProducts(page: number = 1, limit: number = 20, categoryId?: string) {
    const { socket } = useContext(SocketContext);
    const queryClient = useQueryClient();
    const queryKey = ['products', page, limit, categoryId];

    const { data, error, isLoading, refetch } = useQuery<ProductsResponse>({
        queryKey,
        queryFn: async () => {
            // Note: productsService.findAll expects page, limit, cookie, searchParams
            // We can pass search params for category_id
            const searchParams = new URLSearchParams();
            if (categoryId) searchParams.append("category_id", categoryId);

            const result = await productsService.findAll(page, limit, undefined, searchParams);
            return result;
        },
        placeholderData: keepPreviousData,
        staleTime: 2000, // Matching SWR dedupingInterval as staleTime rough equivalent
    });

    useEffect(() => {
        if (!socket) return;

        const handleProductUpdate = () => {
            // Invalidate all product queries to refresh lists
            queryClient.invalidateQueries({ queryKey: ['products'] });
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
    }, [socket, queryClient]);

    return {
        products: data?.data || [],
        total: data?.total || 0,
        currentPage: data?.page || 1,
        lastPage: data?.last_page || 1,
        isLoading,
        isError: error,
        mutate: refetch, // Mapping refetch to mutate for compatibility, though invalidation is better
    };
}
