import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext, useEffect } from "react";
import { SocketContext } from "../../contexts/SocketContext";
import { deliveryService } from "../../services/pos/delivery.service";
import { Delivery } from "../../types/api/pos/delivery";
import { RealtimeEvents } from "../../utils/realtimeEvents";

export function useDelivery() {
    const { socket, isConnected } = useContext(SocketContext);
    const queryClient = useQueryClient();
    const { data, error, isLoading, refetch } = useQuery<Delivery[]>({
        queryKey: ['delivery'],
        queryFn: async () => {
            const result = await deliveryService.getAll();
            return result.data;
        },
        staleTime: isConnected ? 30_000 : 7_500,
        refetchInterval: isConnected ? false : 20_000,
        refetchIntervalInBackground: false,
        refetchOnReconnect: true,
    });

    useEffect(() => {
        if (!socket) return;

        const handleUpdate = () => {
            queryClient.invalidateQueries({ queryKey: ['delivery'] });
        };

        socket.on(RealtimeEvents.delivery.create, handleUpdate);
        socket.on(RealtimeEvents.delivery.update, handleUpdate);
        socket.on(RealtimeEvents.delivery.delete, handleUpdate);

        return () => {
            socket.off(RealtimeEvents.delivery.create, handleUpdate);
            socket.off(RealtimeEvents.delivery.update, handleUpdate);
            socket.off(RealtimeEvents.delivery.delete, handleUpdate);
        };
    }, [socket, queryClient]);

    return {
        deliveryProviders: data || [],
        isLoading,
        isError: error,
        mutate: refetch,
    };
}
