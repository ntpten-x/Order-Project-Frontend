import { CreateOrderItemDTO, CreateSalesOrderDTO, UpdateSalesOrderDTO } from "../../types/api/pos/salesOrder";

type OfflinePayloadMap = {
    CREATE_ORDER: CreateSalesOrderDTO;
    UPDATE_ORDER: { orderId: string; data: UpdateSalesOrderDTO };
    ADD_ITEM: { orderId: string; itemData: CreateOrderItemDTO };
    UPDATE_ITEM: { orderId: string; itemId: string; itemData: Partial<CreateOrderItemDTO> };
    DELETE_ITEM: { orderId: string; itemId: string };
    PAYMENT: { orderId: string; paymentData: { payment_method_id: string; amount: number; amount_received?: number } };
};

type OfflineActionType = keyof OfflinePayloadMap;

export type OfflineAction = {
    [K in OfflineActionType]: {
        id: string;
        type: K;
        payload: OfflinePayloadMap[K];
        timestamp: number;
        retryCount: number;
        lastError?: string;
    }
}[OfflineActionType];

const QUEUE_KEY = 'pos_offline_queue';
const QUEUE_EVENT = 'pos:offline-queue:changed';
const MAX_RETRY = 5;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const readQueue = (): OfflineAction[] => {
    if (typeof window === 'undefined') return [];
    try {
        const queueString = localStorage.getItem(QUEUE_KEY);
        return queueString ? JSON.parse(queueString) : [];
    } catch {
        localStorage.removeItem(QUEUE_KEY);
        return [];
    }
};

const pruneOld = (items: OfflineAction[]) => {
    const now = Date.now();
    return items.filter(item => now - item.timestamp <= MAX_AGE_MS);
};

const writeQueue = (data: OfflineAction[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(QUEUE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent(QUEUE_EVENT));
};

const emitQueueEvent = () => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(QUEUE_EVENT));
};

export type OfflineQueueStats = {
    total: number;
    retriable: number;
    failed: number;
    oldestTimestamp: number | null;
    latestTimestamp: number | null;
    byType: Record<OfflineActionType, number>;
};

const buildStats = (items: OfflineAction[]): OfflineQueueStats => {
    const byType = {
        CREATE_ORDER: 0,
        UPDATE_ORDER: 0,
        ADD_ITEM: 0,
        UPDATE_ITEM: 0,
        DELETE_ITEM: 0,
        PAYMENT: 0,
    } satisfies Record<OfflineActionType, number>;

    let oldestTimestamp: number | null = null;
    let latestTimestamp: number | null = null;
    let failed = 0;

    for (const item of items) {
        byType[item.type] += 1;
        if (item.retryCount > MAX_RETRY) {
            failed += 1;
        }
        oldestTimestamp =
            oldestTimestamp === null ? item.timestamp : Math.min(oldestTimestamp, item.timestamp);
        latestTimestamp =
            latestTimestamp === null ? item.timestamp : Math.max(latestTimestamp, item.timestamp);
    }

    return {
        total: items.length,
        retriable: items.filter((item) => item.retryCount <= MAX_RETRY).length,
        failed,
        oldestTimestamp,
        latestTimestamp,
        byType,
    };
};

export const offlineQueueService = {
    addToQueue: <T extends OfflineActionType>(type: T, payload: OfflinePayloadMap[T]) => {
        const currentQueue = pruneOld(readQueue());
        const newAction = {
            id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type,
            payload,
            timestamp: Date.now(),
            retryCount: 0,
        } as OfflineAction;
        const updatedQueue = [...currentQueue, newAction];
        writeQueue(updatedQueue);
        return newAction;
    },

    getQueue: (): OfflineAction[] => readQueue(),

    getStats: (): OfflineQueueStats => buildStats(readQueue()),

    removeFromQueue: (id: string) => {
        const updatedQueue = readQueue().filter(action => action.id !== id);
        writeQueue(updatedQueue);
    },

    incrementRetry: (id: string, error?: string) => {
        const updated = readQueue().map(action =>
            action.id === id
                ? { ...action, retryCount: action.retryCount + 1, lastError: error }
                : action
        );
        writeQueue(updated);
    },

    clearQueue: () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(QUEUE_KEY);
            emitQueueEvent();
        }
    },

    pruneExceeded: () => {
        const remaining = pruneOld(readQueue()).filter(a => a.retryCount <= MAX_RETRY);
        writeQueue(remaining);
    },

    subscribe: (listener: () => void) => {
        if (typeof window === 'undefined') {
            return () => undefined;
        }

        const handleStorage = (event: StorageEvent) => {
            if (!event.key || event.key === QUEUE_KEY) {
                listener();
            }
        };

        window.addEventListener(QUEUE_EVENT, listener);
        window.addEventListener('storage', handleStorage);

        return () => {
            window.removeEventListener(QUEUE_EVENT, listener);
            window.removeEventListener('storage', handleStorage);
        };
    },
};

export const offlineQueuePolicy = {
    maxRetry: MAX_RETRY,
    backoff: (retryCount: number) => Math.min(30000, 2000 * retryCount),
};
