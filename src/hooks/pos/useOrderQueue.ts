import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useContext, useEffect } from 'react';
import { SocketContext } from '../../contexts/SocketContext';
import { orderQueueService } from '../../services/pos/orderQueue.service';
import { OrderQueue, QueueStatus, CreateOrderQueueDTO, UpdateOrderQueueStatusDTO } from '../../types/api/pos/orderQueue';
import { message } from 'antd';
import { RealtimeEvents } from '../../utils/realtimeEvents';

export function useOrderQueue(status?: QueueStatus) {
    const { socket } = useContext(SocketContext);
    const queryClient = useQueryClient();
    const queryKey = ['orderQueue', status || 'all'];

    const { data = [], isLoading, refetch } = useQuery<OrderQueue[]>({
        queryKey,
        queryFn: async () => {
            return await orderQueueService.getAll(undefined, status);
        },
        staleTime: 2000,
    });

    // Real-time updates
    useEffect(() => {
        if (!socket) return;

        const upsert = (list: OrderQueue[], item: OrderQueue): OrderQueue[] => {
            const idx = list.findIndex((q) => q.id === item.id);
            if (idx === -1) return [item, ...list];
            const next = list.slice();
            next[idx] = item;
            return next;
        };

        const removeById = (list: OrderQueue[], id: string): OrderQueue[] => list.filter((q) => q.id !== id);

        const sortQueue = (list: OrderQueue[]): OrderQueue[] => {
            const priorityOrder: Record<string, number> = { Urgent: 4, High: 3, Normal: 2, Low: 1 };
            return list
                .slice()
                .sort((a, b) => {
                    const p = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
                    if (p !== 0) return p;
                    return (a.queue_position || 0) - (b.queue_position || 0);
                });
        };

        const patchAll = (fn: (existing: OrderQueue[], key: unknown[]) => OrderQueue[]) => {
            const entries = queryClient.getQueriesData<OrderQueue[]>({ queryKey: ['orderQueue'] });
            entries.forEach(([key, existing]) => {
                if (!existing) return;
                queryClient.setQueryData<OrderQueue[]>(key, fn(existing, key as unknown[]));
            });
        };

        const handleAdded = (item: OrderQueue) => {
            patchAll((existing, key) => {
                const keyStatus = key[1] as QueueStatus | 'all' | undefined;
                const allow = keyStatus === 'all' || !keyStatus || item.status === keyStatus;
                if (!allow) return existing;
                return sortQueue(upsert(existing, item));
            });
        };

        const handleUpdated = (item: OrderQueue) => {
            patchAll((existing, key) => {
                const keyStatus = key[1] as QueueStatus | 'all' | undefined;
                const allow = keyStatus === 'all' || !keyStatus || item.status === keyStatus;
                const cleaned = removeById(existing, item.id);
                return allow ? sortQueue(upsert(cleaned, item)) : cleaned;
            });
        };

        const handleRemoved = (payload: { id: string }) => {
            patchAll((existing) => removeById(existing, payload.id));
        };

        const handleReordered = (payload: { updates?: Array<{ id: string; queue_position: number; priority?: OrderQueue['priority'] }> }) => {
            if (!payload?.updates?.length) {
                queryClient.invalidateQueries({ queryKey: ['orderQueue', status || 'all'], exact: true });
                return;
            }
            const map = new Map(payload.updates.map((u) => [u.id, u]));
            patchAll((existing) => {
                const next = existing.map((q) => {
                    const u = map.get(q.id);
                    if (!u) return q;
                    return { ...q, queue_position: u.queue_position, ...(u.priority ? { priority: u.priority } : {}) };
                });
                return sortQueue(next);
            });
        };

        socket.on(RealtimeEvents.orderQueue.added, handleAdded);
        socket.on(RealtimeEvents.orderQueue.updated, handleUpdated);
        socket.on(RealtimeEvents.orderQueue.removed, handleRemoved);
        socket.on(RealtimeEvents.orderQueue.reordered, handleReordered);

        return () => {
            socket.off(RealtimeEvents.orderQueue.added, handleAdded);
            socket.off(RealtimeEvents.orderQueue.updated, handleUpdated);
            socket.off(RealtimeEvents.orderQueue.removed, handleRemoved);
            socket.off(RealtimeEvents.orderQueue.reordered, handleReordered);
        };
    }, [socket, queryClient, status]);

    const addToQueueMutation = useMutation({
        mutationFn: (data: CreateOrderQueueDTO) => orderQueueService.addToQueue(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey, exact: true });
            message.success('เพิ่มออเดอร์เข้าคิวสำเร็จ');
        },
        onError: (error: Error) => {
            message.error(error.message || 'ไม่สามารถเพิ่มออเดอร์เข้าคิวได้');
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateOrderQueueStatusDTO }) =>
            orderQueueService.updateStatus(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey, exact: true });
            message.success('อัปเดตสถานะสำเร็จ');
        },
        onError: (error: Error) => {
            message.error(error.message || 'ไม่สามารถอัปเดตสถานะได้');
        },
    });

    const removeFromQueueMutation = useMutation({
        mutationFn: (id: string) => orderQueueService.removeFromQueue(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey, exact: true });
            message.success('ลบออกจากคิวสำเร็จ');
        },
        onError: (error: Error) => {
            message.error(error.message || 'ไม่สามารถลบออกจากคิวได้');
        },
    });

    const reorderQueueMutation = useMutation({
        mutationFn: () => orderQueueService.reorderQueue(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey, exact: true });
            message.success('จัดเรียงคิวใหม่สำเร็จ');
        },
        onError: (error: Error) => {
            message.error(error.message || 'ไม่สามารถจัดเรียงคิวใหม่ได้');
        },
    });

    return {
        queue: data,
        isLoading,
        refetch,
        addToQueue: addToQueueMutation.mutate,
        updateStatus: updateStatusMutation.mutate,
        removeFromQueue: removeFromQueueMutation.mutate,
        reorderQueue: reorderQueueMutation.mutate,
        isAdding: addToQueueMutation.isPending,
        isUpdating: updateStatusMutation.isPending,
        isRemoving: removeFromQueueMutation.isPending,
        isReordering: reorderQueueMutation.isPending,
    };
}
