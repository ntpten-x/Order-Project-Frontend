import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { SocketContext } from '../../contexts/SocketContext';
import { useContext } from 'react';
import { RealtimeEvents } from '../../utils/realtimeEvents';

export const useOrderSocketEvents = () => {
    const { socket } = useContext(SocketContext);
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!socket) return;

        const handleOrderChange = () => {
            // Invalidate both orders lists and summaries to ensure fresh data
            // This is more robust than manual cache patching and prevents desync
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['ordersSummary'] });
        };

        const handleCreate = () => {
            // For creation, we might want to be more specific or just refresh everything
            handleOrderChange();
        };

        const handleUpdate = () => {
            handleOrderChange();
        };

        const handleDelete = () => {
            handleOrderChange();
        };

        // Channel listeners
        socket.on(RealtimeEvents.orders.create, handleCreate);
        socket.on(RealtimeEvents.orders.update, handleUpdate);
        socket.on(RealtimeEvents.orders.delete, handleDelete);

        // Also listen for payment updates as they affect order status
        socket.on(RealtimeEvents.payments.create, handleUpdate);
        socket.on(RealtimeEvents.payments.update, handleUpdate);
        // Sales order item/detail changes affect order totals and views
        socket.on(RealtimeEvents.salesOrderItem.create, handleUpdate);
        socket.on(RealtimeEvents.salesOrderItem.update, handleUpdate);
        socket.on(RealtimeEvents.salesOrderItem.delete, handleUpdate);
        socket.on(RealtimeEvents.salesOrderDetail.create, handleUpdate);
        socket.on(RealtimeEvents.salesOrderDetail.update, handleUpdate);
        socket.on(RealtimeEvents.salesOrderDetail.delete, handleUpdate);

        return () => {
            socket.off(RealtimeEvents.orders.create, handleCreate);
            socket.off(RealtimeEvents.orders.update, handleUpdate);
            socket.off(RealtimeEvents.orders.delete, handleDelete);
            socket.off(RealtimeEvents.payments.create, handleUpdate);
            socket.off(RealtimeEvents.payments.update, handleUpdate);
            socket.off(RealtimeEvents.salesOrderItem.create, handleUpdate);
            socket.off(RealtimeEvents.salesOrderItem.update, handleUpdate);
            socket.off(RealtimeEvents.salesOrderItem.delete, handleUpdate);
            socket.off(RealtimeEvents.salesOrderDetail.create, handleUpdate);
            socket.off(RealtimeEvents.salesOrderDetail.update, handleUpdate);
            socket.off(RealtimeEvents.salesOrderDetail.delete, handleUpdate);
        };
    }, [socket, queryClient]);
};
