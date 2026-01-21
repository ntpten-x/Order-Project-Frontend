import useSWR from "swr";
import { useContext, useEffect } from "react";
import { SocketContext } from "@/contexts/SocketContext";

/**
 * Statistics for each sales channel showing active order counts
 */
export interface ChannelStats {
    dineIn: number;
    takeaway: number;
    delivery: number;
    total: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * Custom hook to fetch channel statistics with WebSocket updates
 */
export function useChannelStats() {
    const { socket } = useContext(SocketContext);

    // Fetch initial data, disable auto-polling (rely on socket)
    const { data, error, isLoading, mutate } = useSWR<ChannelStats>(
        "/api/pos/channels/stats",
        fetcher,
        {
            revalidateOnFocus: true,
            dedupingInterval: 2000,
            revalidateOnReconnect: true
        }
    );

    useEffect(() => {
        if (!socket) return;

        const handleOrderUpdate = () => {
            // Re-fetch stats when orders change
            mutate();
        };

        // Listen for relevant events
        socket.on("orders:create", handleOrderUpdate);
        socket.on("orders:update", handleOrderUpdate);
        socket.on("orders:delete", handleOrderUpdate);

        // Also listen for table updates as they might affect Dine In status technically, 
        // though stats are based on orders. Safe to just listen to orders.

        return () => {
            socket.off("orders:create", handleOrderUpdate);
            socket.off("orders:update", handleOrderUpdate);
            socket.off("orders:delete", handleOrderUpdate);
        };
    }, [socket, mutate]);

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
