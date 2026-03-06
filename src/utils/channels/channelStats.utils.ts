import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { SocketContext } from "../../contexts/SocketContext";
import { ordersService } from "../../services/pos/orders.service";
import { RealtimeEvents } from "../realtimeEvents";
import {
    shouldDisableInvalidateDebounce,
    trackInvalidateExecuted,
    trackInvalidateRequested
} from "../pos/invalidateProfiler";

/**
 * Statistics for each sales channel showing active order counts
 */
export interface ChannelStats {
    dineIn: number;
    takeaway: number;
    takeaway_waiting_payment: number;
    delivery: number;
    delivery_waiting_payment: number;
    total: number;
}

/**
 * Custom hook to fetch channel statistics with WebSocket updates
 */
export function useChannelStats() {
    const { socket, isConnected } = useContext(SocketContext);
    const queryClient = useQueryClient();
    const invalidateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const refreshEvents = useMemo(
        () => [
            RealtimeEvents.orders.create,
            RealtimeEvents.orders.update,
            RealtimeEvents.orders.delete,
            RealtimeEvents.payments.create,
            RealtimeEvents.payments.update,
            RealtimeEvents.payments.delete,
            RealtimeEvents.tables.create,
            RealtimeEvents.tables.update,
            RealtimeEvents.tables.delete,
        ],
        []
    );
    const scheduleStatsInvalidate = useCallback(
        (delayMs = 220) => {
            const queryKey = ["channelStats"] as const;
            trackInvalidateRequested(queryKey);

            if (shouldDisableInvalidateDebounce()) {
                queryClient.invalidateQueries({ queryKey });
                trackInvalidateExecuted(queryKey);
                return;
            }

            if (invalidateTimerRef.current) {
                clearTimeout(invalidateTimerRef.current);
            }
            invalidateTimerRef.current = setTimeout(() => {
                invalidateTimerRef.current = null;
                queryClient.invalidateQueries({ queryKey });
                trackInvalidateExecuted(queryKey);
            }, delayMs);
        },
        [queryClient]
    );

    // Fetch initial data, disable auto-polling (rely on socket)
    const { data, error, isLoading } = useQuery<ChannelStats>({
        queryKey: ['channelStats'],
        queryFn: async () => {
            return await ordersService.getStats();
        },
        staleTime: isConnected ? 45_000 : 7_500,
        refetchOnReconnect: true,
        refetchOnWindowFocus: false,
        refetchInterval: isConnected ? false : 15_000,
        refetchIntervalInBackground: false,
    });

    useEffect(() => {
        if (!socket) return;

        const handleOrderUpdate = () => {
            // Batch socket bursts to avoid redundant refetch storms.
            scheduleStatsInvalidate();
        };

        refreshEvents.forEach((event) => socket.on(event, handleOrderUpdate));

        return () => {
            refreshEvents.forEach((event) => socket.off(event, handleOrderUpdate));
            if (invalidateTimerRef.current) {
                clearTimeout(invalidateTimerRef.current);
                invalidateTimerRef.current = null;
            }
        };
    }, [socket, refreshEvents, scheduleStatsInvalidate]);

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
