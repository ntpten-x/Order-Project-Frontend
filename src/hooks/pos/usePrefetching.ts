/**
 * Prefetching Hook
 * Prefetches data that is likely to be used soon
 */

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { ordersService } from "../../services/pos/orders.service";
import { productsService } from "../../services/pos/products.service";
import { categoryService } from "../../services/pos/category.service";
import { orderQueueService } from "../../services/pos/orderQueue.service";

/**
 * Prefetch data when user is likely to navigate to POS pages
 */
export function usePOSPrefetching() {
    const queryClient = useQueryClient();


    useEffect(() => {
        // Prefetch common POS data
        const prefetchData = async () => {
            try {
                // Prefetch products and categories (used in all POS channels)
                const productsPage = 1;
                const productsLimit = 20;
                const productsCategoryKey = "all";

                await Promise.all([
                    queryClient.prefetchQuery({
                        queryKey: ['products', productsPage, productsLimit, productsCategoryKey],
                        queryFn: () => productsService.findAll(productsPage, productsLimit, undefined, new URLSearchParams()),
                        staleTime: 5 * 60 * 1000, // 5 minutes
                    }),
                    queryClient.prefetchQuery({
                        queryKey: ['categories'],
                        queryFn: () => categoryService.findAll(),
                        staleTime: 10 * 60 * 1000, // 10 minutes
                    }),
                ]);
            } catch (error) {
                // Silent fail - prefetching should not break the app
                console.debug('Prefetch failed:', error);
            }
        };

        prefetchData();
    }, [queryClient]);
}

/**
 * Prefetch order data when viewing order list
 */
export function useOrderListPrefetching() {
    const queryClient = useQueryClient();

    useEffect(() => {
        const prefetchData = async () => {
            try {
                // Prefetch first page of orders summary
                await queryClient.prefetchQuery({
                    queryKey: ['ordersSummary', 1, 50, 'all', 'all', ''],
                    queryFn: () => ordersService.getAllSummary(undefined, 1, 50),
                    staleTime: 3000,
                });
            } catch (error) {
                console.debug('Order list prefetch failed:', error);
            }
        };

        prefetchData();
    }, [queryClient]);
}

/**
 * Prefetch queue data when viewing queue page
 */
export function useQueuePrefetching() {
    const queryClient = useQueryClient();

    useEffect(() => {
        const prefetchData = async () => {
            try {
                // Prefetch queue data
                await queryClient.prefetchQuery({
                    queryKey: ['orderQueue', 'all'],
                    queryFn: () => orderQueueService.getAll(),
                    staleTime: 2000,
                });
            } catch (error) {
                console.debug('Queue prefetch failed:', error);
            }
        };

        prefetchData();
    }, [queryClient]);
}

/**
 * Prefetch order details when hovering over order link
 */
export function useOrderDetailsPrefetching(orderId?: string) {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!orderId) return;

        const prefetchData = async () => {
            try {
                await queryClient.prefetchQuery({
                    queryKey: ['order', orderId],
                    queryFn: () => ordersService.getById(orderId),
                    staleTime: 5000,
                });
            } catch (error) {
                console.debug('Order details prefetch failed:', error);
            }
        };

        // Debounce prefetch to avoid too many requests
        const timer = setTimeout(prefetchData, 200);
        return () => clearTimeout(timer);
    }, [orderId, queryClient]);
}
