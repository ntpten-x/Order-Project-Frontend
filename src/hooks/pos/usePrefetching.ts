/**
 * Prefetching Hook
 * Prefetches data that is likely to be used soon
 */

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { ordersService } from "../../services/pos/orders.service";
import { productsService } from "../../services/pos/products.service";
import { categoryService } from "../../services/pos/category.service";
import { deliveryService } from "../../services/pos/delivery.service";
import { tablesService } from "../../services/pos/tables.service";

const DEFAULT_ORDERS_LIMIT = 20;
const DEFAULT_CREATED_SORT = "old" as const;
const DEFAULT_ORDERS_STATUS = "Pending,WaitingForPayment";

function hasFreshQueryData(queryClient: ReturnType<typeof useQueryClient>, queryKey: readonly unknown[]): boolean {
    const state = queryClient.getQueryState(queryKey);
    return Boolean(state?.data || state?.fetchStatus === "fetching");
}

/**
 * Prefetch data when user is likely to navigate to POS pages
 */
export function usePOSPrefetching() {
    const queryClient = useQueryClient();
    const pathname = usePathname();

    useEffect(() => {
        const shouldPrefetch =
            pathname === "/pos" ||
            pathname === "/pos/orders" ||
            pathname.startsWith("/pos/channels");

        if (!shouldPrefetch) {
            return;
        }

        const highPriorityTasks: Array<() => Promise<unknown>> = [];
        const secondaryTasks: Array<() => Promise<unknown>> = [];

        const addTask = (
            queue: Array<() => Promise<unknown>>,
            queryKey: readonly unknown[],
            task: () => Promise<unknown>
        ) => {
            if (hasFreshQueryData(queryClient, queryKey)) {
                return;
            }
            queue.push(task);
        };

        addTask(
            highPriorityTasks,
            ["channelStats"],
            () =>
                queryClient.prefetchQuery({
                    queryKey: ["channelStats"],
                    queryFn: () => ordersService.getStats(undefined),
                    staleTime: 30 * 1000,
                    meta: { trackGlobalLoading: false },
                })
        );

        if (pathname === "/pos" || pathname === "/pos/orders") {
            addTask(
                highPriorityTasks,
                ["ordersSummary", 1, DEFAULT_ORDERS_LIMIT, DEFAULT_ORDERS_STATUS, "all", "", DEFAULT_CREATED_SORT],
                () =>
                    queryClient.prefetchQuery({
                        queryKey: ["ordersSummary", 1, DEFAULT_ORDERS_LIMIT, DEFAULT_ORDERS_STATUS, "all", "", DEFAULT_CREATED_SORT],
                        queryFn: () =>
                            ordersService.getAllSummary(
                                undefined,
                                1,
                                DEFAULT_ORDERS_LIMIT,
                                DEFAULT_ORDERS_STATUS,
                                undefined,
                                undefined,
                                DEFAULT_CREATED_SORT
                            ),
                        staleTime: 30 * 1000,
                        meta: { trackGlobalLoading: false },
                    })
            );
        }

        if (pathname === "/pos") {
            addTask(
                secondaryTasks,
                ["products", 1, DEFAULT_ORDERS_LIMIT, "all", ""],
                () =>
                    queryClient.prefetchQuery({
                        queryKey: ["products", 1, DEFAULT_ORDERS_LIMIT, "all", ""],
                        queryFn: () => productsService.findAll(1, DEFAULT_ORDERS_LIMIT, undefined, new URLSearchParams()),
                        staleTime: 5 * 60 * 1000,
                        meta: { trackGlobalLoading: false },
                    })
            );
            addTask(
                secondaryTasks,
                ["categories"],
                () =>
                    queryClient.prefetchQuery({
                        queryKey: ["categories"],
                        queryFn: () => categoryService.findAll(),
                        staleTime: 10 * 60 * 1000,
                        meta: { trackGlobalLoading: false },
                    })
            );
        }

        if (pathname.startsWith("/pos/channels/dine-in")) {
            addTask(
                secondaryTasks,
                ["tables"],
                () =>
                    queryClient.prefetchQuery({
                        queryKey: ["tables"],
                        queryFn: async () => (await tablesService.getAll()).data,
                        staleTime: 45 * 1000,
                        meta: { trackGlobalLoading: false },
                    })
            );
        }

        if (pathname.startsWith("/pos/channels/takeaway")) {
            addTask(
                secondaryTasks,
                ["products", 1, DEFAULT_ORDERS_LIMIT, "all", ""],
                () =>
                    queryClient.prefetchQuery({
                        queryKey: ["products", 1, DEFAULT_ORDERS_LIMIT, "all", ""],
                        queryFn: () => productsService.findAll(1, DEFAULT_ORDERS_LIMIT, undefined, new URLSearchParams()),
                        staleTime: 5 * 60 * 1000,
                        meta: { trackGlobalLoading: false },
                    })
            );
            addTask(
                secondaryTasks,
                ["categories"],
                () =>
                    queryClient.prefetchQuery({
                        queryKey: ["categories"],
                        queryFn: () => categoryService.findAll(),
                        staleTime: 10 * 60 * 1000,
                        meta: { trackGlobalLoading: false },
                    })
            );
        }

        if (pathname.startsWith("/pos/channels/delivery")) {
            addTask(
                secondaryTasks,
                ["delivery"],
                () =>
                    queryClient.prefetchQuery({
                        queryKey: ["delivery"],
                        queryFn: async () => (await deliveryService.getAll()).data,
                        staleTime: 45 * 1000,
                        meta: { trackGlobalLoading: false },
                    })
            );
        }

        const prefetchData = async () => {
            try {
                for (const task of highPriorityTasks) {
                    await task();
                }
                if (secondaryTasks.length > 0) {
                    await Promise.allSettled(secondaryTasks.map((task) => task()));
                }
            } catch (error) {
                // Silent fail - prefetching should not break the app
                console.debug('Prefetch failed:', error);
            }
        };

        let cancelled = false;
        const runPrefetch = () => {
            if (!cancelled) {
                void prefetchData();
            }
        };

        const idleCallback =
            typeof window !== "undefined" && "requestIdleCallback" in window
                ? window.requestIdleCallback(runPrefetch, { timeout: 1500 })
                : null;
        const timeoutId =
            idleCallback === null
                ? window.setTimeout(runPrefetch, 800)
                : null;

        return () => {
            cancelled = true;
            if (idleCallback !== null && typeof window !== "undefined" && "cancelIdleCallback" in window) {
                window.cancelIdleCallback(idleCallback);
            }
            if (timeoutId !== null) {
                window.clearTimeout(timeoutId);
            }
        };
    }, [pathname, queryClient]);
}

/**
 * Prefetch order data when viewing order list
 */
export function useOrderListPrefetching() {
    const queryClient = useQueryClient();

    useEffect(() => {
        const prefetchData = async () => {
            try {
                const queryKey = ['ordersSummary', 1, DEFAULT_ORDERS_LIMIT, DEFAULT_ORDERS_STATUS, 'all', '', DEFAULT_CREATED_SORT] as const;
                if (hasFreshQueryData(queryClient, queryKey)) {
                    return;
                }

                await queryClient.prefetchQuery({
                    queryKey,
                    queryFn: () =>
                        ordersService.getAllSummary(
                            undefined,
                            1,
                            DEFAULT_ORDERS_LIMIT,
                            DEFAULT_ORDERS_STATUS,
                            undefined,
                            undefined,
                            DEFAULT_CREATED_SORT
                        ),
                    staleTime: 30 * 1000,
                    meta: { trackGlobalLoading: false },
                });
            } catch (error) {
                console.debug('Order list prefetch failed:', error);
            }
        };

        prefetchData();
    }, [queryClient]);
}
