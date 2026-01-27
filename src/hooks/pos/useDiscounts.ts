import { useQuery } from '@tanstack/react-query';
import { discountsService } from '../../services/pos/discounts.service';
import { Discounts } from '../../types/api/pos/discounts';

export function useDiscounts() {
    const { data, error, isLoading, refetch } = useQuery<Discounts[]>({
        queryKey: ['discounts'],
        queryFn: () => discountsService.getAll(),
        staleTime: 5000,
    });

    return {
        discounts: data || [],
        isLoading,
        isError: error,
        mutate: refetch,
    };
}
