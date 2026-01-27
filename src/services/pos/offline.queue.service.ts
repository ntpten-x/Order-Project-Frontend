import { CreateOrderItemDTO, CreateSalesOrderDTO } from "../../types/api/pos/salesOrder";

type OfflinePayloadMap = {
    CREATE_ORDER: CreateSalesOrderDTO;
    ADD_ITEM: { orderId: string; itemData: CreateOrderItemDTO };
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
const MAX_RETRY = 5;

const readQueue = (): OfflineAction[] => {
    if (typeof window === 'undefined') return [];
    const queueString = localStorage.getItem(QUEUE_KEY);
    return queueString ? JSON.parse(queueString) : [];
};

const writeQueue = (data: OfflineAction[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(QUEUE_KEY, JSON.stringify(data));
};

export const offlineQueueService = {
    addToQueue: <T extends OfflineActionType>(type: T, payload: OfflinePayloadMap[T]) => {
        const currentQueue = readQueue();
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
        }
    },

    pruneExceeded: () => {
        const remaining = readQueue().filter(a => a.retryCount <= MAX_RETRY);
        writeQueue(remaining);
    },
};

export const offlineQueuePolicy = {
    maxRetry: MAX_RETRY,
    backoff: (retryCount: number) => Math.min(30000, 2000 * retryCount),
};
