import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext, useEffect } from "react";
import { SocketContext } from "@/contexts/SocketContext";
import { deliveryService } from "../../services/pos/delivery.service";
import { Delivery } from "../../types/api/pos/delivery";

export function useDelivery() {
    const { socket } = useContext(SocketContext);
    const queryClient = useQueryClient();
    const { data, error, isLoading, refetch } = useQuery<Delivery[]>({
        queryKey: ['delivery'],
        queryFn: () => deliveryService.getAll(),
        staleTime: 5000,
    });

    useEffect(() => {
        if (!socket) return;

        const handleUpdate = () => {
            queryClient.invalidateQueries({ queryKey: ['delivery'] });
        };

        socket.on("delivery:create", handleUpdate);
        socket.on("delivery:update", handleUpdate);
        socket.on("delivery:delete", handleUpdate);

        return () => {
            socket.off("delivery:create", handleUpdate);
            socket.off("delivery:update", handleUpdate);
            socket.off("delivery:delete", handleUpdate);
        };
    }, [socket, queryClient]);

    return {
        deliveryProviders: data || [],
        isLoading,
        isError: error,
        mutate: refetch,
    };
}
