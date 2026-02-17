import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { SocketContext } from '../../contexts/SocketContext';
import { useContext } from 'react';
import { ORDER_REALTIME_EVENTS } from '../../utils/pos/orderRealtimeEvents';

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

        ORDER_REALTIME_EVENTS.forEach((event) => socket.on(event, handleOrderChange));

        return () => {
            ORDER_REALTIME_EVENTS.forEach((event) => socket.off(event, handleOrderChange));
        };
    }, [socket, queryClient]);
};
