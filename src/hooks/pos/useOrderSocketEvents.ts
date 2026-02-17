import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { SocketContext } from '../../contexts/SocketContext';
import { useContext } from 'react';
import { ORDER_REALTIME_EVENTS } from '../../utils/pos/orderRealtimeEvents';

export const useOrderSocketEvents = () => {
    const { socket } = useContext(SocketContext);
    const queryClient = useQueryClient();
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!socket) return;

        const invalidateRealtimeQueries = () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['ordersSummary'] });
            queryClient.invalidateQueries({ queryKey: ['channelStats'] });
            queryClient.invalidateQueries({ queryKey: ['tables'] });
        };

        const handleOrderChange = () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
            debounceRef.current = setTimeout(() => {
                debounceRef.current = null;
                invalidateRealtimeQueries();
            }, 200);
        };

        ORDER_REALTIME_EVENTS.forEach((event) => socket.on(event, handleOrderChange));

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
                debounceRef.current = null;
            }
            ORDER_REALTIME_EVENTS.forEach((event) => socket.off(event, handleOrderChange));
        };
    }, [socket, queryClient]);
};
