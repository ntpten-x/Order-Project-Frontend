import { useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { SocketContext } from '../../contexts/SocketContext';
import { ORDER_REALTIME_EVENTS } from '../../utils/pos/orderRealtimeEvents';
import { RealtimeEvents } from '../../utils/realtimeEvents';
import {
    shouldDisableInvalidateDebounce,
    trackInvalidateExecuted,
    trackInvalidateRequested
} from '../../utils/pos/invalidateProfiler';
import { OrderStatus, OrderType, SalesOrder, SalesOrderSummary } from '../../types/api/pos/salesOrder';

import { SalesOrderItem } from '../../types/api/pos/salesOrderItem';

type SocketPayload = SalesOrderItem | { id?: string; [key: string]: unknown };
type QueryKeyLike = readonly unknown[];
type OrdersListKey = readonly [
    'orders',
    number?,
    number?,
    string?,
    string?,
    string?,
    string?
];
type OrdersSummaryKey = readonly ['ordersSummary', number?, number?, string?, string?, string?];
type ChannelOrdersKey = readonly [
    'orders',
    'channel',
    OrderType?,
    {
        page?: number;
        limit?: number;
        statusFilter?: string;
    }?
];

interface PaginatedCache<T> {
    data: T[];
    total: number;
    page: number;
    last_page?: number;
}

const INVALIDATION_DEBOUNCE_MS = 200;
const PATCH_FALLBACK_INVALIDATION_MS = 220;

function trackSocketEventReceived(event: string) {
    if (typeof window === "undefined") return;
    const perfWindow = window as Window & { __POS_PERF_SOCKET_EVENTS__?: Record<string, number> };
    if (!perfWindow.__POS_PERF_SOCKET_EVENTS__) {
        perfWindow.__POS_PERF_SOCKET_EVENTS__ = {};
    }
    perfWindow.__POS_PERF_SOCKET_EVENTS__[event] =
        (perfWindow.__POS_PERF_SOCKET_EVENTS__[event] ?? 0) + 1;
}

function isObjectPayload(payload: SocketPayload): payload is Record<string, unknown> {
    return typeof payload === "object" && payload !== null;
}

function extractPayloadId(payload: SocketPayload): string | null {
    if (!isObjectPayload(payload)) return null;
    const id = payload.id;
    return typeof id === "string" && id.trim().length > 0 ? id : null;
}

function extractOrderPayload(payload: SocketPayload): (Partial<SalesOrder> & { id: string }) | null {
    const id = extractPayloadId(payload);
    if (!id || !isObjectPayload(payload)) return null;
    return payload as Partial<SalesOrder> & { id: string };
}

function toNumber(value: unknown, fallback = 0): number {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
}

function toFilterTokens(filter: string | undefined): string[] {
    if (!filter || filter === 'all') return [];
    return filter
        .split(',')
        .map((token) => token.trim().toLowerCase())
        .filter(Boolean);
}

function matchesEnumFilter(filter: string | undefined, value: unknown): boolean {
    const tokens = toFilterTokens(filter);
    if (tokens.length === 0) return true;
    if (typeof value !== 'string') return false;
    return tokens.includes(value.trim().toLowerCase());
}

function matchesSearchPrefix(search: string | undefined, order: Partial<SalesOrder>): boolean {
    const normalizedSearch = (search ?? '').trim().toLowerCase();
    if (!normalizedSearch) return true;

    const orderNo = typeof order.order_no === 'string' ? order.order_no.toLowerCase() : '';
    const deliveryCode = typeof order.delivery_code === 'string' ? order.delivery_code.toLowerCase() : '';
    if (orderNo.startsWith(normalizedSearch)) return true;
    if (deliveryCode.startsWith(normalizedSearch)) return true;
    return false;
}

function getOrdersListPage(key: OrdersListKey): number {
    return typeof key[1] === 'number' && Number.isFinite(key[1]) ? key[1] : 1;
}

function getOrdersListLimit(key: OrdersListKey, oldLength: number): number {
    if (typeof key[2] === 'number' && Number.isFinite(key[2]) && key[2] > 0) {
        return key[2];
    }
    return Math.max(oldLength, 1);
}

function getOrdersListSort(key: OrdersListKey): 'old' | 'new' {
    return key[6] === 'new' ? 'new' : 'old';
}

function canIncludeInOrdersListKey(order: Partial<SalesOrder>, key: OrdersListKey): boolean {
    const statusFilter = typeof key[3] === 'string' ? key[3] : 'all';
    const typeFilter = typeof key[4] === 'string' ? key[4] : 'all';
    const searchFilter = typeof key[5] === 'string' ? key[5] : '';

    return (
        matchesEnumFilter(statusFilter, order.status) &&
        matchesEnumFilter(typeFilter, order.order_type) &&
        matchesSearchPrefix(searchFilter, order)
    );
}

function canIncludeInOrdersSummaryKey(order: Partial<SalesOrder>, key: OrdersSummaryKey): boolean {
    const statusFilter = typeof key[3] === 'string' ? key[3] : 'all';
    const typeFilter = typeof key[4] === 'string' ? key[4] : 'all';
    const searchFilter = typeof key[5] === 'string' ? key[5] : '';

    return (
        matchesEnumFilter(statusFilter, order.status) &&
        matchesEnumFilter(typeFilter, order.order_type) &&
        matchesSearchPrefix(searchFilter, order)
    );
}

function isChannelOptions(value: unknown): value is { page?: number; limit?: number; statusFilter?: string } {
    return typeof value === 'object' && value !== null;
}

function getChannelQueryOptions(key: ChannelOrdersKey): { page: number; limit: number; statusFilter: string } {
    const rawOptions = isChannelOptions(key[3]) ? key[3] : {};

    return {
        page: typeof rawOptions.page === 'number' && Number.isFinite(rawOptions.page) ? rawOptions.page : 1,
        limit: typeof rawOptions.limit === 'number' && Number.isFinite(rawOptions.limit) && rawOptions.limit > 0
            ? rawOptions.limit
            : 100,
        statusFilter: typeof rawOptions.statusFilter === 'string'
            ? rawOptions.statusFilter
            : `${OrderStatus.Pending},${OrderStatus.WaitingForPayment}`,
    };
}

function canIncludeInChannelKey(order: Partial<SalesOrder>, key: ChannelOrdersKey): boolean {
    const orderTypeFilter = key[2];
    const options = getChannelQueryOptions(key);

    if (orderTypeFilter && order.order_type !== orderTypeFilter) return false;
    if (!matchesEnumFilter(options.statusFilter, order.status)) return false;
    return true;
}

function normalizeOrder(order: Partial<SalesOrder> & { id: string }): SalesOrder {
    const nowIso = new Date().toISOString();
    return {
        id: order.id,
        order_no: typeof order.order_no === 'string' ? order.order_no : '',
        order_type: (order.order_type as OrderType) ?? OrderType.TakeAway,
        table_id: (order.table_id as string | null | undefined) ?? null,
        table: order.table ?? null,
        delivery_id: (order.delivery_id as string | null | undefined) ?? null,
        delivery: order.delivery ?? null,
        delivery_code: (order.delivery_code as string | null | undefined) ?? null,
        sub_total: toNumber(order.sub_total),
        discount_id: (order.discount_id as string | null | undefined) ?? null,
        discount: order.discount ?? null,
        discount_amount: toNumber(order.discount_amount),
        vat: toNumber(order.vat),
        total_amount: toNumber(order.total_amount),
        received_amount: toNumber(order.received_amount),
        change_amount: toNumber(order.change_amount),
        status: (order.status as OrderStatus) ?? OrderStatus.Pending,
        created_by_id: (order.created_by_id as string | null | undefined) ?? null,
        created_by: order.created_by ?? null,
        create_date: typeof order.create_date === 'string' ? order.create_date : nowIso,
        update_date: typeof order.update_date === 'string' ? order.update_date : nowIso,
        items: Array.isArray(order.items) ? order.items : [],
        payments: Array.isArray(order.payments) ? order.payments : [],
    };
}

function toOrderSummary(order: SalesOrder): SalesOrderSummary {
    const itemsCount = Array.isArray(order.items)
        ? order.items.reduce((sum, item) => sum + toNumber(item.quantity), 0)
        : 0;

    return {
        id: order.id,
        order_no: order.order_no,
        order_type: order.order_type,
        status: order.status,
        create_date: order.create_date,
        total_amount: toNumber(order.total_amount),
        delivery_code: order.delivery_code ?? null,
        table_id: order.table_id ?? null,
        delivery_id: order.delivery_id ?? null,
        table: order.table?.table_name ? { table_name: order.table.table_name } : null,
        delivery: order.delivery?.delivery_name ? { delivery_name: order.delivery.delivery_name } : null,
        items_count: itemsCount,
    };
}

function isOrdersListKey(key: QueryKeyLike): key is OrdersListKey {
    return key[0] === 'orders' && key[1] !== 'channel';
}

function isOrdersSummaryKey(key: QueryKeyLike): key is OrdersSummaryKey {
    return key[0] === 'ordersSummary';
}

function isOrdersChannelKey(key: QueryKeyLike): boolean {
    return key[0] === 'orders' && key[1] === 'channel';
}

function isTypedOrdersChannelKey(key: QueryKeyLike): key is ChannelOrdersKey {
    return isOrdersChannelKey(key);
}

function hasOrdersListFilters(key: OrdersListKey): boolean {
    const status = typeof key[3] === 'string' ? key[3] : 'all';
    const type = typeof key[4] === 'string' ? key[4] : 'all';
    const query = typeof key[5] === 'string' ? key[5] : '';
    return status !== 'all' || type !== 'all' || query.trim().length > 0;
}

function hasOrdersSummaryFilters(key: OrdersSummaryKey): boolean {
    const status = typeof key[3] === 'string' ? key[3] : 'all';
    const type = typeof key[4] === 'string' ? key[4] : 'all';
    const query = typeof key[5] === 'string' ? key[5] : '';
    return status !== 'all' || type !== 'all' || query.trim().length > 0;
}

export const useOrderSocketEvents = () => {
    const { socket } = useContext(SocketContext);
    const queryClient = useQueryClient();
    const invalidateTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
    const realtimeEvents = useMemo(
        () =>
            Array.from(
                new Set([
                    ...ORDER_REALTIME_EVENTS,
                    RealtimeEvents.tables.create,
                    RealtimeEvents.tables.update,
                    RealtimeEvents.tables.delete,
                ])
            ),
        []
    );

    const scheduleInvalidate = useCallback(
        (queryKey: readonly unknown[], debounceMs = INVALIDATION_DEBOUNCE_MS) => {
            trackInvalidateRequested(queryKey);

            if (shouldDisableInvalidateDebounce()) {
                queryClient.invalidateQueries({ queryKey });
                trackInvalidateExecuted(queryKey);
                return;
            }

            const key = JSON.stringify(queryKey);
            const existing = invalidateTimersRef.current.get(key);
            if (existing) {
                clearTimeout(existing);
            }

            const timer = setTimeout(() => {
                invalidateTimersRef.current.delete(key);
                queryClient.invalidateQueries({ queryKey });
                trackInvalidateExecuted(queryKey);
            }, debounceMs);

            invalidateTimersRef.current.set(key, timer);
        },
        [queryClient]
    );

    const getActiveQueryKeys = useCallback(
        (queryKey: QueryKeyLike): QueryKeyLike[] => {
            return queryClient
                .getQueryCache()
                .findAll({ queryKey, type: "active" })
                .map((query) => query.queryKey as QueryKeyLike);
        },
        [queryClient]
    );

    const scheduleInvalidateActive = useCallback(
        (queryRoot: QueryKeyLike, debounceMs = INVALIDATION_DEBOUNCE_MS) => {
            const activeKeys = getActiveQueryKeys(queryRoot);
            if (activeKeys.length === 0) {
                scheduleInvalidate(queryRoot, debounceMs);
                return;
            }

            activeKeys.forEach((key) => scheduleInvalidate(key, debounceMs));
        },
        [getActiveQueryKeys, scheduleInvalidate]
    );

    const scheduleInvalidateFilteredActive = useCallback(
        (
            queryRoot: QueryKeyLike,
            predicate: (queryKey: QueryKeyLike) => boolean,
            debounceMs = INVALIDATION_DEBOUNCE_MS
        ) => {
            const activeKeys = getActiveQueryKeys(queryRoot);
            if (activeKeys.length === 0) return;
            activeKeys.filter(predicate).forEach((key) => scheduleInvalidate(key, debounceMs));
        },
        [getActiveQueryKeys, scheduleInvalidate]
    );

    const scheduleInvalidateFilteredOrderViews = useCallback(
        (debounceMs = INVALIDATION_DEBOUNCE_MS) => {
            scheduleInvalidateFilteredActive(
                ['orders'],
                (key) => isOrdersListKey(key) && hasOrdersListFilters(key),
                debounceMs
            );
            scheduleInvalidateFilteredActive(
                ['ordersSummary'],
                (key) => isOrdersSummaryKey(key) && hasOrdersSummaryFilters(key),
                debounceMs
            );
            scheduleInvalidateFilteredActive(
                ['orders', 'channel'],
                (key) => isOrdersChannelKey(key),
                debounceMs
            );
        },
        [scheduleInvalidateFilteredActive]
    );

    const patchOrderUpdateCaches = useCallback(
        (payload: SocketPayload): boolean => {
            const orderId = extractPayloadId(payload);
            if (!orderId || !isObjectPayload(payload)) return false;

            let updated = false;
            const patch = payload as Partial<SalesOrder> & { id: string };

            queryClient.setQueriesData<PaginatedCache<SalesOrder>>({ queryKey: ['orders'] }, (oldData) => {
                if (!oldData || !Array.isArray(oldData.data)) return oldData;

                let changed = false;
                const nextItems = oldData.data.map((order) => {
                    if (order.id !== orderId) return order;
                    changed = true;
                    return { ...order, ...patch, id: order.id };
                });

                if (!changed) return oldData;
                updated = true;
                return { ...oldData, data: nextItems };
            });

            queryClient.setQueriesData<PaginatedCache<SalesOrderSummary>>({ queryKey: ['ordersSummary'] }, (oldData) => {
                if (!oldData || !Array.isArray(oldData.data)) return oldData;

                let changed = false;
                const nextItems = oldData.data.map((order) => {
                    if (order.id !== orderId) return order;
                    changed = true;
                    return { ...order, ...patch, id: order.id };
                });

                if (!changed) return oldData;
                updated = true;
                return { ...oldData, data: nextItems };
            });

            queryClient.setQueriesData<SalesOrderSummary[]>({ queryKey: ['orders', 'channel'] }, (oldData) => {
                if (!Array.isArray(oldData)) return oldData;

                let changed = false;
                const nextItems = oldData.map((order) => {
                    if (order.id !== orderId) return order;
                    changed = true;
                    return { ...order, ...patch, id: order.id };
                });

                if (!changed) return oldData;
                updated = true;
                return nextItems;
            });

            return updated;
        },
        [queryClient]
    );

    const patchOrderCreateCaches = useCallback(
        (payload: SocketPayload): boolean => {
            const created = extractOrderPayload(payload);
            if (!created) return false;

            const order = normalizeOrder(created);
            const summary = toOrderSummary(order);
            let updated = false;

            const orderQueries = queryClient.getQueryCache().findAll({ queryKey: ['orders'] });
            orderQueries.forEach((query) => {
                const queryKey = query.queryKey as QueryKeyLike;

                if (isOrdersListKey(queryKey)) {
                    queryClient.setQueryData<PaginatedCache<SalesOrder>>(queryKey, (oldData) => {
                        if (!oldData || !Array.isArray(oldData.data)) return oldData;
                        if (!canIncludeInOrdersListKey(order, queryKey)) return oldData;

                        const exists = oldData.data.some((item) => item.id === order.id);
                        const nextTotal = exists ? oldData.total : oldData.total + 1;
                        let nextData = oldData.data;

                        if (!exists && getOrdersListPage(queryKey) === 1) {
                            const limit = getOrdersListLimit(queryKey, oldData.data.length);
                            const sort = getOrdersListSort(queryKey);
                            if (sort === 'new') {
                                nextData = [order, ...oldData.data].slice(0, limit);
                            } else if (oldData.data.length < limit) {
                                nextData = [...oldData.data, order];
                            }
                        }

                        if (nextData === oldData.data && nextTotal === oldData.total) return oldData;
                        updated = true;
                        return { ...oldData, data: nextData, total: nextTotal };
                    });
                    return;
                }

                if (isTypedOrdersChannelKey(queryKey)) {
                    queryClient.setQueryData<SalesOrderSummary[]>(queryKey, (oldData) => {
                        if (!Array.isArray(oldData)) return oldData;
                        if (!canIncludeInChannelKey(order, queryKey)) return oldData;

                        const exists = oldData.some((item) => item.id === order.id);
                        if (exists) return oldData;

                        const { page, limit } = getChannelQueryOptions(queryKey);
                        if (page !== 1) return oldData;

                        let nextData = oldData;
                        if (oldData.length < limit) {
                            nextData = [...oldData, summary];
                        }

                        if (nextData === oldData) return oldData;
                        updated = true;
                        return nextData;
                    });
                }
            });

            const summaryQueries = queryClient.getQueryCache().findAll({ queryKey: ['ordersSummary'] });
            summaryQueries.forEach((query) => {
                const queryKey = query.queryKey as QueryKeyLike;
                if (!isOrdersSummaryKey(queryKey)) return;

                queryClient.setQueryData<PaginatedCache<SalesOrderSummary>>(queryKey, (oldData) => {
                    if (!oldData || !Array.isArray(oldData.data)) return oldData;
                    if (!canIncludeInOrdersSummaryKey(order, queryKey)) return oldData;

                    const exists = oldData.data.some((item) => item.id === order.id);
                    const nextTotal = exists ? oldData.total : oldData.total + 1;
                    let nextData = oldData.data;

                    if (!exists && (typeof queryKey[1] !== 'number' || queryKey[1] === 1)) {
                        const limit =
                            typeof queryKey[2] === 'number' && queryKey[2] > 0
                                ? queryKey[2]
                                : Math.max(oldData.data.length, 1);
                        if (oldData.data.length < limit) {
                            nextData = [...oldData.data, summary];
                        }
                    }

                    if (nextData === oldData.data && nextTotal === oldData.total) return oldData;
                    updated = true;
                    return { ...oldData, data: nextData, total: nextTotal };
                });
            });

            return updated;
        },
        [queryClient]
    );

    const patchOrderDeleteCaches = useCallback(
        (payload: SocketPayload): boolean => {
            const orderId = extractPayloadId(payload);
            if (!orderId) return false;

            let updated = false;

            const orderQueries = queryClient.getQueryCache().findAll({ queryKey: ['orders'] });
            orderQueries.forEach((query) => {
                const queryKey = query.queryKey as QueryKeyLike;

                if (isOrdersListKey(queryKey)) {
                    queryClient.setQueryData<PaginatedCache<SalesOrder>>(queryKey, (oldData) => {
                        if (!oldData || !Array.isArray(oldData.data)) return oldData;

                        const nextData = oldData.data.filter((item) => item.id !== orderId);
                        if (nextData.length === oldData.data.length) return oldData;

                        updated = true;
                        return {
                            ...oldData,
                            data: nextData,
                            total: Math.max(0, oldData.total - 1),
                        };
                    });
                    return;
                }

                if (isTypedOrdersChannelKey(queryKey)) {
                    queryClient.setQueryData<SalesOrderSummary[]>(queryKey, (oldData) => {
                        if (!Array.isArray(oldData)) return oldData;
                        const nextData = oldData.filter((item) => item.id !== orderId);
                        if (nextData.length === oldData.length) return oldData;
                        updated = true;
                        return nextData;
                    });
                }
            });

            const summaryQueries = queryClient.getQueryCache().findAll({ queryKey: ['ordersSummary'] });
            summaryQueries.forEach((query) => {
                const queryKey = query.queryKey as QueryKeyLike;
                if (!isOrdersSummaryKey(queryKey)) return;

                queryClient.setQueryData<PaginatedCache<SalesOrderSummary>>(queryKey, (oldData) => {
                    if (!oldData || !Array.isArray(oldData.data)) return oldData;
                    const nextData = oldData.data.filter((item) => item.id !== orderId);
                    if (nextData.length === oldData.data.length) return oldData;

                    updated = true;
                    return {
                        ...oldData,
                        data: nextData,
                        total: Math.max(0, oldData.total - 1),
                    };
                });
            });

            return updated;
        },
        [queryClient]
    );

    useEffect(() => {
        const timers = invalidateTimersRef.current;
        return () => {
            timers.forEach((timer) => clearTimeout(timer));
            timers.clear();
        };
    }, []);

    useEffect(() => {
        if (!socket) return;

        const handleSocketEvent = (event: string, data: SocketPayload) => {
            trackSocketEventReceived(event);

            const isSalesOrderItemEvent = event.startsWith("salesOrderItem:");
            const isOrderEvent =
                event.startsWith("orders:") ||
                event.startsWith("payments:") ||
                event.startsWith("salesOrderDetail:") ||
                event.startsWith("order-queue:") ||
                isSalesOrderItemEvent;
            const isOrdersUpdateEvent = event === RealtimeEvents.orders.update;
            const isOrdersCreateEvent = event === RealtimeEvents.orders.create;
            const isOrdersDeleteEvent = event === RealtimeEvents.orders.delete;
            const isTableEvent = event.startsWith("tables:");
            const didPatchOrderUpdateCache = isOrdersUpdateEvent ? patchOrderUpdateCaches(data) : false;
            const didPatchOrderCreateCache = isOrdersCreateEvent ? patchOrderCreateCaches(data) : false;
            const didPatchOrderDeleteCache = isOrdersDeleteEvent ? patchOrderDeleteCaches(data) : false;

            // 1. Handle Kitchen Display System (KDS) specific updates mostly without refetching
            if (isSalesOrderItemEvent) {
                // Type guard for SalesOrderItem
                const isItem = (d: SocketPayload): d is SalesOrderItem => {
                    return typeof d === 'object' && d !== null && 'order_id' in d;
                };

                if (isItem(data)) {
                    queryClient.setQueryData<SalesOrderItem[]>(['orderItems', 'kitchen'], (oldData = []) => {
                        if (!Array.isArray(oldData)) return oldData;

                        switch (event) {
                            case RealtimeEvents.salesOrderItem.create:
                                // Check if item already exists to avoid duplication
                                if (oldData.some(item => item.id === data.id)) return oldData;
                                // Only add if it matches KDS criteria (Pending/Cooking) - logic duplicated from page slightly
                                // safely we can append it, the page sort will handle it
                                return [...oldData, data];

                            case RealtimeEvents.salesOrderItem.update:
                                return oldData.map(item => item.id === data.id ? { ...item, ...data } : item);

                            case RealtimeEvents.salesOrderItem.delete:
                                return oldData.filter(item => item.id !== data.id);

                            default:
                                return oldData;
                        }
                    });
                }

                // Channel stats are already updated via orders/payments listeners.
                // Skip direct salesOrderItem-driven channelStats invalidation to avoid duplicates.
            }

            // 2. Global invalidation for key order views (batched to avoid refetch bursts)
            if (isOrderEvent) {
                const didPatchOrderCache =
                    didPatchOrderUpdateCache || didPatchOrderCreateCache || didPatchOrderDeleteCache;
                const fallbackDebounce = didPatchOrderCache
                    ? PATCH_FALLBACK_INVALIDATION_MS
                    : INVALIDATION_DEBOUNCE_MS;

                if (isOrdersUpdateEvent && didPatchOrderUpdateCache) {
                    scheduleInvalidateFilteredActive(
                        ['orders'],
                        (key) => isOrdersListKey(key) && hasOrdersListFilters(key),
                        fallbackDebounce
                    );
                    scheduleInvalidateFilteredActive(
                        ['ordersSummary'],
                        (key) => isOrdersSummaryKey(key) && hasOrdersSummaryFilters(key),
                        fallbackDebounce
                    );
                    scheduleInvalidateFilteredActive(
                        ['orders', 'channel'],
                        (key) => isOrdersChannelKey(key),
                        fallbackDebounce
                    );
                } else if (
                    (isOrdersCreateEvent && didPatchOrderCreateCache) ||
                    (isOrdersDeleteEvent && didPatchOrderDeleteCache)
                ) {
                    scheduleInvalidateFilteredOrderViews(fallbackDebounce);
                } else {
                    scheduleInvalidateActive(['orders'], fallbackDebounce);
                    scheduleInvalidateActive(['ordersSummary'], fallbackDebounce);
                    if (isOrdersUpdateEvent || isOrdersCreateEvent || isOrdersDeleteEvent) {
                        scheduleInvalidateActive(['orders', 'channel'], fallbackDebounce);
                    }
                }
            }

            if (isTableEvent) {
                scheduleInvalidateActive(['tables']);
            }

            // Fallback for kitchen if we didn't handle it manually (e.g. bulk updates) or just to be safe eventual consistency
            if (isOrderEvent && !isSalesOrderItemEvent) {
                scheduleInvalidateActive(['orderItems', 'kitchen']);
            }
        };

        const listeners: Array<{ event: string; handler: (data: SocketPayload) => void }> = [];

        realtimeEvents.forEach((event) => {
            const handler = (data: SocketPayload) => handleSocketEvent(event, data);
            socket.on(event, handler);
            listeners.push({ event, handler });
        });

        return () => {
            listeners.forEach(({ event, handler }) => {
                socket.off(event, handler);
            });
        };
    }, [
        socket,
        queryClient,
        patchOrderUpdateCaches,
        patchOrderCreateCaches,
        patchOrderDeleteCaches,
        realtimeEvents,
        scheduleInvalidate,
        scheduleInvalidateActive,
        scheduleInvalidateFilteredActive,
        scheduleInvalidateFilteredOrderViews,
    ]);
};
