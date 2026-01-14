import useSWR from "swr";
import { deliveryService } from "../../services/pos/delivery.service";
import { Delivery } from "../../types/api/pos/delivery";

export function useDelivery() {
    const { data, error, isLoading, mutate } = useSWR<Delivery[]>(
        `/pos/delivery`,
        () => deliveryService.getAll(),
        {
            revalidateOnFocus: true,
            dedupingInterval: 5000,
        }
    );

    return {
        deliveryProviders: data || [],
        isLoading,
        isError: error,
        mutate,
    };
}
