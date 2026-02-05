import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useContext, useEffect } from 'react';
import { SocketContext } from '../../contexts/SocketContext';
import { Products } from '../../types/api/pos/products';
import { productsService } from '../../services/pos/products.service';
import { RealtimeEvents } from '../../utils/realtimeEvents';

// Define the response type matches the API
interface ProductsResponse {
    data: Products[];
    total: number;
    page: number;
    last_page: number;
}

type DeletePayload = { id?: string } | string | { data?: { id?: string } };

const resolveDeleteId = (payload: DeletePayload): string | undefined => {
    if (typeof payload === "string") return payload;
    if (payload && typeof payload === "object") {
        if ("id" in payload && payload.id) return payload.id;
        if ("data" in payload && payload.data?.id) return payload.data.id;
    }
    return undefined;
};



export function useProducts(page: number = 1, limit: number = 20, categoryId?: string, query?: string) {
    const { socket } = useContext(SocketContext);
    const queryClient = useQueryClient();
    // Use 'all' for undefined categoryId to ensure consistent cache key
    const queryKey = ['products', page, limit, categoryId || 'all', query || ''];

    const { data, error, isLoading, refetch } = useQuery<ProductsResponse>({
        queryKey,
        queryFn: async () => {
            // Note: productsService.findAll expects page, limit, cookie, searchParams
            // We can pass search params for category_id
            // When categoryId is undefined, don't add category_id param to show all products
            const searchParams = new URLSearchParams();
            if (categoryId) {
                searchParams.append("category_id", categoryId);
            }
            const normalizedQuery = query?.trim();
            if (normalizedQuery) {
                searchParams.append("q", normalizedQuery);
            }

            const result = await productsService.findAll(page, limit, undefined, searchParams);
            return result;
        },
        placeholderData: keepPreviousData,
        staleTime: 30_000,
    });

    useEffect(() => {
        if (!socket) return;

        const matchesCategory = (queryCategory: unknown, productCategoryId: unknown) => {
            if (queryCategory === "all") return true;
            if (typeof queryCategory !== "string") return true;
            return typeof productCategoryId === "string" && productCategoryId === queryCategory;
        };

        const invalidatePageOne = (product?: Products) => {
            queryClient.invalidateQueries({
                predicate: (q) => {
                    if (q.queryKey[0] !== "products") return false;
                    const qPage = q.queryKey[1];
                    const qCategory = q.queryKey[3];
                    if (qPage !== 1) return false;
                    if (!product) return true;
                    return matchesCategory(qCategory, product.category_id);
                },
            });
        };

        const handleCreate = (created: Products) => {
            invalidatePageOne(created);
        };

        const handleUpdate = (updated: Products) => {
            const queries = queryClient.getQueriesData<ProductsResponse>({ queryKey: ["products"] });
            for (const [key, value] of queries) {
                if (!value) continue;
                const qCategory = (key as unknown[])[3];
                if (!matchesCategory(qCategory, updated.category_id)) continue;

                const index = value.data.findIndex((p) => p.id === updated.id);
                if (index === -1) continue;

                const next = [...value.data];
                next[index] = updated;
                queryClient.setQueryData<ProductsResponse>(key, { ...value, data: next });
            }
        };

        const handleDelete = (payload: DeletePayload) => {
            const id = resolveDeleteId(payload);
            if (!id) return;

            const queries = queryClient.getQueriesData<ProductsResponse>({ queryKey: ["products"] });
            for (const [key, value] of queries) {
                if (!value) continue;
                if (!value.data.some((p) => p.id === id)) continue;

                queryClient.setQueryData<ProductsResponse>(key, {
                    ...value,
                    data: value.data.filter((p) => p.id !== id),
                    total: Math.max((value.total || 0) - 1, 0),
                });

                queryClient.invalidateQueries({ queryKey: key, exact: true });
            }
        };

        const handleStockUpdate = () => invalidatePageOne();

        // Listen for product events
        socket.on(RealtimeEvents.products.create, handleCreate);
        socket.on(RealtimeEvents.products.update, handleUpdate);
        socket.on(RealtimeEvents.products.delete, handleDelete);

        // Listen for stock updates if applicable (optional, depending on backend events)
        socket.on(RealtimeEvents.stock.update, handleStockUpdate);

        return () => {
            socket.off(RealtimeEvents.products.create, handleCreate);
            socket.off(RealtimeEvents.products.update, handleUpdate);
            socket.off(RealtimeEvents.products.delete, handleDelete);
            socket.off(RealtimeEvents.stock.update, handleStockUpdate);
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
