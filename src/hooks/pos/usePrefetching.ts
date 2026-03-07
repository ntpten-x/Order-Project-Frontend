/**
 * Prefetching Hook
 * Prefetches data that is likely to be used soon
 */

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { ordersService } from "../../services/pos/orders.service";
import { productsService } from "../../services/pos/products.service";
import { categoryService } from "../../services/pos/category.service";
import { deliveryService } from "../../services/pos/delivery.service";
import { tablesService } from "../../services/pos/tables.service";
import { shopProfileService } from "../../services/pos/shopProfile.service";

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
                        meta: { trackGlobalLoading: false },
                    }),
                    queryClient.prefetchQuery({
                        queryKey: ['categories'],
                        queryFn: () => categoryService.findAll(),
                        staleTime: 10 * 60 * 1000, // 10 minutes
                        meta: { trackGlobalLoading: false },
                    }),
                    queryClient.prefetchQuery({
                        queryKey: ['channelStats'],
                        queryFn: () => ordersService.getStats(undefined),
                        staleTime: 30 * 1000,
                        meta: { trackGlobalLoading: false },
                    }),
                    queryClient.prefetchQuery({
                        queryKey: ['tables'],
                        queryFn: async () => (await tablesService.getAll()).data,
                        staleTime: 45 * 1000,
                        meta: { trackGlobalLoading: false },
                    }),
                    queryClient.prefetchQuery({
                        queryKey: ['delivery'],
                        queryFn: async () => (await deliveryService.getAll()).data,
                        staleTime: 45 * 1000,
                        meta: { trackGlobalLoading: false },
                    }),
                    queryClient.prefetchQuery({
                        queryKey: ['shopProfile'],
                        queryFn: () => shopProfileService.getProfile(),
                        staleTime: 5 * 60 * 1000,
                        meta: { trackGlobalLoading: false },
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
    const defaultSort = "old" as const;

    useEffect(() => {
        const prefetchData = async () => {
            try {
                // Prefetch first page of orders summary
                await queryClient.prefetchQuery({
                    queryKey: ['ordersSummary', 1, 50, 'all', 'all', '', defaultSort],
                    queryFn: () => ordersService.getAllSummary(undefined, 1, 50, undefined, undefined, undefined, defaultSort),
                    staleTime: 3000,
                    meta: { trackGlobalLoading: false },
                });
            } catch (error) {
                console.debug('Order list prefetch failed:', error);
            }
        };

        prefetchData();
    }, [defaultSort, queryClient]);
}
