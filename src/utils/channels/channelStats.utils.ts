import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext, useEffect, useMemo } from "react";
import { SocketContext } from "../../contexts/SocketContext";
import { ordersService } from "../../services/pos/orders.service";
import { RealtimeEvents } from "../realtimeEvents";
import { ORDER_REALTIME_EVENTS } from "../pos/orderRealtimeEvents";

/**
 * Statistics for each sales channel showing active order counts
 */
export interface ChannelStats {
    dineIn: number;
    takeaway: number;
    delivery: number;
    total: number;
}

/**
 * Custom hook to fetch channel statistics with WebSocket updates
 */
export function useChannelStats() {
    const { socket, isConnected } = useContext(SocketContext);
    const queryClient = useQueryClient();
    const refreshEvents = useMemo(
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

    // Fetch initial data, disable auto-polling (rely on socket)
    const { data, error, isLoading } = useQuery<ChannelStats>({
        queryKey: ['channelStats'],
        queryFn: async () => {
            return await ordersService.getStats();
        },
        staleTime: isConnected ? 30_000 : 7_500,
        refetchOnReconnect: true,
        refetchInterval: isConnected ? false : 15_000,
        refetchIntervalInBackground: false,
    });

    useEffect(() => {
        if (!socket) return;

        const handleOrderUpdate = () => {
            // Re-fetch stats when orders change
            queryClient.invalidateQueries({ queryKey: ['channelStats'] });
        };

        refreshEvents.forEach((event) => socket.on(event, handleOrderUpdate));

        return () => {
            refreshEvents.forEach((event) => socket.off(event, handleOrderUpdate));
        };
    }, [socket, queryClient, refreshEvents]);

    return {
        stats: data,
        isLoading,
        isError: error
    };
}

/**
 * Format order count for display
 * 
 * @param count - Number of orders
 * @returns Formatted string (e.g., "3 ออเดอร์", "ว่าง")
 */
export function formatOrderCount(count: number): string {
    if (count === 0) {
        return "ว่าง"; // "Empty"
    }
    if (count === 1) {
        return "1 ออเดอร์";
    }
    return `${count} ออเดอร์`;
}
