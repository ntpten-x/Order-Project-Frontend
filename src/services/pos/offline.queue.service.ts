
export interface OfflineAction {
    id: string;
    type: 'CREATE_ORDER' | 'ADD_ITEM';
    payload: any;
    timestamp: number;
    retryCount: number;
}

const QUEUE_KEY = 'pos_offline_queue';

export const offlineQueueService = {
    addToQueue: (type: OfflineAction['type'], payload: any) => {
        const currentQueue = offlineQueueService.getQueue();
        const newAction: OfflineAction = {
            id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type,
            payload,
            timestamp: Date.now(),
            retryCount: 0
        };
        const updatedQueue = [...currentQueue, newAction];
        if (typeof window !== 'undefined') {
            localStorage.setItem(QUEUE_KEY, JSON.stringify(updatedQueue));
        }
        return newAction;
    },

    getQueue: (): OfflineAction[] => {
        if (typeof window === 'undefined') return [];
        const queueString = localStorage.getItem(QUEUE_KEY);
        return queueString ? JSON.parse(queueString) : [];
    },

    removeFromQueue: (id: string) => {
        const currentQueue = offlineQueueService.getQueue();
        const updatedQueue = currentQueue.filter(action => action.id !== id);
        if (typeof window !== 'undefined') {
            localStorage.setItem(QUEUE_KEY, JSON.stringify(updatedQueue));
        }
    },

    clearQueue: () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(QUEUE_KEY);
        }
    },

    // Optional: Update request inside queue if needed (e.g. correct ID)
};
