import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../useSocket'; // Assuming a useSocket hook exists or using context directly
import { SocketContext } from '../../contexts/SocketContext';
import { useContext } from 'react';

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
        socket.on('orders:create', handleCreate);
        socket.on('orders:update', handleUpdate);
        socket.on('orders:delete', handleDelete);

        // Also listen for payment updates as they affect order status
        socket.on('payments:create', handleUpdate);
        socket.on('payments:update', handleUpdate);

        return () => {
            socket.off('orders:create', handleCreate);
            socket.off('orders:update', handleUpdate);
            socket.off('orders:delete', handleDelete);
            socket.off('payments:create', handleUpdate);
            socket.off('payments:update', handleUpdate);
        };
    }, [socket, queryClient]);
};
