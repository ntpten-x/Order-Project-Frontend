import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useContext, useEffect } from 'react';
import { SocketContext } from '../../contexts/SocketContext';
import { orderQueueService } from '../../services/pos/orderQueue.service';
import { OrderQueue, QueueStatus, CreateOrderQueueDTO, UpdateOrderQueueStatusDTO } from '../../types/api/pos/orderQueue';
import { message } from 'antd';

export function useOrderQueue(status?: QueueStatus) {
    const { socket } = useContext(SocketContext);
    const queryClient = useQueryClient();
    const queryKey = ['orderQueue', status];

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

        const handleQueueUpdate = () => {
            queryClient.invalidateQueries({ queryKey: ['orderQueue'] });
        };

        socket.on('order-queue:added', handleQueueUpdate);
        socket.on('order-queue:updated', handleQueueUpdate);
        socket.on('order-queue:removed', handleQueueUpdate);
        socket.on('order-queue:reordered', handleQueueUpdate);

        return () => {
            socket.off('order-queue:added', handleQueueUpdate);
            socket.off('order-queue:updated', handleQueueUpdate);
            socket.off('order-queue:removed', handleQueueUpdate);
            socket.off('order-queue:reordered', handleQueueUpdate);
        };
    }, [socket, queryClient]);

    const addToQueueMutation = useMutation({
        mutationFn: (data: CreateOrderQueueDTO) => orderQueueService.addToQueue(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orderQueue'] });
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
            queryClient.invalidateQueries({ queryKey: ['orderQueue'] });
            message.success('อัปเดตสถานะสำเร็จ');
        },
        onError: (error: Error) => {
            message.error(error.message || 'ไม่สามารถอัปเดตสถานะได้');
        },
    });

    const removeFromQueueMutation = useMutation({
        mutationFn: (id: string) => orderQueueService.removeFromQueue(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orderQueue'] });
            message.success('ลบออกจากคิวสำเร็จ');
        },
        onError: (error: Error) => {
            message.error(error.message || 'ไม่สามารถลบออกจากคิวได้');
        },
    });

    const reorderQueueMutation = useMutation({
        mutationFn: () => orderQueueService.reorderQueue(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orderQueue'] });
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
