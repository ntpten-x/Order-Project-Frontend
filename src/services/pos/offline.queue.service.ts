import { CreateOrderItemDTO, CreateSalesOrderDTO, UpdateSalesOrderDTO } from "../../types/api/pos/salesOrder";
import { QueueStatus } from "../../types/api/pos/orderQueue";

type OfflinePayloadMap = {
    CREATE_ORDER: CreateSalesOrderDTO;
    UPDATE_ORDER: { orderId: string; data: UpdateSalesOrderDTO };
    ADD_ITEM: { orderId: string; itemData: CreateOrderItemDTO };
    UPDATE_ITEM: { orderId: string; itemId: string; itemData: Partial<CreateOrderItemDTO> };
    DELETE_ITEM: { orderId: string; itemId: string };
    PAYMENT: { orderId: string; paymentData: { payment_method_id: string; amount: number; amount_received?: number } };
    UPDATE_QUEUE_STATUS: { queueId: string; status: QueueStatus };
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
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const readQueue = (): OfflineAction[] => {
    if (typeof window === 'undefined') return [];
    const queueString = localStorage.getItem(QUEUE_KEY);
    return queueString ? JSON.parse(queueString) : [];
};

const pruneOld = (items: OfflineAction[]) => {
    const now = Date.now();
    return items.filter(item => now - item.timestamp <= MAX_AGE_MS);
};

const writeQueue = (data: OfflineAction[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(QUEUE_KEY, JSON.stringify(data));
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
        const remaining = pruneOld(readQueue()).filter(a => a.retryCount <= MAX_RETRY);
        writeQueue(remaining);
    },
};

export const offlineQueuePolicy = {
    maxRetry: MAX_RETRY,
    backoff: (retryCount: number) => Math.min(30000, 2000 * retryCount),
};
