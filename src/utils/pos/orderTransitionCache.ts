import { SalesOrder } from "../../types/api/pos/salesOrder";

const ORDER_TRANSITION_CACHE_PREFIX = "pos:order-transition:";
const ORDER_TRANSITION_CACHE_TTL_MS = 60_000;

type OrderTransitionCacheEntry = {
    ts: number;
    order: SalesOrder;
};

const isBrowser = () => typeof window !== "undefined";

const getCacheKey = (orderId: string) => `${ORDER_TRANSITION_CACHE_PREFIX}${orderId}`;

export const primeOrderTransitionCache = (order: SalesOrder) => {
    if (!isBrowser() || !order?.id) return;

    try {
        const payload: OrderTransitionCacheEntry = {
            ts: Date.now(),
            order,
        };
        window.sessionStorage.setItem(getCacheKey(order.id), JSON.stringify(payload));
    } catch {
        // Ignore storage write failures and fall back to network fetch.
    }
};

export const consumeOrderTransitionCache = (orderId?: string | null): SalesOrder | null => {
    if (!isBrowser() || !orderId) return null;

    try {
        const key = getCacheKey(orderId);
        const raw = window.sessionStorage.getItem(key);
        if (!raw) return null;

        window.sessionStorage.removeItem(key);

        const parsed = JSON.parse(raw) as OrderTransitionCacheEntry;
        if (!parsed?.ts || !parsed.order) return null;
        if (Date.now() - parsed.ts > ORDER_TRANSITION_CACHE_TTL_MS) return null;

        return parsed.order;
    } catch {
        return null;
    }
};
