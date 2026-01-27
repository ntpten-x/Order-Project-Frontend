import { useQuery } from "@tanstack/react-query";
import { deliveryService } from "../../services/pos/delivery.service";
import { Delivery } from "../../types/api/pos/delivery";

export function useDelivery() {
    const { data, error, isLoading, refetch } = useQuery<Delivery[]>({
        queryKey: ['delivery'],
        queryFn: () => deliveryService.getAll(),
        staleTime: 5000,
    });

    return {
        deliveryProviders: data || [],
        isLoading,
        isError: error,
        mutate: refetch,
    };
}
