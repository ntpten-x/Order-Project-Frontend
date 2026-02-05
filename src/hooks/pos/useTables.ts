import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext, useEffect } from "react";
import { SocketContext } from "../../contexts/SocketContext";
import { Tables } from "../../types/api/pos/tables";
import { tablesService } from "../../services/pos/tables.service";
import { RealtimeEvents } from "../../utils/realtimeEvents";

export function useTables() {
    const { socket } = useContext(SocketContext);
    const queryClient = useQueryClient();

    const { data, error, isLoading, refetch } = useQuery<Tables[]>({
        queryKey: ['tables'],
        queryFn: async () => {
            const result = await tablesService.getAll();
            return result.data;
        },
        staleTime: 2000,
        refetchOnReconnect: true
    });

    useEffect(() => {
        if (!socket) return;

        const handleTableUpdate = () => {
            queryClient.invalidateQueries({ queryKey: ['tables'] });
        };

        // Listen for table events
        socket.on(RealtimeEvents.tables.create, handleTableUpdate);
        socket.on(RealtimeEvents.tables.update, handleTableUpdate);
        socket.on(RealtimeEvents.tables.delete, handleTableUpdate);

        // Also listen for order events as they affect table status (active_order_status)
        socket.on(RealtimeEvents.orders.create, handleTableUpdate);
        socket.on(RealtimeEvents.orders.update, handleTableUpdate);
        socket.on(RealtimeEvents.orders.delete, handleTableUpdate);

        return () => {
            socket.off(RealtimeEvents.tables.create, handleTableUpdate);
            socket.off(RealtimeEvents.tables.update, handleTableUpdate);
            socket.off(RealtimeEvents.tables.delete, handleTableUpdate);
            socket.off(RealtimeEvents.orders.create, handleTableUpdate);
            socket.off(RealtimeEvents.orders.update, handleTableUpdate);
            socket.off(RealtimeEvents.orders.delete, handleTableUpdate);
        };
    }, [socket, queryClient]);

    return {
        tables: data || [],
        isLoading,
        isError: error,
        mutate: refetch, // Mapping refetch to mutate
    };
}
