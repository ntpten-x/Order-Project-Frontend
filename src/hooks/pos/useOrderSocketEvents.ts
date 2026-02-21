import { useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { SocketContext } from '../../contexts/SocketContext';
import { useContext } from 'react';
import { ORDER_REALTIME_EVENTS } from '../../utils/pos/orderRealtimeEvents';
import { RealtimeEvents } from '../../utils/realtimeEvents';

import { SalesOrderItem } from '../../types/api/pos/salesOrderItem';

type SocketPayload = SalesOrderItem | { id?: string;[key: string]: unknown };

export const useOrderSocketEvents = () => {
    const { socket } = useContext(SocketContext);
    const queryClient = useQueryClient();
    const realtimeEvents = useMemo(
        () =>
            Array.from(
                new Set([
                    ...ORDER_REALTIME_EVENTS,
                    RealtimeEvents.tables.create,
                    RealtimeEvents.tables.update,
                    RealtimeEvents.tables.delete,
                ])
            ),
        []
    );

    useEffect(() => {
        if (!socket) return;

        const handleSocketEvent = (event: string, data: SocketPayload) => {
            // 1. Handle Kitchen Display System (KDS) specific updates mostly without refetching
            if (event.startsWith('salesOrderItem')) {
                // Type guard for SalesOrderItem
                const isItem = (d: SocketPayload): d is SalesOrderItem => {
                    return typeof d === 'object' && d !== null && 'order_id' in d;
                };

                if (isItem(data)) {
                    queryClient.setQueryData<SalesOrderItem[]>(['orderItems', 'kitchen'], (oldData = []) => {
                        if (!Array.isArray(oldData)) return oldData;

                        switch (event) {
                            case RealtimeEvents.salesOrderItem.create:
                                // Check if item already exists to avoid duplication
                                if (oldData.some(item => item.id === data.id)) return oldData;
                                // Only add if it matches KDS criteria (Pending/Cooking) - logic duplicated from page slightly
                                // safely we can append it, the page sort will handle it
                                return [...oldData, data];

                            case RealtimeEvents.salesOrderItem.update:
                                return oldData.map(item => item.id === data.id ? { ...item, ...data } : item);

                            case RealtimeEvents.salesOrderItem.delete:
                                return oldData.filter(item => item.id !== data.id);

                            default:
                                return oldData;
                        }
                    });
                }

                // We still invalidate stats as they are aggregate
                queryClient.invalidateQueries({ queryKey: ['channelStats'] });
            }

            // 2. Global invalidation for Order lists (Status changes, Tables, etc)
            // We use invalidation because complex filtering rules on order lists make manual cache updates risky
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['ordersSummary'] });
            queryClient.invalidateQueries({ queryKey: ['tables'] });

            // Fallback for kitchen if we didn't handle it manually (e.g. bulk updates) or just to be safe eventual consistency
            if (!event.startsWith('salesOrderItem')) {
                queryClient.invalidateQueries({ queryKey: ['orderItems', 'kitchen'] });
            }
        };

        const listeners: Array<{ event: string; handler: (data: SocketPayload) => void }> = [];

        realtimeEvents.forEach((event) => {
            const handler = (data: SocketPayload) => handleSocketEvent(event, data);
            socket.on(event, handler);
            listeners.push({ event, handler });
        });

        return () => {
            listeners.forEach(({ event, handler }) => {
                socket.off(event, handler);
            });
        };
    }, [socket, queryClient, realtimeEvents]);
};
